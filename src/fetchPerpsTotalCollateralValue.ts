import { ethers } from 'ethers';

export async function fetchPerpsTotalCollateralValue({
  provider,
  PerpsMarketProxyContract,
  accountId,
}: {
  provider?: ethers.providers.BaseProvider;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
}) {
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  console.time('fetchPerpsTotalCollateralValue');
  const accountAvailableCollateral = await PerpsMarketProxy.totalCollateralValue(accountId);
  console.timeEnd('fetchPerpsTotalCollateralValue');
  return accountAvailableCollateral;
}
