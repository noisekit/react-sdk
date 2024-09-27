import { useQuery } from '@tanstack/react-query';
import { useErrorParser } from './useErrorParser';
import { useImportExtras } from './useImports';
import { useSynthetix } from './useSynthetix';

export function useAllPriceFeeds() {
  const { chainId } = useSynthetix();
  const { data: extras } = useImportExtras();
  const errorParser = useErrorParser();

  return useQuery<string[]>({
    enabled: Boolean(chainId && extras),
    queryKey: [chainId, 'AllPriceFeeds'],
    queryFn: async () => {
      if (!(chainId && extras)) {
        throw 'OMFG';
      }
      return Object.entries(extras)
        .filter(
          ([key, value]) =>
            String(value).length === 66 && (key.startsWith('pyth_feed_id_') || (key.startsWith('pyth') && key.endsWith('FeedId')))
        )
        .map(([, value]) => value as string);
    },
    staleTime: 60 * 60 * 1000,
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
