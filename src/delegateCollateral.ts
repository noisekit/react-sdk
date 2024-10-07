import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('delegateCollateral');

export async function delegateCollateral({
  provider,
  walletAddress,
  CoreProxyContract,
  accountId,
  poolId,
  collateralTypeTokenAddress,
  delegateAmount,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  poolId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  delegateAmount: ethers.BigNumberish;
}) {
  const signer = provider.getSigner(walletAddress);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);

  const delegateCollateralTxnArgs = [
    //
    accountId,
    poolId,
    collateralTypeTokenAddress,
    delegateAmount,
    ethers.utils.parseEther('1'), // Leverage
  ];
  log({ delegateCollateralTxnArgs });

  console.time('delegateCollateral');
  const tx: ethers.ContractTransaction = await CoreProxy.delegateCollateral(...delegateCollateralTxnArgs);
  console.timeEnd('delegateCollateral');
  log({ tx });
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
