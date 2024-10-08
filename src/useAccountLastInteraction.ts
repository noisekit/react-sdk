import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useAccountLastInteraction');

export function useAccountLastInteraction({
  provider,
  accountId,
}: {
  provider?: ethers.providers.BaseProvider;
  accountId?: ethers.BigNumberish;
}) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  return useQuery({
    enabled: Boolean(chainId && preset && provider && CoreProxyContract?.address && accountId),
    queryKey: [
      chainId,
      preset,
      'AccountLastInteraction',
      { CoreProxy: CoreProxyContract?.address },
      { accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined },
    ],
    queryFn: async () => {
      if (!(chainId && preset && provider && CoreProxyContract?.address && accountId)) {
        throw 'OMFG';
      }

      log({ chainId, preset, CoreProxyContract, accountId });

      const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);

      console.time('useAccountLastInteraction');
      const accountLastInteraction = CoreProxy.getAccountLastInteraction(accountId);
      console.timeEnd('useAccountLastInteraction');
      log('accountLastInteraction: %O', accountLastInteraction);
      return accountLastInteraction;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountLastInteraction) => ethers.BigNumber.from(accountLastInteraction),
    refetchInterval: 5 * 60 * 1000,
  });
}
