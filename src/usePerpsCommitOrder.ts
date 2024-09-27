import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { fetchPerpsCommitOrder } from './fetchPerpsCommitOrder';
import { fetchPerpsCommitOrderWithPriceUpdate } from './fetchPerpsCommitOrderWithPriceUpdate';
import { fetchPerpsGetAvailableMargin } from './fetchPerpsGetAvailableMargin';
import { fetchPerpsTotalCollateralValue } from './fetchPerpsTotalCollateralValue';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { getPythPrice } from './getPythPrice';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

export function usePerpsCommitOrder({
  perpsAccountId,
  marketId,
  provider,
  walletAddress,
  feedId,
  settlementStrategyId,
  onSuccess,
}: {
  perpsAccountId?: ethers.BigNumber;
  marketId: string;
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  feedId?: string;
  settlementStrategyId?: string;
  onSuccess: () => void;
}) {
  const { chainId, queryClient } = useSynthetix();
  const { data: priceIds } = useAllPriceFeeds();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

  const errorParser = useErrorParser();

  return useMutation({
    retry: false,
    mutationFn: async (sizeDelta: ethers.BigNumber) => {
      if (
        !(
          chainId &&
          perpsAccountId &&
          settlementStrategyId &&
          priceIds &&
          PerpsMarketProxyContract?.address &&
          MulticallContract?.address &&
          PythERC7412WrapperContract?.address &&
          walletAddress &&
          feedId &&
          provider
        )
      ) {
        throw 'OMFG';
      }

      if (sizeDelta.lte(0)) {
        throw new Error('Amount required');
      }

      const availableMargin = await fetchPerpsGetAvailableMargin({
        provider,
        perpsAccountId,
        PerpsMarketProxyContract,
      });

      if (availableMargin.lt(sizeDelta)) {
        throw new Error('Not enough available margin');
      }

      const totalCollateralValue = await fetchPerpsTotalCollateralValue({
        provider,
        PerpsMarketProxyContract,
        perpsAccountId,
      });

      if (totalCollateralValue.lt(sizeDelta)) {
        throw new Error('Total collateral value is less than the size delta');
      }

      const pythPrice = await getPythPrice({ feedId });

      const orderCommitmentArgs = {
        marketId,
        accountId: perpsAccountId,
        sizeDelta,
        settlementStrategyId,
        acceptablePrice: ethers.utils.parseEther(Math.floor(pythPrice * (sizeDelta.gt(0) ? 1.05 : 0.95)).toString()),
        referrer: ethers.constants.AddressZero,
        trackingCode: ethers.utils.formatBytes32String('VD'),
      };

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
      console.log('freshPriceUpdateTxn', freshPriceUpdateTxn);

      if (freshPriceUpdateTxn.value) {
        console.log('-> fetchPerpsCommitOrderWithPriceUpdate');
        await fetchPerpsCommitOrderWithPriceUpdate({
          walletAddress,
          provider,
          PerpsMarketProxyContract,
          MulticallContract,
          orderCommitmentArgs,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
        return { priceUpdated: true };
      }

      console.log('-> fetchPerpsCommitOrder');
      await fetchPerpsCommitOrder({
        walletAddress,
        provider,
        PerpsMarketProxyContract,
        orderCommitmentArgs,
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
      queryClient.invalidateQueries({
        queryKey: [chainId, 'PerpsGetOrder', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'Perps GetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
      onSuccess();
    },
  });
}
