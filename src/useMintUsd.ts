import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchMintUsd } from './fetchMintUsd';
import { fetchMintUsdWithPriceUpdate } from './fetchMintUsdWithPriceUpdate';
import { useErrorParser } from './useErrorParser';
import { useImportContract, useImportSystemToken } from './useImports';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useMintUsd');

export function useMintUsd({
  provider,
  walletAddress,
  accountId,
  collateralTypeTokenAddress,
  poolId,
  onSuccess,
}: {
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  accountId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
  poolId?: ethers.BigNumberish;
  onSuccess: () => void;
}) {
  const { chainId, preset, queryClient } = useSynthetix();
  const { data: systemToken } = useImportSystemToken();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: MulticallContract } = useImportContract('Multicall');

  const { data: priceUpdateTxn } = usePriceUpdateTxn({ provider });

  const errorParser = useErrorParser();

  return useMutation({
    retry: false,
    mutationFn: async (mintUsdAmount: ethers.BigNumberish) => {
      if (
        !(
          chainId &&
          preset &&
          provider &&
          walletAddress &&
          CoreProxyContract &&
          MulticallContract &&
          priceUpdateTxn &&
          accountId &&
          poolId &&
          collateralTypeTokenAddress
        )
      ) {
        throw 'OMFG';
      }

      log({
        chainId,
        preset,
        walletAddress,
        CoreProxyContract,
        MulticallContract,
        priceUpdateTxn,
        accountId,
        poolId,
        collateralTypeTokenAddress,
      });

      if (ethers.BigNumber.from(mintUsdAmount).eq(0)) {
        throw new Error('Amount required');
      }

      log('priceUpdateTxn: %O', priceUpdateTxn);

      if (priceUpdateTxn.value) {
        log('-> fetchMintUsdWithPriceUpdate');
        const { tx, txResult } = await fetchMintUsdWithPriceUpdate({
          provider,
          walletAddress,
          CoreProxyContract,
          MulticallContract,
          accountId,
          poolId,
          collateralTypeTokenAddress,
          mintUsdAmount,
          priceUpdateTxn,
        });
        return { priceUpdated: true, tx, txResult };
      }
      log('-> fetchMintUsd');
      const { tx, txResult } = await fetchMintUsd({
        walletAddress,
        provider,
        CoreProxyContract,
        accountId,
        poolId,
        collateralTypeTokenAddress,
        mintUsdAmount,
      });
      return { priceUpdated: false, tx, txResult };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: ({ priceUpdated }) => {
      if (!queryClient) return;

      if (priceUpdated) {
        queryClient.invalidateQueries({
          queryKey: [chainId, preset, 'PriceUpdateTxn'],
        });
      }

      // Intentionally do not await
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          preset,
          'PositionDebt',
          { CoreProxy: CoreProxyContract?.address, Multicall: MulticallContract?.address },
          {
            accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined,
            collateralTypeTokenAddress,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          preset,
          'AccountAvailableCollateral',
          { CoreProxy: CoreProxyContract?.address },
          {
            accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined,
            collateralTypeTokenAddress: systemToken?.address,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          preset,
          'AccountLastInteraction',
          { CoreProxy: CoreProxyContract?.address },
          { accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined },
        ],
      });

      onSuccess();
    },
  });
}
