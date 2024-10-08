import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchApproveToken } from './fetchApproveToken';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { fetchSpotSell } from './fetchSpotSell';
import { fetchSpotSellWithPriceUpdate } from './fetchSpotSellWithPriceUpdate';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useErrorParser } from './useErrorParser';
import { useImportContract, useImportSystemToken } from './useImports';
import { useSpotGetPriceData } from './useSpotGetPriceData';
import { useSpotGetSettlementStrategy } from './useSpotGetSettlementStrategy';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useSpotSell');

export function useSpotSell({
  provider,
  walletAddress,
  synthMarketId,
  settlementStrategyId,
  synthTokenAddress,
  onSuccess,
}: {
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  synthMarketId?: ethers.BigNumberish;
  settlementStrategyId?: ethers.BigNumberish;
  synthTokenAddress?: string;
  onSuccess: () => void;
}) {
  const { chainId, queryClient } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: priceIds } = useAllPriceFeeds();
  const { data: SpotMarketProxyContract } = useImportContract('SpotMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');
  const { data: systemToken } = useImportSystemToken();
  const { data: spotSettlementStrategy } = useSpotGetSettlementStrategy({
    provider,
    synthMarketId,
    settlementStrategyId,
  });
  const { data: priceData } = useSpotGetPriceData({ provider, synthMarketId });

  return useMutation({
    mutationFn: async (amount: ethers.BigNumberish) => {
      if (
        !(
          chainId &&
          SpotMarketProxyContract?.address &&
          MulticallContract?.address &&
          PythERC7412WrapperContract?.address &&
          walletAddress &&
          synthMarketId &&
          synthTokenAddress &&
          systemToken &&
          provider &&
          priceIds &&
          spotSettlementStrategy &&
          priceData
        )
      ) {
        throw 'OMFG';
      }

      log({
        chainId,
        SpotMarketProxyContract,
        MulticallContract,
        PythERC7412WrapperContract,
        walletAddress,
        synthMarketId,
        synthTokenAddress,
        systemToken,
        provider,
        priceIds,
        spotSettlementStrategy,
        priceData,
      });

      if (ethers.BigNumber.from(amount).lte(0)) {
        throw new Error('Amount required');
      }

      const freshBalance = await fetchTokenBalance({
        provider,
        ownerAddress: walletAddress,
        collateralTypeTokenAddress: synthTokenAddress,
      });
      log({ freshBalance });

      if (freshBalance.lt(amount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        provider,
        ownerAddress: walletAddress,
        collateralTypeTokenAddress: synthTokenAddress,
        spenderAddress: SpotMarketProxyContract.address,
      });
      log({ freshAllowance });

      if (freshAllowance.lt(amount)) {
        await fetchApproveToken({
          provider,
          walletAddress,
          collateralTypeTokenAddress: synthTokenAddress,
          spenderAddress: SpotMarketProxyContract.address,
          allowance: ethers.BigNumber.from(amount).sub(freshAllowance),
        });
      }

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds: [spotSettlementStrategy.feedId],
        stalenessTolerance: priceData.strictPriceStalenessTolerance,
      });
      log({ freshPriceUpdateTxn });

      if (freshPriceUpdateTxn.value) {
        log('-> fetchSpotSellWithPriceUpdate');
        const { tx, txResult } = await fetchSpotSellWithPriceUpdate({
          provider,
          walletAddress,
          SpotMarketProxyContract,
          MulticallContract,
          synthMarketId,
          amount,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
        return { priceUpdated: true, tx, txResult };
      }

      log('-> fetchSpotSell');
      const { tx, txResult } = await fetchSpotSell({
        provider,
        walletAddress,
        SpotMarketProxyContract,
        synthMarketId,
        amount,
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
        queryKey: [chainId, 'Balance', { collateralTypeTokenAddress: systemToken?.address, ownerAddress: walletAddress }],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'Balance', { collateralTypeTokenAddress: synthTokenAddress, ownerAddress: walletAddress }],
      });
      onSuccess();
    },
  });
}
