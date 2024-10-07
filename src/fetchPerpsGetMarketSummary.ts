import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('fetchPerpsGetMarketSummary');

export async function fetchPerpsGetMarketSummary({
  provider,
  perpsMarketId,
  PerpsMarketProxyContract,
}: {
  provider: ethers.providers.BaseProvider;
  perpsMarketId: ethers.BigNumberish;
  PerpsMarketProxyContract: { address: string; abi: string[] };
}): Promise<{
  skew: ethers.BigNumber;
  size: ethers.BigNumber;
  maxOpenInterest: ethers.BigNumber;
  currentFundingRate: ethers.BigNumber;
  currentFundingVelocity: ethers.BigNumber;
  indexPrice: ethers.BigNumber;
}> {
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  const perpsMarketSummary = await PerpsMarketProxy.getMarketSummary(perpsMarketId);
  log({ perpsMarketSummary });
  return perpsMarketSummary;
}
