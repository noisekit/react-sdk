import { useQuery } from '@tanstack/react-query';

import { ethers } from 'ethers';
import { fetchAccountCollateral } from './fetchAccountCollateral';
import { fetchAccountCollateralWithPriceUpdate } from './fetchAccountCollateralWithPriceUpdate';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useSynthetix } from './useSynthetix';

export function useAccountCollateral({
  provider,
  accountId,
  collateralTypeTokenAddress,
}: {
  provider: ethers.providers.BaseProvider;
  accountId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: MulticallContract } = useImportContract('Multicall');

  const { data: priceUpdateTxn } = usePriceUpdateTxn({ provider });

  return useQuery({
    enabled: Boolean(
      chainId &&
        provider &&
        CoreProxyContract?.address &&
        MulticallContract?.address &&
        accountId &&
        collateralTypeTokenAddress &&
        priceUpdateTxn
    ),
    queryKey: [
      chainId,
      'AccountCollateral',
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
        collateralTypeTokenAddress,
        priceUpdateTxn,
      });

      if (priceUpdateTxn.value) {
        console.log('-> fetchAccountCollateralWithPriceUpdate');
        return fetchAccountCollateralWithPriceUpdate({
          provider,
          CoreProxyContract,
          MulticallContract,
          accountId,
          collateralTypeTokenAddress,
          priceUpdateTxn,
        });
      }
      console.log('-> fetchAccountCollateral');
      return fetchAccountCollateral({
        provider,
        CoreProxyContract,
        accountId,
        collateralTypeTokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountCollateral) => ({
      totalAssigned: ethers.BigNumber.from(accountCollateral.totalAssigned),
      totalDeposited: ethers.BigNumber.from(accountCollateral.totalDeposited),
      totalLocked: ethers.BigNumber.from(accountCollateral.totalLocked),
    }),
    retry: 5,
    retryDelay: (attempt) => 2 ** attempt * 1000,
  });
}
