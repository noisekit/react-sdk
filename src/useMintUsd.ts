import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { fetchMintUsd } from './fetchMintUsd';
import { fetchMintUsdWithPriceUpdate } from './fetchMintUsdWithPriceUpdate';
import { useErrorParser } from './useErrorParser';
import { useImportContract, useImportSystemToken } from './useImports';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useSynthetix } from './useSynthetix';

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
  const { chainId, queryClient } = useSynthetix();
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

      if (ethers.BigNumber.from(mintUsdAmount).eq(0)) {
        throw new Error('Amount required');
      }

      console.log({ priceUpdateTxn });

      if (priceUpdateTxn.value) {
        console.log('-> fetchMintUsdWithPriceUpdate');
        await fetchMintUsdWithPriceUpdate({
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
        return { priceUpdated: true };
      }
      console.log('-> fetchMintUsd');
      await fetchMintUsd({
        walletAddress,
        provider,
        CoreProxyContract,
        accountId,
        poolId,
        collateralTypeTokenAddress,
        mintUsdAmount,
      });
      return { priceUpdated: false };
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
          queryKey: [chainId, 'PriceUpdateTxn'],
        });
      }

      // Intentionally do not await
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
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
          'AccountLastInteraction',
          { CoreProxy: CoreProxyContract?.address },
          { accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined },
        ],
      });

      onSuccess();
    },
  });
}
