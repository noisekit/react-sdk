import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('useSpotGetSettlementStrategy');

export function useSpotGetSettlementStrategy({
  provider,
  synthMarketId,
  settlementStrategyId,
}: { provider?: ethers.providers.BaseProvider; synthMarketId?: ethers.BigNumberish; settlementStrategyId?: ethers.BigNumberish }) {
  const { chainId } = useSynthetix();

  const { data: SpotMarketProxyContract } = useImportContract('SpotMarketProxy');

  const errorParser = useErrorParser();

  return useQuery({
    enabled: Boolean(chainId && SpotMarketProxyContract?.address && provider && synthMarketId && settlementStrategyId),
    queryKey: [
      chainId,
      'SpotGetSettlementStrategy',
      { SpotMarketProxy: SpotMarketProxyContract?.address },
      { synthMarketId, settlementStrategyId },
    ],
    queryFn: async () => {
      if (!(chainId && SpotMarketProxyContract?.address && provider && synthMarketId && settlementStrategyId)) {
        throw 'OMFG';
      }

      log({ chainId, SpotMarketProxyContract, provider, synthMarketId, settlementStrategyId });

      const SpotMarketProxy = new ethers.Contract(SpotMarketProxyContract.address, SpotMarketProxyContract.abi, provider);
      const settlementStrategy = await SpotMarketProxy.getSettlementStrategy(synthMarketId, settlementStrategyId);
      log({ settlementStrategy });
      return settlementStrategy;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
