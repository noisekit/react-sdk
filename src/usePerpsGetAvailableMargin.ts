import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import type { ethers } from 'ethers';
import { fetchPerpsGetAvailableMargin } from './fetchPerpsGetAvailableMargin';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePerpsGetAvailableMargin');

export function usePerpsGetAvailableMargin({
  provider,
  perpsAccountId,
}: { provider?: ethers.providers.BaseProvider; perpsAccountId?: ethers.BigNumberish }) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && preset && provider && perpsAccountId && PerpsMarketProxyContract?.address),
    queryKey: [chainId, preset, 'Perps GetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
    queryFn: async () => {
      if (!(chainId && preset && provider && perpsAccountId && PerpsMarketProxyContract?.address)) {
        throw 'OMFG';
      }

      log({ chainId, preset, perpsAccountId, PerpsMarketProxyContract });

      const availableMargin = await fetchPerpsGetAvailableMargin({
        provider,
        perpsAccountId,
        PerpsMarketProxyContract,
      });
      log('availableMargin: %O', availableMargin);
      return availableMargin;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
