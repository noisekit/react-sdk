import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { useErrorParser } from './useErrorParser';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useTokenAllowance');

export function useTokenAllowance({
  provider,
  tokenAddress,
  ownerAddress,
  spenderAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  tokenAddress?: string;
  ownerAddress?: string;
  spenderAddress?: string;
}) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && preset && provider && tokenAddress && ownerAddress && spenderAddress),
    queryKey: [chainId, preset, 'Allowance', { tokenAddress, ownerAddress, spenderAddress }],
    queryFn: async () => {
      if (!(chainId && preset && provider && tokenAddress && ownerAddress && spenderAddress)) {
        throw 'OMFG';
      }

      log({ chainId, preset, tokenAddress, ownerAddress, spenderAddress });

      const allowance = await fetchTokenAllowance({
        provider,
        tokenAddress,
        ownerAddress,
        spenderAddress,
      });
      log('allowance: %O', allowance);
      return allowance;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (allowance) => ethers.BigNumber.from(allowance),
    refetchInterval: 5 * 60 * 1000,
  });
}
