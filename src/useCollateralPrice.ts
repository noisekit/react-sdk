import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { fetchCollateralPrice } from './fetchCollateralPrice';
import { fetchCollateralPriceWithPriceUpdate } from './fetchCollateralPriceWithPriceUpdate';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useSynthetix } from './useSynthetix';

export function useCollateralPrice({
  provider,
  tokenAddress,
}: {
  provider?: ethers.providers.Web3Provider;
  tokenAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: priceUpdateTxn } = usePriceUpdateTxn({ provider });

  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: MulticallContract } = useImportContract('Multicall');

  return useQuery({
    enabled: Boolean(chainId && provider && CoreProxyContract?.address && MulticallContract?.address && tokenAddress && priceUpdateTxn),
    queryKey: [
      chainId,
      'CollateralPrice',
      { CoreProxy: CoreProxyContract?.address, Multicall: MulticallContract?.address },
      { tokenAddress },
    ],
    queryFn: async () => {
      if (!(chainId && provider && CoreProxyContract?.address && MulticallContract?.address && tokenAddress && priceUpdateTxn)) {
        throw 'OMFG';
      }
      console.log({
        provider,
        CoreProxyContract,
        MulticallContract,
        tokenAddress,
        priceUpdateTxn,
      });

      if (priceUpdateTxn.value) {
        console.log('-> fetchCollateralPriceWithPriceUpdate');
        return fetchCollateralPriceWithPriceUpdate({
          provider,
          CoreProxyContract,
          MulticallContract,
          tokenAddress,
          priceUpdateTxn,
        });
      }
      console.log('-> fetchCollateralPrice');
      return fetchCollateralPrice({
        provider,
        CoreProxyContract,
        tokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (collateralPrice) => ethers.BigNumber.from(collateralPrice),
    retry: 5,
    retryDelay: (attempt) => 2 ** attempt * 1000,
  });
}
