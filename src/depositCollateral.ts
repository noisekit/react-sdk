import { ethers } from 'ethers';

export async function depositCollateral({
  provider,
  walletAddress,
  CoreProxyContract,
  accountId,
  collateralTypeTokenAddress,
  depositAmount,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  depositAmount: ethers.BigNumberish;
}) {
  const signer = provider.getSigner(walletAddress);

  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);
  const tx: ethers.ContractTransaction = await CoreProxy.deposit(
    //
    accountId,
    collateralTypeTokenAddress,
    depositAmount
  );
  console.log({ tx });
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
