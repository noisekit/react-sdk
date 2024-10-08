import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { fetchWithdrawCollateral } from './fetchWithdrawCollateral';
import { fetchWithdrawCollateralWithPriceUpdate } from './fetchWithdrawCollateralWithPriceUpdate';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useWithdraw');

export function useWithdraw({
  provider,
  walletAddress,
  accountId,
  collateralTypeTokenAddress,
  onSuccess,
}: {
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  accountId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
  onSuccess: () => void;
}) {
  const { chainId, preset, queryClient } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: priceIds } = useAllPriceFeeds();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

  return useMutation({
    retry: false,
    mutationFn: async (withdrawAmount: ethers.BigNumberish) => {
      if (
        !(
          chainId &&
          preset &&
          provider &&
          walletAddress &&
          accountId &&
          collateralTypeTokenAddress &&
          CoreProxyContract &&
          MulticallContract &&
          PythERC7412WrapperContract &&
          priceIds
        )
      ) {
        throw 'OMFG';
      }

      log({
        chainId,
        preset,
        walletAddress,
        accountId,
        collateralTypeTokenAddress,
        CoreProxyContract,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });

      if (ethers.BigNumber.from(withdrawAmount).eq(0)) {
        throw new Error('Amount required');
      }

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
      log('freshPriceUpdateTxn: %O', freshPriceUpdateTxn);

      const freshAccountAvailableCollateral = await fetchAccountAvailableCollateral({
        provider,
        CoreProxyContract,
        accountId,
        collateralTypeTokenAddress,
      });
      log('freshAccountAvailableCollateral: %O', freshAccountAvailableCollateral);

      const hasEnoughDeposit = freshAccountAvailableCollateral.gte(withdrawAmount);
      if (!hasEnoughDeposit) {
        throw new Error('Not enough unlocked collateral');
      }

      if (freshPriceUpdateTxn.value) {
        log('-> withdrawCollateralWithPriceUpdate');
        const { tx, txResult } = await fetchWithdrawCollateralWithPriceUpdate({
          provider,
          walletAddress,
          CoreProxyContract,
          MulticallContract,
          accountId,
          collateralTypeTokenAddress,
          withdrawAmount,
          priceUpdateTxn: freshPriceUpdateTxn,
        });
        return { priceUpdated: true, tx, txResult };
      }

      log('-> withdrawCollateral');
      const { tx, txResult } = await fetchWithdrawCollateral({
        provider,
        walletAddress,
        CoreProxyContract,
        accountId,
        collateralTypeTokenAddress,
        withdrawAmount,
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
          'AccountCollateral',
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
            collateralTypeTokenAddress,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          preset,
          'Balance',
          {
            collateralTypeTokenAddress,
            ownerAddress: walletAddress,
          },
        ],
      });

      onSuccess();
    },
  });
}
