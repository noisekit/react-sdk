import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePerpsGetSettlementStrategy');

export function usePerpsGetSettlementStrategy({
  provider,
  settlementStrategyId,
  perpsMarketId,
}: { settlementStrategyId?: ethers.BigNumberish; provider?: ethers.providers.BaseProvider; perpsMarketId?: ethers.BigNumberish }) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  return useQuery<{
    commitmentPriceDelay: ethers.BigNumber;
    disabled: boolean;
    feedId: string;
    priceVerificationContract: string;
    settlementDelay: ethers.BigNumber;
    settlementReward: ethers.BigNumber;
    settlementWindowDuration: ethers.BigNumber;
    strategyType: number;
  }>({
    enabled: Boolean(chainId && preset && provider && PerpsMarketProxyContract?.address && settlementStrategyId && perpsMarketId),
    queryKey: [
      chainId,
      preset,
      'PerpsGetSettlementStrategy',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address },
      { perpsMarketId, settlementStrategyId },
    ],
    queryFn: async () => {
      if (!(chainId && preset && provider && PerpsMarketProxyContract?.address && settlementStrategyId && perpsMarketId)) {
        throw 'OMFG';
      }

      log({ chainId, preset, PerpsMarketProxyContract, settlementStrategyId, perpsMarketId });

      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      const settlementStrategy = await PerpsMarketProxy.getSettlementStrategy(perpsMarketId, settlementStrategyId);
      log('settlementStrategy: %O', settlementStrategy);
      return settlementStrategy;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
