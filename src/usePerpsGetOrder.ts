import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('usePerpsGetOrder');

export function usePerpsGetOrder({
  provider,
  perpsAccountId,
}: { provider?: ethers.providers.BaseProvider; perpsAccountId?: ethers.BigNumberish }) {
  const { chainId } = useSynthetix();
  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const errorParser = useErrorParser();

  return useQuery<{
    commitmentTime: ethers.BigNumber;
    request: {
      marketId: ethers.BigNumber;
      accountId: ethers.BigNumber;
      sizeDelta: ethers.BigNumber;
      settlementStrategyId: ethers.BigNumber;
      acceptablePrice: ethers.BigNumber;
      trackingCode: string;
      referrer: string;
    };
  }>({
    enabled: Boolean(chainId && PerpsMarketProxyContract?.address && provider && perpsAccountId),
    queryKey: [chainId, 'PerpsGetOrder', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
    queryFn: async () => {
      if (!(chainId && PerpsMarketProxyContract?.address && provider && perpsAccountId)) {
        throw 'OMFG';
      }

      log({ chainId, PerpsMarketProxyContract, provider, perpsAccountId });

      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      const order = await PerpsMarketProxy.getOrder(perpsAccountId);
      log({ order });
      return order;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
