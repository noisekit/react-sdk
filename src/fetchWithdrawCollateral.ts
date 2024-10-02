import { ethers } from 'ethers';

export async function fetchWithdrawCollateral({
  provider,
  walletAddress,
  CoreProxyContract,
  accountId,
  tokenAddress,
  withdrawAmount,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumber;
  tokenAddress: string;
  withdrawAmount: ethers.BigNumber;
}) {
  const signer = provider.getSigner(walletAddress);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);

  const withdrawCollateralTxnArgs = [
    //
    accountId,
    tokenAddress,
    withdrawAmount,
  ];
  console.log({ withdrawCollateralTxnArgs });

  console.time('withdrawCollateral');
  const tx: ethers.ContractTransaction = await CoreProxy.withdraw(...withdrawCollateralTxnArgs);
  console.timeEnd('withdrawCollateral');
  console.log({ tx });
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
