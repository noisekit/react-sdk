import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

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
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  return useQuery<{
    accruedFunding: ethers.BigNumber;
    owedInterest: ethers.BigNumber;
    positionSize: ethers.BigNumber;
    totalPnl: ethers.BigNumber;
  }>({
    enabled: Boolean(chainId && provider && PerpsMarketProxyContract?.address && walletAddress && perpsAccountId && perpsMarketId),
    queryKey: [
      chainId,
      'PerpsGetOpenPosition',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address },
      { walletAddress, perpsAccountId, perpsMarketId },
    ],
    queryFn: async () => {
      if (!(chainId && provider && PerpsMarketProxyContract?.address && walletAddress && perpsAccountId && perpsMarketId)) {
        throw 'OMFG';
      }

      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      const openPosition = await PerpsMarketProxy.getOpenPosition(perpsAccountId, perpsMarketId);
      console.log({ openPosition });
      return openPosition;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
