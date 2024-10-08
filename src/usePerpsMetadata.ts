import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePerpsMetadata');

export function usePerpsMetadata({
  provider,
  perpsMarketId,
}: { provider?: ethers.providers.BaseProvider; perpsMarketId?: ethers.BigNumberish }) {
  const { chainId, preset } = useSynthetix();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const errorParser = useErrorParser();

  return useQuery<{
    name: string;
    symbol: string;
  }>({
    enabled: Boolean(chainId && preset && provider && perpsMarketId && PerpsMarketProxyContract?.address),
    queryKey: [
      chainId,
      preset,
      'Perps Metadata',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address },
      { perpsMarketId: perpsMarketId?.toString() },
    ],
    queryFn: async () => {
      if (!(chainId && preset && provider && perpsMarketId && PerpsMarketProxyContract?.address)) {
        throw 'OMFG';
      }

      log({ chainId, preset, perpsMarketId, PerpsMarketProxyContract });

      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      const { symbol, name } = await PerpsMarketProxy.metadata(perpsMarketId);
      log('metadata: %O', { symbol, name });
      return { symbol, name };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
