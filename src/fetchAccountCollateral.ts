import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchAccountCollateral');

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
  log('accountCollateral: %O', accountCollateral);
  return {
    totalAssigned: accountCollateral.totalAssigned,
    totalDeposited: accountCollateral.totalDeposited,
    totalLocked: accountCollateral.totalLocked,
  };
}
