import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useErrorParser } from './useErrorParser';
import { useSynthetix } from './useSynthetix';

export function useTokenBalance({
  provider,
  tokenAddress,
  ownerAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  tokenAddress?: string;
  ownerAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && provider && tokenAddress && ownerAddress),
    queryKey: [chainId, 'Balance', { tokenAddress, ownerAddress }],
    queryFn: async () => {
      if (!(chainId && provider && tokenAddress && ownerAddress)) {
        throw 'OMFG';
      }
      return fetchTokenBalance({ provider, tokenAddress, ownerAddress });
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
