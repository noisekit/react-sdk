import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

export function usePerpsMetadata({
  provider,
  perpsMarketId,
}: { provider?: ethers.providers.BaseProvider; perpsMarketId?: ethers.BigNumberish }) {
  const { chainId } = useSynthetix();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const errorParser = useErrorParser();

  return useQuery<{
    name: string;
    symbol: string;
  }>({
    enabled: Boolean(chainId && provider && perpsMarketId && PerpsMarketProxyContract?.address),
    queryKey: [
      chainId,
      'Perps Metadata',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address },
      { perpsMarketId: perpsMarketId?.toString() },
    ],
    queryFn: async () => {
      if (!(chainId && provider && perpsMarketId && PerpsMarketProxyContract?.address)) {
        throw 'OMFG';
      }

      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      const { symbol, name } = await PerpsMarketProxy.metadata(perpsMarketId);
      console.log({ symbol, name });
      return { symbol, name };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
