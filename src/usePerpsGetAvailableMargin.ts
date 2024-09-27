import { useQuery } from '@tanstack/react-query';
import type { ethers } from 'ethers';
import { fetchPerpsGetAvailableMargin } from './fetchPerpsGetAvailableMargin';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { usePerpsSelectedAccountId } from './usePerpsSelectedAccountId';
import { useSynthetix } from './useSynthetix';

export function usePerpsGetAvailableMargin({
  provider,
  walletAddress,
  perpsAccountId,
}: { provider?: ethers.providers.BaseProvider; walletAddress?: string; perpsAccountId: string }) {
  const { chainId } = useSynthetix();
  const selectedAccountId = usePerpsSelectedAccountId({ provider, walletAddress, perpsAccountId });
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');
  const errorParser = useErrorParser();

  return useQuery({
    enabled: Boolean(chainId && provider && selectedAccountId && PerpsMarketProxyContract?.address),
    queryKey: [chainId, 'Perps GetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, selectedAccountId],
    queryFn: async () => {
      if (!(chainId && provider && selectedAccountId && PerpsMarketProxyContract?.address)) {
        throw 'OMFG';
      }

      return await fetchPerpsGetAvailableMargin({
        provider,
        perpsAccountId: selectedAccountId,
        PerpsMarketProxyContract,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
