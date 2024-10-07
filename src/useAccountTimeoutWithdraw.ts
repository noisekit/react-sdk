import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('useAccountTimeoutWithdraw');

export function useAccountTimeoutWithdraw({ provider }: { provider?: ethers.providers.BaseProvider }) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && provider && CoreProxyContract?.address),
    queryKey: [chainId, 'ConfigUint accountTimeoutWithdraw', { CoreProxy: CoreProxyContract?.address }],
    queryFn: async () => {
      if (!(chainId && provider && CoreProxyContract?.address)) {
        throw 'OMFG';
      }

      log({ chainId, provider, CoreProxyContract });

      const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);

      console.time('useAccountTimeoutWithdraw');
      const accountTimeoutWithdraw = await CoreProxy.getConfigUint(ethers.utils.formatBytes32String('accountTimeoutWithdraw'));
      console.timeEnd('useAccountTimeoutWithdraw');
      log({ accountTimeoutWithdraw });
      return accountTimeoutWithdraw;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountTimeoutWithdraw) => ethers.BigNumber.from(accountTimeoutWithdraw),
  });
}
