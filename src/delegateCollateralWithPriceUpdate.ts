import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:delegateCollateralWithPriceUpdate');

export async function delegateCollateralWithPriceUpdate({
  provider,
  walletAddress,
  CoreProxyContract,
  MulticallContract,
  accountId,
  poolId,
  collateralTypeTokenAddress,
  delegateAmount,
  priceUpdateTxn,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  CoreProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  poolId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  delegateAmount: ethers.BigNumberish;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumberish;
    requireSuccess: boolean;
  };
}) {
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const delegateCollateralTxnArgs = [
    //
    accountId,
    poolId,
    collateralTypeTokenAddress,
    delegateAmount,
    ethers.utils.parseEther('1'), // Leverage
  ];
  log({ delegateCollateralTxnArgs });

  const delegateCollateralTxn = {
    target: CoreProxyContract.address,
    callData: CoreProxyInterface.encodeFunctionData('delegateCollateral', [
      //
      ...delegateCollateralTxnArgs,
    ]),
    value: 0,
    requireSuccess: true,
  };
  log({ delegateCollateralTxn });

  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, delegateCollateralTxn]]),
    value: priceUpdateTxn.value,
  };
  log({ multicallTxn });

  console.time('delegateCollateralWithPriceUpdate');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('delegateCollateralWithPriceUpdate');
  log({ tx });
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
