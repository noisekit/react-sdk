import { ethers } from 'ethers';

export async function fetchAccountAvailableCollateral({
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
  console.time('fetchAccountAvailableCollateral');
  const accountAvailableCollateral = await CoreProxy.getAccountAvailableCollateral(accountId, collateralTypeTokenAddress);
  console.timeEnd('fetchAccountAvailableCollateral');
  return accountAvailableCollateral;
}
