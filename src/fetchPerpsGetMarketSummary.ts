import { ethers } from 'ethers';

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
  const marketSummary = await PerpsMarketProxy.getMarketSummary(perpsMarketId);
  console.log({ marketSummary });
  return marketSummary;
}
