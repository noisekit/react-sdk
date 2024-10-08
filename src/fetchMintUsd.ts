import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchMintUsd');

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
  log({ mintUsdTxnArgs });

  console.time('mintUsd');
  const tx: ethers.ContractTransaction = await CoreProxy.mintUsd(...mintUsdTxnArgs);
  console.timeEnd('mintUsd');
  log({ tx });
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
