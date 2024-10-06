import { ethers } from 'ethers';

export async function fetchWithdrawCollateral({
  provider,
  walletAddress,
  CoreProxyContract,
  accountId,
  collateralTypeTokenAddress,
  withdrawAmount,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  withdrawAmount: ethers.BigNumberish;
}) {
  const signer = provider.getSigner(walletAddress);
  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);

  const withdrawCollateralTxnArgs = [
    //
    accountId,
    collateralTypeTokenAddress,
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
