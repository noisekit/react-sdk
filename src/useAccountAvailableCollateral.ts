import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

export function useAccountAvailableCollateral({
  provider,
  accountId,
  tokenAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  accountId?: ethers.BigNumber;
  tokenAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && provider && CoreProxyContract?.address && accountId && tokenAddress),
    queryKey: [
      chainId,
      'AccountAvailableCollateral',
      { CoreProxy: CoreProxyContract?.address },
      { accountId: accountId?.toHexString(), tokenAddress },
    ],
    queryFn: async () => {
      if (!(chainId && provider && CoreProxyContract?.address && accountId && tokenAddress)) {
        throw 'OMFG';
      }

      return fetchAccountAvailableCollateral({
        provider,
        CoreProxyContract,
        accountId,
        tokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountAvailableCollateral) => ethers.BigNumber.from(accountAvailableCollateral),
  });
}
