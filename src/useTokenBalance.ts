import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useErrorParser } from './useErrorParser';
import { useSynthetix } from './useSynthetix';

export function useTokenBalance({
  provider,
  collateralTypeTokenAddress,
  ownerAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  collateralTypeTokenAddress?: string;
  ownerAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && provider && collateralTypeTokenAddress && ownerAddress),
    queryKey: [chainId, 'Balance', { collateralTypeTokenAddress, ownerAddress }],
    queryFn: async () => {
      if (!(chainId && provider && collateralTypeTokenAddress && ownerAddress)) {
        throw 'OMFG';
      }
      return fetchTokenBalance({ provider, collateralTypeTokenAddress, ownerAddress });
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
