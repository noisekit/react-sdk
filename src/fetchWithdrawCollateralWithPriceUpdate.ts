import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchWithdrawCollateralWithPriceUpdate');

export async function fetchWithdrawCollateralWithPriceUpdate({
  provider,
  walletAddress,
  CoreProxyContract,
  MulticallContract,
  accountId,
  collateralTypeTokenAddress,
  withdrawAmount,
  priceUpdateTxn,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  CoreProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  withdrawAmount: ethers.BigNumberish;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumberish;
    requireSuccess: boolean;
  };
}) {
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const withdrawCollateralTxnArgs = [
    //
    accountId,
    collateralTypeTokenAddress,
    withdrawAmount,
  ];
  log('withdrawCollateralTxnArgs: %O', withdrawCollateralTxnArgs);

  const withdrawCollateralTxn = {
    target: CoreProxyContract.address,
    callData: CoreProxyInterface.encodeFunctionData('withdraw', [
      //
      ...withdrawCollateralTxnArgs,
    ]),
    value: 0,
    requireSuccess: true,
  };
  log('withdrawCollateralTxn: %O', withdrawCollateralTxn);

  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, withdrawCollateralTxn]]),
    value: priceUpdateTxn.value,
  };
  log('multicallTxn: %O', multicallTxn);

  console.time('withdrawCollateral');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('withdrawCollateral');
  log({ tx });
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
