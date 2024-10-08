import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchBurnUsd');

export async function fetchBurnUsd({
  provider,
  walletAddress,
  CoreProxyContract,
  accountId,
  poolId,
  collateralTypeTokenAddress,
  burnUsdAmount,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  poolId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  burnUsdAmount: ethers.BigNumberish;
}) {
  const signer = provider.getSigner(walletAddress);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);

  const burnUsdTxnArgs = [
    //
    accountId,
    poolId,
    collateralTypeTokenAddress,
    burnUsdAmount,
  ];
  log('burnUsdTxnArgs: %O', burnUsdTxnArgs);

  console.time('burnUsd');
  const tx: ethers.ContractTransaction = await CoreProxy.burnUsd(...burnUsdTxnArgs);
  console.timeEnd('burnUsd');
  log({ tx });
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
