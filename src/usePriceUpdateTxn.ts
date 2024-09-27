import { useQuery } from '@tanstack/react-query';
import type { ethers } from 'ethers';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { useAllPriceFeeds } from './useAllPriceFeeds';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

export function usePriceUpdateTxn({
  provider,
}: {
  provider?: ethers.providers.BaseProvider;
}) {
  const { chainId, queryClient } = useSynthetix();
  const errorParser = useErrorParser();
  const { data: priceIds } = useAllPriceFeeds();

  const { data: MulticallContract } = useImportContract('Multicall');
  const { data: PythERC7412WrapperContract } = useImportContract('PythERC7412Wrapper');

  return useQuery(
    {
      enabled: Boolean(chainId && provider && priceIds && MulticallContract && PythERC7412WrapperContract),
      queryKey: [chainId, 'PriceUpdateTxn', { priceIds: priceIds?.map((p) => p.slice(0, 8)) }],
      queryFn: async (): Promise<{
        target: string;
        callData: string;
        value: number;
        requireSuccess: boolean;
      }> => {
        if (!(chainId && provider && priceIds && MulticallContract && PythERC7412WrapperContract)) {
          throw 'OMFG';
        }
        return await fetchPriceUpdateTxn({
          provider,
          MulticallContract,
          PythERC7412WrapperContract,
          priceIds,
        });
      },
      throwOnError: (error) => {
        // TODO: show toast
        errorParser(error);
        return false;
      },
      // considering real staleness tolerance at 3_600s,
      // refetching price updates every 10m should be way more than enough
      staleTime: 10 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
    },
    queryClient
  );
}
