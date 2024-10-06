import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { fetchPositionCollateral } from './fetchPositionCollateral';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

export function usePositionCollateral({
  provider,
  accountId,
  poolId,
  collateralTypeTokenAddress,
}: {
  accountId?: ethers.BigNumberish;
  poolId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
  provider?: ethers.providers.BaseProvider;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && CoreProxyContract?.address && provider && accountId && poolId && collateralTypeTokenAddress),
    queryKey: [
      chainId,
      'PositionCollateral',
      { CoreProxy: CoreProxyContract?.address },
      {
        accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined,
        poolId: poolId ? ethers.BigNumber.from(poolId).toHexString() : undefined,
        collateralTypeTokenAddress,
      },
    ],
    queryFn: async () => {
      if (!(chainId && CoreProxyContract?.address && provider && accountId && poolId && collateralTypeTokenAddress)) {
        throw 'OMFG';
      }
      return fetchPositionCollateral({
        provider,
        CoreProxyContract,
        accountId,
        poolId,
        collateralTypeTokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (positionCollateral) => ethers.BigNumber.from(positionCollateral),
  });
}
