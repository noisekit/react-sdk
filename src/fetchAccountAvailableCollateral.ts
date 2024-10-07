import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('fetchAccountAvailableCollateral');

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
  log({ accountAvailableCollateral });
  return accountAvailableCollateral;
}
