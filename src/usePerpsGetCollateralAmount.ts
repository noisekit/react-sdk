import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePerpsGetCollateralAmount');

const USDx_MARKET_ID = 0;

export function usePerpsGetCollateralAmount({
  provider,
  perpsAccountId,
}: {
  provider?: ethers.providers.BaseProvider;
  perpsAccountId?: ethers.BigNumberish;
}) {
  const { chainId, preset } = useSynthetix();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && PerpsMarketProxyContract?.address && provider && perpsAccountId),
    queryKey: [
      chainId,
      preset,
      'PerpsGetCollateralAmount',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address },
      { collateral: USDx_MARKET_ID },
      perpsAccountId,
    ],
    queryFn: async () => {
      if (!(chainId && PerpsMarketProxyContract?.address && provider && perpsAccountId)) {
        throw 'OMFG';
      }

      log({ chainId, PerpsMarketProxyContract, provider, perpsAccountId });

      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      const collateralAmount = await PerpsMarketProxy.getCollateralAmount(perpsAccountId, USDx_MARKET_ID);
      log('collateralAmount: %O', collateralAmount);
      return collateralAmount;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
