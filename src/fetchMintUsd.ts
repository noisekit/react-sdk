import { ethers } from 'ethers';

export async function fetchMintUsd({
  provider,
  walletAddress,
  CoreProxyContract,
  accountId,
  poolId,
  collateralTypeTokenAddress,
  mintUsdAmount,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  CoreProxyContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  poolId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  mintUsdAmount: ethers.BigNumberish;
}) {
  const signer = provider.getSigner(walletAddress);

  const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);
  const mintUsdTxnArgs = [
    //
    accountId,
    poolId,
    collateralTypeTokenAddress,
    mintUsdAmount,
  ];
  console.log('mintUsdTxnArgs', mintUsdTxnArgs);

  console.time('mintUsd');
  const tx: ethers.ContractTransaction = await CoreProxy.mintUsd(...mintUsdTxnArgs);
  console.timeEnd('mintUsd');
  console.log({ tx });
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
