import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchMintUsdWithPriceUpdate');

export async function fetchMintUsdWithPriceUpdate({
  provider,
  walletAddress,
  CoreProxyContract,
  MulticallContract,
  accountId,
  poolId,
  collateralTypeTokenAddress,
  mintUsdAmount,
  priceUpdateTxn,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  CoreProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  poolId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  mintUsdAmount: ethers.BigNumberish;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumberish;
    requireSuccess: boolean;
  };
}) {
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const mintUsdTxnArgs = [
    //
    accountId,
    poolId,
    collateralTypeTokenAddress,
    mintUsdAmount,
  ];
  log('mintUsdTxnArgs: %O', mintUsdTxnArgs);

  const mintUsdTxn = {
    target: CoreProxyContract.address,
    callData: CoreProxyInterface.encodeFunctionData('mintUsd', [...mintUsdTxnArgs]),
    value: 0,
    requireSuccess: true,
  };
  log('mintUsdTxn: %O', mintUsdTxn);

  const signer = provider.getSigner(walletAddress);
  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, mintUsdTxn]]),
    value: priceUpdateTxn.value,
  };
  log('multicallTxn: %O', multicallTxn);

  console.time('mintUsd');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('mintUsd');
  log({ tx });
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
