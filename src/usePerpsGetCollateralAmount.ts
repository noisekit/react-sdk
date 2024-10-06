import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const USDx_MARKET_ID = 0;

export function usePerpsGetCollateralAmount({
  provider,
  perpsAccountId,
}: {
  provider?: ethers.providers.BaseProvider;
  perpsAccountId?: ethers.BigNumberish;
}) {
  const { chainId } = useSynthetix();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && PerpsMarketProxyContract?.address && provider && perpsAccountId),
    queryKey: [
      chainId,
      'PerpsGetCollateralAmount',
      { PerpsMarketProxy: PerpsMarketProxyContract?.address },
      { collateral: USDx_MARKET_ID },
      perpsAccountId,
    ],
    queryFn: async () => {
      if (!(chainId && PerpsMarketProxyContract?.address && provider && perpsAccountId)) {
        throw 'OMFG';
      }

      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
      const collateralAmount = await PerpsMarketProxy.getCollateralAmount(perpsAccountId, USDx_MARKET_ID);
      console.log({ collateralAmount });
      return collateralAmount;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
  });
}
