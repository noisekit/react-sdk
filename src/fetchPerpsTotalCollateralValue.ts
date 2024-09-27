import { ethers } from 'ethers';

export async function fetchPerpsTotalCollateralValue({
  provider,
  PerpsMarketProxyContract,
  perpsAccountId,
}: {
  provider?: ethers.providers.BaseProvider;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  perpsAccountId: ethers.BigNumber;
}) {
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  console.time('fetchPerpsTotalCollateralValue');
  const totalCollateralValue = await PerpsMarketProxy.totalCollateralValue(perpsAccountId);
  console.timeEnd('fetchPerpsTotalCollateralValue');
  console.log({ totalCollateralValue });
  return totalCollateralValue;
}
