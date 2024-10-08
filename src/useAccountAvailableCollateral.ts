import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useAccountAvailableCollateral');

export function useAccountAvailableCollateral({
  provider,
  accountId,
  collateralTypeTokenAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  accountId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
}) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && preset && provider && CoreProxyContract?.address && accountId && collateralTypeTokenAddress),
    queryKey: [
      chainId,
      preset,
      'AccountAvailableCollateral',
      { CoreProxy: CoreProxyContract?.address },
      { accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined, collateralTypeTokenAddress },
    ],
    queryFn: async () => {
      if (!(chainId && preset && provider && CoreProxyContract?.address && accountId && collateralTypeTokenAddress)) {
        throw 'OMFG';
      }

      log({ chainId, preset, CoreProxyContract, accountId, collateralTypeTokenAddress });

      const accountAvailableCollateral = fetchAccountAvailableCollateral({
        provider,
        CoreProxyContract,
        accountId,
        collateralTypeTokenAddress,
      });
      log('accountAvailableCollateral: %O', accountAvailableCollateral);
      return accountAvailableCollateral;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountAvailableCollateral) => ethers.BigNumber.from(accountAvailableCollateral),
  });
}
