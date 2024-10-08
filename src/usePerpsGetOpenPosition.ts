import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePerpsGetOpenPosition');

export function usePerpsGetOpenPosition({
  provider,
  walletAddress,
  perpsAccountId,
  perpsMarketId,
}: {
  provider?: ethers.providers.BaseProvider;
  walletAddress?: string;
  perpsAccountId?: ethers.BigNumberish;
  perpsMarketId?: ethers.BigNumberish;
}) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  return useQuery<{
    accruedFunding: ethers.BigNumber;
    owedInterest: ethers.BigNumber;
    positionSize: ethers.BigNumber;
    totalPnl: ethers.BigNumber;
  }>({
    enabled: Boolean(
      chainId && preset && provider && PerpsMarketProxyContract?.address && walletAddress && perpsAccountId && perpsMarketId
    ),
    queryKey: [
      chainId,
      preset,
      'PerpsGetOpenPosition',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address },
      { walletAddress, perpsAccountId, perpsMarketId },
    ],
    queryFn: async () => {
      if (!(chainId && preset && provider && PerpsMarketProxyContract?.address && walletAddress && perpsAccountId && perpsMarketId)) {
        throw 'OMFG';
      }

      log({ chainId, preset, PerpsMarketProxyContract, walletAddress, perpsAccountId, perpsMarketId });

      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      const openPosition = await PerpsMarketProxy.getOpenPosition(perpsAccountId, perpsMarketId);
      log('openPosition: %O', openPosition);
      return openPosition;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
