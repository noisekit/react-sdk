import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

interface PerpsMetadata {
  name: string;
  symbol: string;
}

export function usePerpsMetadata({ provider, marketId }: { provider?: ethers.providers.BaseProvider; marketId?: ethers.BigNumber }) {
  const { chainId } = useSynthetix();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  return useQuery<PerpsMetadata>({
    enabled: Boolean(chainId && provider && marketId && PerpsMarketProxyContract?.address),
    queryKey: [chainId, 'Perps Metadata', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, { marketId: marketId?.toString() }],
    queryFn: async () => {
      if (!(chainId && provider && marketId && PerpsMarketProxyContract?.address)) {
        throw 'OMFG';
      }

      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      return PerpsMarketProxy.metadata(marketId);
    },
  });
}
