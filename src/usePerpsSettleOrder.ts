import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import type { ethers } from 'ethers';
import { fetchPerpsSettleOrder } from './fetchPerpsSettleOrder';
import { fetchPerpsSettleOrderWithPriceUpdate } from './fetchPerpsSettleOrderWithPriceUpdate';
import { fetchStrictPriceUpdateTxn } from './fetchStrictPriceUpdateTxn';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { usePerpsGetOrder } from './usePerpsGetOrder';
import { usePerpsGetSettlementStrategy } from './usePerpsGetSettlementStrategy';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePerpsSettleOrder');

export function usePerpsSettleOrder({
  provider,
  walletAddress,
  perpsMarketId,
  perpsAccountId,
  settlementStrategyId,
}: {
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  perpsMarketId?: ethers.BigNumberish;
  perpsAccountId?: ethers.BigNumberish;
  settlementStrategyId?: ethers.BigNumberish;
}) {
  const { chainId, queryClient } = useSynthetix();
  const errorParser = useErrorParser();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');
  const { data: settlementStrategy } = usePerpsGetSettlementStrategy({ provider, perpsMarketId, settlementStrategyId });
  const { data: order } = usePerpsGetOrder({ provider, perpsAccountId });

  return useMutation({
    retry: false,
    mutationFn: async () => {
      if (
        !(
          chainId &&
          provider &&
          walletAddress &&
          PerpsMarketProxyContract?.address &&
          MulticallContract?.address &&
          PythERC7412WrapperContract?.address &&
          perpsAccountId &&
          perpsMarketId &&
          settlementStrategy &&
          order
        )
      ) {
        throw 'OMFG';
      }

      log({
        chainId,
        provider,
        walletAddress,
        PerpsMarketProxyContract,
        MulticallContract,
        PythERC7412WrapperContract,
        perpsAccountId,
        perpsMarketId,
        settlementStrategy,
        order,
      });

      const freshStrictPriceUpdateTxn = await fetchStrictPriceUpdateTxn({
        commitmentTime: order.commitmentTime,
        feedId: settlementStrategy.feedId,
        commitmentPriceDelay: settlementStrategy.commitmentPriceDelay,
        PythERC7412WrapperContract,
      });
      log({ freshStrictPriceUpdateTxn });

      if (freshStrictPriceUpdateTxn.value) {
        log('-> fetchPerpsSettleOrderWithPriceUpdate');
        const { tx, txResult } = await fetchPerpsSettleOrderWithPriceUpdate({
          provider,
          walletAddress,
          PerpsMarketProxyContract,
          MulticallContract,
          perpsAccountId,
          priceUpdateTxn: freshStrictPriceUpdateTxn,
        });
        return { priceUpdated: true, tx, txResult };
      }

      log('-> fetchPerpsSettleOrder');
      const { tx, txResult } = await fetchPerpsSettleOrder({
        provider,
        walletAddress,
        PerpsMarketProxyContract,
        perpsAccountId,
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
          queryKey: [chainId, 'PriceUpdateTxn'],
        });
      }

      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          'PerpsGetOpenPosition',
          { PerpsMarketProxy: PerpsMarketProxyContract?.address },
          { walletAddress, perpsAccountId, perpsMarketId },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'PerpsGetOrder', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'Perps GetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
    },
  });
}
