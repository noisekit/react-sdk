import { ethers } from 'ethers';

export async function fetchAccountCollateral({
  provider,
  CoreProxyContract,
  accountId,
  collateralTypeTokenAddress,
}: {
  provider: ethers.providers.BaseProvider;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
}) {
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  console.time('fetchAccountCollateral');
  const accountCollateral = await CoreProxy.getAccountCollateral(accountId, collateralTypeTokenAddress);
  console.timeEnd('fetchAccountCollateral');
  return {
    totalAssigned: accountCollateral.totalAssigned,
    totalDeposited: accountCollateral.totalDeposited,
    totalLocked: accountCollateral.totalLocked,
  };
}
