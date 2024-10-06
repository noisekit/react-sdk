import { ethers } from 'ethers';

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
  console.log('delegateCollateralTxnArgs', delegateCollateralTxnArgs);

  console.time('delegateCollateral');
  const tx: ethers.ContractTransaction = await CoreProxy.delegateCollateral(...delegateCollateralTxnArgs);
  console.timeEnd('delegateCollateral');
  console.log({ tx });
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
