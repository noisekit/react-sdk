import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchCollateralPrice } from './fetchCollateralPrice';
import { fetchCollateralPriceWithPriceUpdate } from './fetchCollateralPriceWithPriceUpdate';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useCollateralPrice');

export function useCollateralPrice({
  provider,
  collateralTypeTokenAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  collateralTypeTokenAddress?: string;
}) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: priceUpdateTxn } = usePriceUpdateTxn({ provider });

  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: MulticallContract } = useImportContract('Multicall');

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(
      chainId && provider && CoreProxyContract?.address && MulticallContract?.address && collateralTypeTokenAddress && priceUpdateTxn
    ),
    queryKey: [
      chainId,
      preset,
      'CollateralPrice',
      { CoreProxy: CoreProxyContract?.address, Multicall: MulticallContract?.address },
      { collateralTypeTokenAddress },
    ],
    queryFn: async () => {
      if (
        !(chainId && provider && CoreProxyContract?.address && MulticallContract?.address && collateralTypeTokenAddress && priceUpdateTxn)
      ) {
        throw 'OMFG';
      }

      log({
        chainId,
        preset,
        CoreProxyContract,
        MulticallContract,
        collateralTypeTokenAddress,
        priceUpdateTxn,
      });

      if (priceUpdateTxn.value) {
        log('-> fetchCollateralPriceWithPriceUpdate');
        return fetchCollateralPriceWithPriceUpdate({
          provider,
          CoreProxyContract,
          MulticallContract,
          collateralTypeTokenAddress,
          priceUpdateTxn,
        });
      }
      log('-> fetchCollateralPrice');
      return fetchCollateralPrice({
        provider,
        CoreProxyContract,
        collateralTypeTokenAddress,
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
