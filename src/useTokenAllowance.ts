import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { useErrorParser } from './useErrorParser';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useTokenAllowance');

export function useTokenAllowance({
  provider,
  collateralTypeTokenAddress,
  ownerAddress,
  spenderAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  collateralTypeTokenAddress?: string;
  ownerAddress?: string;
  spenderAddress?: string;
}) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && provider && collateralTypeTokenAddress && ownerAddress && spenderAddress),
    queryKey: [chainId, preset, 'Allowance', { collateralTypeTokenAddress, ownerAddress, spenderAddress }],
    queryFn: async () => {
      if (!(chainId && provider && collateralTypeTokenAddress && ownerAddress && spenderAddress)) {
        throw 'OMFG';
      }

      log({ chainId, preset, collateralTypeTokenAddress, ownerAddress, spenderAddress });

      const allowance = await fetchTokenAllowance({
        provider,
        collateralTypeTokenAddress,
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
