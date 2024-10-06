import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { fetchPositionDebt } from './fetchPositionDebt';
import { fetchPositionDebtWithPriceUpdate } from './fetchPositionDebtWithPriceUpdate';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useSynthetix } from './useSynthetix';

export function usePositionDebt({
  provider,
  accountId,
  poolId,
  collateralTypeTokenAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  accountId?: ethers.BigNumberish;
  poolId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: priceUpdateTxn } = usePriceUpdateTxn({ provider });

  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: MulticallContract } = useImportContract('Multicall');

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(
      chainId &&
        provider &&
        CoreProxyContract?.address &&
        MulticallContract?.address &&
        accountId &&
        poolId &&
        collateralTypeTokenAddress &&
        priceUpdateTxn
    ),
    queryKey: [
      chainId,
      'PositionDebt',
      { CoreProxy: CoreProxyContract?.address, Multicall: MulticallContract?.address },
      { accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined, collateralTypeTokenAddress },
    ],
    queryFn: async () => {
      if (
        !(
          chainId &&
          provider &&
          CoreProxyContract?.address &&
          MulticallContract?.address &&
          accountId &&
          poolId &&
          collateralTypeTokenAddress &&
          priceUpdateTxn
        )
      ) {
        throw 'OMFG';
      }
      console.log({
        provider,
        CoreProxyContract,
        MulticallContract,
        accountId,
        poolId,
        collateralTypeTokenAddress,
        priceUpdateTxn,
      });

      if (priceUpdateTxn.value) {
        console.log('-> fetchPositionDebtWithPriceUpdate');
        return fetchPositionDebtWithPriceUpdate({
          provider,
          CoreProxyContract,
          MulticallContract,
          accountId,
          poolId,
          collateralTypeTokenAddress,
          priceUpdateTxn,
        });
      }
      console.log('-> fetchPositionDebt');
      return fetchPositionDebt({
        provider,
        CoreProxyContract,
        accountId,
        poolId,
        collateralTypeTokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (positionDebt) => ethers.BigNumber.from(positionDebt),
    retry: 5,
    retryDelay: (attempt) => 2 ** attempt * 1000,
  });
}
