import { useQuery } from '@tanstack/react-query';
import type { ethers } from 'ethers';
import { fetchPerpsGetRequiredMargins } from './fetchPerpsGetRequiredMargins';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

export function usePerpsGetRequiredMargins({
  provider,
  perpsAccountId,
}: { provider?: ethers.providers.BaseProvider; perpsAccountId?: ethers.BigNumber }) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  return useQuery<{
    maxLiquidationReward: ethers.BigNumber;
    requiredInitialMargin: ethers.BigNumber;
    requiredMaintenanceMargin: ethers.BigNumber;
  }>({
    enabled: Boolean(chainId && provider && PerpsMarketProxyContract?.address && perpsAccountId),
    queryKey: [chainId, 'PerpsGetRequiredMargins', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
    queryFn: async () => {
      if (!(chainId && provider && PerpsMarketProxyContract?.address && perpsAccountId)) {
        throw 'OMFG';
      }

      return await fetchPerpsGetRequiredMargins({
        provider,
        PerpsMarketProxyContract,
        perpsAccountId,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
