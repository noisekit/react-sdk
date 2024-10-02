import { ethers } from 'ethers';

export async function depositCollateral({
  provider,
  walletAddress,
  CoreProxyContract,
  accountId,
  tokenAddress,
  depositAmount,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
  tokenAddress: string;
  depositAmount: ethers.BigNumber;
}) {
  const signer = provider.getSigner(walletAddress);

  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);
  const tx: ethers.ContractTransaction = await CoreProxy.deposit(
    //
    accountId,
    tokenAddress,
    depositAmount
  );
  console.log({ tx });
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
