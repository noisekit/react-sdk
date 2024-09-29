import { useMutation } from '@tanstack/react-query';
import type { ethers } from 'ethers';
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
  collateralTokenAddress,
  poolId,
  onSuccess,
}: {
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  accountId?: ethers.BigNumber;
  collateralTokenAddress?: string;
  poolId?: ethers.BigNumber;
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
    mutationFn: async (mintUsdAmount: ethers.BigNumber) => {
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
          collateralTokenAddress
        )
      ) {
        throw 'OMFG';
      }

      if (mintUsdAmount.eq(0)) {
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
          tokenAddress: collateralTokenAddress,
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
        tokenAddress: collateralTokenAddress,
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
            accountId: accountId?.toHexString(),
            tokenAddress: collateralTokenAddress,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          'AccountAvailableCollateral',
          { CoreProxy: CoreProxyContract?.address },
          {
            accountId: accountId?.toHexString(),
            tokenAddress: systemToken?.address,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'AccountLastInteraction', { CoreProxy: CoreProxyContract?.address }, { accountId: accountId?.toHexString() }],
      });

      onSuccess();
    },
  });
}
