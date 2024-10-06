import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
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
  accountId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
  poolId?: ethers.BigNumberish;
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
    mutationFn: async (burnUsdAmount: ethers.BigNumberish) => {
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

      if (ethers.BigNumber.from(burnUsdAmount).eq(0)) {
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
        collateralTypeTokenAddress: systemToken.address,
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
          collateralTypeTokenAddress,
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
        collateralTypeTokenAddress,
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
