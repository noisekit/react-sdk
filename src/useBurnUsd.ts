import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { fetchBurnUsd } from './fetchBurnUsd';
import { fetchBurnUsdWithPriceUpdate } from './fetchBurnUsdWithPriceUpdate';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useErrorParser } from './useErrorParser';
import { useImportContract, useImportSystemToken } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useBurnUsd');

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
  const { chainId, preset, queryClient } = useSynthetix();
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
          preset &&
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

      log({
        chainId,
        preset,
        walletAddress,
        accountId,
        poolId,
        collateralTypeTokenAddress,
        systemToken,
        CoreProxyContract,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });

      if (ethers.BigNumber.from(burnUsdAmount).eq(0)) {
        throw new Error('Amount required');
      }

      const freshPriceUpdateTxn = await fetchPriceUpdateTxn({
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
      log('freshPriceUpdateTxn: %O', freshPriceUpdateTxn);

      const freshAccountAvailableUsd = await fetchAccountAvailableCollateral({
        provider,
        CoreProxyContract,
        accountId,
        collateralTypeTokenAddress: systemToken.address,
      });
      log('freshAccountAvailableUsd: %O', freshAccountAvailableUsd);

      const hasEnoughDeposit = freshAccountAvailableUsd.gte(burnUsdAmount);
      if (!hasEnoughDeposit) {
        throw new Error(`Not enough deposited ${systemToken.symbol}`);
      }

      if (freshPriceUpdateTxn.value) {
        log('-> burnUsdWithPriceUpdate');
        const { tx, txResult } = await fetchBurnUsdWithPriceUpdate({
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
        return { priceUpdated: true, tx, txResult };
      }

      log('-> burnUsd');
      const { tx, txResult } = await fetchBurnUsd({
        provider,
        walletAddress,
        CoreProxyContract,
        accountId,
        poolId,
        collateralTypeTokenAddress,
        burnUsdAmount,
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
