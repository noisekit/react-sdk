import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchPositionDebt');

export async function fetchPositionDebt({
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
  console.time('fetchPositionDebt');
  const positionDebt = await CoreProxy.callStatic.getPositionDebt(accountId, poolId, collateralTypeTokenAddress);
  console.timeEnd('fetchPositionDebt');
  log('positionDebt: %O', positionDebt);
  return positionDebt;
}
