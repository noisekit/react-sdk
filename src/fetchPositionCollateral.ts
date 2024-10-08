import { ethers } from 'ethers';

export async function fetchPositionCollateral({
  provider,
  CoreProxyContract,
  accountId,
  poolId,
  collateralTypeTokenAddress,
}: {
  provider: ethers.providers.BaseProvider;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  poolId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
}) {
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  const positionCollateral = await CoreProxy.getPositionCollateral(accountId, poolId, collateralTypeTokenAddress);
  return positionCollateral;
}
