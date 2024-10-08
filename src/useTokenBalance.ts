import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useErrorParser } from './useErrorParser';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useTokenBalance');

export function useTokenBalance({
  provider,
  tokenAddress,
  ownerAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  tokenAddress?: string;
  ownerAddress?: string;
}) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && preset && provider && tokenAddress && ownerAddress),
    queryKey: [chainId, preset, 'Balance', { tokenAddress, ownerAddress }],
    queryFn: async () => {
      if (!(chainId && preset && provider && tokenAddress && ownerAddress)) {
        throw 'OMFG';
      }

      log({ chainId, preset, tokenAddress, ownerAddress });

      const balance = await fetchTokenBalance({ provider, tokenAddress, ownerAddress });
      log('balance: %O', balance);
      return balance;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (balance) => ethers.BigNumber.from(balance),
    refetchInterval: 5 * 60 * 1000,
  });
}
