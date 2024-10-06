import { ethers } from 'ethers';

export async function fetchCollateralPrice({
  provider,
  CoreProxyContract,
  collateralTypeTokenAddress,
}: {
  provider: ethers.providers.BaseProvider;
  CoreProxyContract: { address: string; abi: string[] };
  collateralTypeTokenAddress: string;
}) {
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  console.time('fetchCollateralPrice');
  const collateralPrice = await CoreProxy.getCollateralPrice(collateralTypeTokenAddress);
  console.timeEnd('fetchCollateralPrice');
  return collateralPrice;
}
