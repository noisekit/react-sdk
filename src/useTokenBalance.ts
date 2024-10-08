import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useErrorParser } from './useErrorParser';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useTokenBalance');

export function useTokenBalance({
  provider,
  collateralTypeTokenAddress,
  ownerAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  collateralTypeTokenAddress?: string;
  ownerAddress?: string;
}) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && provider && collateralTypeTokenAddress && ownerAddress),
    queryKey: [chainId, preset, 'Balance', { collateralTypeTokenAddress, ownerAddress }],
    queryFn: async () => {
      if (!(chainId && provider && collateralTypeTokenAddress && ownerAddress)) {
        throw 'OMFG';
      }

      log({ chainId, preset, collateralTypeTokenAddress, ownerAddress });

      const balance = await fetchTokenBalance({ provider, collateralTypeTokenAddress, ownerAddress });
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
