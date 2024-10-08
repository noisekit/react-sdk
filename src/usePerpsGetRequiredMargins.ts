import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import type { ethers } from 'ethers';
import { fetchPerpsGetRequiredMargins } from './fetchPerpsGetRequiredMargins';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePerpsGetRequiredMargins');

export function usePerpsGetRequiredMargins({
  provider,
  perpsAccountId,
}: { provider?: ethers.providers.BaseProvider; perpsAccountId?: ethers.BigNumberish }) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  return useQuery<{
    maxLiquidationReward: ethers.BigNumber;
    requiredInitialMargin: ethers.BigNumber;
    requiredMaintenanceMargin: ethers.BigNumber;
  }>({
    enabled: Boolean(chainId && preset && provider && PerpsMarketProxyContract?.address && perpsAccountId),
    queryKey: [chainId, preset, 'PerpsGetRequiredMargins', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
    queryFn: async () => {
      if (!(chainId && preset && provider && PerpsMarketProxyContract?.address && perpsAccountId)) {
        throw 'OMFG';
      }

      log({ chainId, preset, PerpsMarketProxyContract, perpsAccountId });

      const requiredMargins = await fetchPerpsGetRequiredMargins({
        provider,
        PerpsMarketProxyContract,
        perpsAccountId,
      });
      log('requiredMargins: %O', requiredMargins);
      return requiredMargins;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
