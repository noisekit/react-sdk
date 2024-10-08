import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePerpsAccounts');

export function usePerpsAccounts({
  provider,
  walletAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  walletAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const { data: PerpsAccountProxyContract } = useImportContract('PerpsAccountProxy');
  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber[]>({
    enabled: Boolean(chainId && provider && walletAddress && PerpsAccountProxyContract?.address),
    queryKey: [chainId, 'Perps Accounts', { PerpsAccountProxy: PerpsAccountProxyContract?.address }, { ownerAddress: walletAddress }],
    queryFn: async () => {
      if (!(chainId && provider && walletAddress && PerpsAccountProxyContract?.address)) throw 'OMFG';

      log({ chainId, provider, walletAddress, PerpsAccountProxyContract });

      const PerpsAccountProxy = new ethers.Contract(PerpsAccountProxyContract.address, PerpsAccountProxyContract.abi, provider);
      const numberOfAccountTokens = await PerpsAccountProxy.balanceOf(walletAddress);
      if (numberOfAccountTokens.eq(0)) {
        // No accounts created yet
        return [];
      }
      const accountIndexes = Array.from(Array(numberOfAccountTokens.toNumber()).keys());
      const accounts = await Promise.all(accountIndexes.map((i) => PerpsAccountProxy.tokenOfOwnerByIndex(walletAddress, i)));
      log({ accounts });
      return accounts;
    },
    select: (accounts) => accounts.map((accountId) => ethers.BigNumber.from(accountId)),
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
