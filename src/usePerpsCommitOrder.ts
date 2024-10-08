import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchPerpsCommitOrder } from './fetchPerpsCommitOrder';
import { fetchPerpsCommitOrderWithPriceUpdate } from './fetchPerpsCommitOrderWithPriceUpdate';
import { fetchPerpsGetAvailableMargin } from './fetchPerpsGetAvailableMargin';
import { fetchPerpsTotalCollateralValue } from './fetchPerpsTotalCollateralValue';
import { getPythPrice } from './getPythPrice';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePerpsCommitOrder');

export function usePerpsCommitOrder({
  perpsAccountId,
  perpsMarketId,
  provider,
  walletAddress,
  feedId,
  settlementStrategyId,
  onSuccess,
}: {
  perpsAccountId?: ethers.BigNumberish;
  perpsMarketId: ethers.BigNumberish;
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  feedId?: string;
  settlementStrategyId?: ethers.BigNumberish;
  onSuccess: () => void;
}) {
  const { chainId, queryClient } = useSynthetix();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');

  const { data: priceUpdateTxn } = usePriceUpdateTxn({ provider });

  const errorParser = useErrorParser();

  return useMutation({
    retry: false,
    mutationFn: async (sizeDelta: ethers.BigNumberish) => {
      if (
        !(
          chainId &&
          perpsAccountId &&
          settlementStrategyId &&
          PerpsMarketProxyContract?.address &&
          MulticallContract?.address &&
          priceUpdateTxn &&
          walletAddress &&
          feedId &&
          provider
        )
      ) {
        throw 'OMFG';
      }

      log({
        chainId,
        perpsAccountId,
        settlementStrategyId,
        PerpsMarketProxyContract,
        MulticallContract,
        priceUpdateTxn,
        walletAddress,
        feedId,
        provider,
      });

      if (ethers.BigNumber.from(sizeDelta).lte(0)) {
        throw new Error('Amount required');
      }

      const availableMargin = await fetchPerpsGetAvailableMargin({
        provider,
        perpsAccountId,
        PerpsMarketProxyContract,
      });
      log({ availableMargin });

      if (availableMargin.lt(sizeDelta)) {
        throw new Error('Not enough available margin');
      }

      const totalCollateralValue = await fetchPerpsTotalCollateralValue({
        provider,
        PerpsMarketProxyContract,
        perpsAccountId,
      });
      log({ totalCollateralValue });

      if (totalCollateralValue.lt(sizeDelta)) {
        throw new Error('Total collateral value is less than the size delta');
      }

      const pythPrice = await getPythPrice({ feedId });
      log({ pythPrice });

      const orderCommitmentArgs = {
        perpsMarketId,
        perpsAccountId,
        sizeDelta,
        settlementStrategyId,
        acceptablePrice: ethers.utils.parseEther(Math.floor(pythPrice * (ethers.BigNumber.from(sizeDelta).gt(0) ? 1.05 : 0.95)).toString()),
        referrer: ethers.constants.AddressZero,
        trackingCode: ethers.utils.formatBytes32String('VD'),
      };
      log({ orderCommitmentArgs });

      log({ priceUpdateTxn });

      if (priceUpdateTxn.value) {
        log('-> fetchPerpsCommitOrderWithPriceUpdate');
        const { tx, txResult } = await fetchPerpsCommitOrderWithPriceUpdate({
          walletAddress,
          provider,
          PerpsMarketProxyContract,
          MulticallContract,
          orderCommitmentArgs,
          priceUpdateTxn,
        });
        return { priceUpdated: true, tx, txResult };
      }

      log('-> fetchPerpsCommitOrder');
      const { tx, txResult } = await fetchPerpsCommitOrder({
        walletAddress,
        provider,
        PerpsMarketProxyContract,
        orderCommitmentArgs,
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
        queryKey: [chainId, 'PerpsGetOrder', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'Perps GetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
      onSuccess();
    },
  });
}
