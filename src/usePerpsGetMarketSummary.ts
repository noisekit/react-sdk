import { useQuery } from '@tanstack/react-query';
import type { ethers } from 'ethers';
import { fetchPerpsGetMarketSummary } from './fetchPerpsGetMarketSummary';
import { fetchPerpsGetMarketSummaryWithPriceUpdate } from './fetchPerpsGetMarketSummaryWithPriceUpdate';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useSynthetix } from './useSynthetix';

export function usePerpsGetMarketSummary({
  provider,
  perpsMarketId,
}: { provider?: ethers.providers.BaseProvider; perpsMarketId: ethers.BigNumberish }) {
  const { chainId } = useSynthetix();
  const { data: priceUpdateTxn } = usePriceUpdateTxn({ provider });

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const { data: MulticallContract } = useImportContract('Multicall');

  const errorParser = useErrorParser();

  return useQuery({
    enabled: Boolean(
      chainId && provider && perpsMarketId && PerpsMarketProxyContract?.address && MulticallContract?.address && priceUpdateTxn
    ),
    queryKey: [
      chainId,
      'Perps GetMarketSummary',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address, Multicall: MulticallContract?.address },
      { perpsMarketId: perpsMarketId.toString() },
    ],
    queryFn: async () => {
      if (!(chainId && provider && perpsMarketId && PerpsMarketProxyContract?.address && MulticallContract?.address && priceUpdateTxn)) {
        throw 'OMFG';
      }

      console.log({
        provider,
        perpsMarketId,
        PerpsMarketProxyContract,
        MulticallContract,
        priceUpdateTxn,
      });

      if (priceUpdateTxn.value) {
        console.log('-> fetchPerpsGetMarketSummaryWithPriceUpdate');
        return await fetchPerpsGetMarketSummaryWithPriceUpdate({
          provider,
          perpsMarketId,
          PerpsMarketProxyContract,
          MulticallContract,
          priceUpdateTxn,
        });
      }

      console.log('-> fetchPerpsGetMarketSummary');
      return await fetchPerpsGetMarketSummary({ provider, perpsMarketId, PerpsMarketProxyContract });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
