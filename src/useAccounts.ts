import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('useAccounts');

export function useAccounts({ provider, walletAddress }: { walletAddress?: string; provider?: ethers.providers.BaseProvider }) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();
  const { data: AccountProxyContract } = useImportContract('AccountProxy');

  return useQuery<ethers.BigNumber[]>({
    enabled: Boolean(chainId && AccountProxyContract?.address && walletAddress && provider),
    queryKey: [chainId, 'Accounts', { AccountProxy: AccountProxyContract?.address }, { ownerAddress: walletAddress }],
    queryFn: async () => {
      if (!(chainId && AccountProxyContract?.address && walletAddress && provider)) throw 'OMFG';

      log({ chainId, AccountProxyContract, walletAddress, provider });

      const AccountProxy = new ethers.Contract(AccountProxyContract.address, AccountProxyContract.abi, provider);
      const numberOfAccountTokens = await AccountProxy.balanceOf(walletAddress);
      if (numberOfAccountTokens.eq(0)) {
        // No accounts created yet
        return [];
      }
      const accountIndexes = Array.from(Array(numberOfAccountTokens.toNumber()).keys());
      const accounts = await Promise.all(accountIndexes.map((i) => AccountProxy.tokenOfOwnerByIndex(walletAddress, i)));
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
