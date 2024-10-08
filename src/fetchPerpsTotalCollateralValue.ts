import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchPerpsTotalCollateralValue');

export async function fetchPerpsTotalCollateralValue({
  provider,
  PerpsMarketProxyContract,
  perpsAccountId,
}: {
  provider: ethers.providers.BaseProvider;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  perpsAccountId: ethers.BigNumberish;
}) {
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  console.time('fetchPerpsTotalCollateralValue');
  const totalCollateralValue = await PerpsMarketProxy.totalCollateralValue(perpsAccountId);
  console.timeEnd('fetchPerpsTotalCollateralValue');
  log({ totalCollateralValue });
  return totalCollateralValue;
}
