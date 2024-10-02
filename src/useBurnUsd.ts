import { useMutation } from '@tanstack/react-query';
import type { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { fetchBurnUsd } from './fetchBurnUsd';
import { fetchBurnUsdWithPriceUpdate } from './fetchBurnUsdWithPriceUpdate';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useErrorParser } from './useErrorParser';
import { useImportContract, useImportSystemToken } from './useImports';
import { useSynthetix } from './useSynthetix';

export function useBurnUsd({
  provider,
  walletAddress,
  accountId,
  collateralTypeTokenAddress,
  poolId,
  onSuccess,
}: {
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  accountId?: ethers.BigNumber;
  collateralTypeTokenAddress?: string;
  poolId?: ethers.BigNumber;
  onSuccess: () => void;
}) {
  const { chainId, queryClient } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: systemToken } = useImportSystemToken();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

  const { data: priceIds } = useAllPriceFeeds();

  return useMutation({
    retry: false,
    mutationFn: async (burnUsdAmount: ethers.BigNumber) => {
      if (
        !(
          chainId &&
          provider &&
          walletAddress &&
          accountId &&
          poolId &&
          collateralTypeTokenAddress &&
          systemToken &&
          CoreProxyContract &&
          MulticallContract &&
          PythERC7412WrapperContract &&
          priceIds
        )
      ) {
        throw 'OMFG';
      }

      if (burnUsdAmount.eq(0)) {
        throw new Error('Amount required');
      }

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
      console.log({ freshPriceUpdateTxn });

      const freshAccountAvailableUsd = await fetchAccountAvailableCollateral({
        provider,
        CoreProxyContract,
        accountId,
        tokenAddress: systemToken.address,
      });
      console.log({ freshAccountAvailableUsd });

      const hasEnoughDeposit = freshAccountAvailableUsd.gte(burnUsdAmount);
      if (!hasEnoughDeposit) {
        throw new Error(`Not enough deposited ${systemToken.symbol}`);
      }

      if (freshPriceUpdateTxn.value) {
        console.log('-> burnUsdWithPriceUpdate');
        await fetchBurnUsdWithPriceUpdate({
          provider,
          walletAddress,
          CoreProxyContract,
          MulticallContract,
          accountId,
          poolId,
          tokenAddress: collateralTypeTokenAddress,
          burnUsdAmount,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
        return { priceUpdated: true };
      }

      console.log('-> burnUsd');
      await fetchBurnUsd({
        provider,
        walletAddress,
        CoreProxyContract,
        accountId,
        poolId,
        tokenAddress: collateralTypeTokenAddress,
        burnUsdAmount,
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
          queryKey: [chainId, 'PriceUpdateTxn', { priceIds: priceIds?.map((p) => p.slice(0, 8)) }],
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
            tokenAddress: collateralTypeTokenAddress,
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
