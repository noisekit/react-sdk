import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

export function useAccountAvailableCollateral({
  provider,
  accountId,
  collateralTypeTokenAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  accountId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && provider && CoreProxyContract?.address && accountId && collateralTypeTokenAddress),
    queryKey: [
      chainId,
      'AccountAvailableCollateral',
      { CoreProxy: CoreProxyContract?.address },
      { accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined, collateralTypeTokenAddress },
    ],
    queryFn: async () => {
      if (!(chainId && provider && CoreProxyContract?.address && accountId && collateralTypeTokenAddress)) {
        throw 'OMFG';
      }

      return fetchAccountAvailableCollateral({
        provider,
        CoreProxyContract,
        accountId,
        collateralTypeTokenAddress,
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
