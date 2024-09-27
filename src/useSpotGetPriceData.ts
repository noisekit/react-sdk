import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

export function useSpotGetPriceData({ provider, synthMarketId }: { provider?: ethers.providers.BaseProvider; synthMarketId?: string }) {
  const { chainId } = useSynthetix();
  const { data: SpotMarketProxyContract } = useImportContract('SpotMarketProxy');
  const errorParser = useErrorParser();

  return useQuery<{
    buyFeedId: string;
    sellFeedId: string;
    strictPriceStalenessTolerance: ethers.BigNumber;
  }>({
    enabled: Boolean(chainId && SpotMarketProxyContract?.address && provider && synthMarketId),
    queryKey: [chainId, 'GetPriceData', { SpotMarketProxy: SpotMarketProxyContract?.address }, synthMarketId],
    queryFn: async () => {
      if (!(chainId && SpotMarketProxyContract?.address && provider && synthMarketId)) {
        throw new Error('OMFG');
      }

      const SpotMarketProxy = new ethers.Contract(SpotMarketProxyContract.address, SpotMarketProxyContract.abi, provider);
      const priceData = await SpotMarketProxy.getPriceData(synthMarketId);
      console.log({ priceData });
      return priceData;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
