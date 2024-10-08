import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchPerpsCommitOrderWithPriceUpdate');

export async function fetchPerpsCommitOrderWithPriceUpdate({
  provider,
  walletAddress,
  PerpsMarketProxyContract,
  MulticallContract,
  orderCommitmentArgs,
  priceUpdateTxn,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  orderCommitmentArgs: {
    perpsMarketId: ethers.BigNumberish;
    perpsAccountId: ethers.BigNumberish;
    sizeDelta: ethers.BigNumberish;
    settlementStrategyId: ethers.BigNumberish;
    acceptablePrice: ethers.BigNumberish;
    referrer: string;
    trackingCode: string;
  };
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumberish;
    requireSuccess: boolean;
  };
}) {
  const PerpsMarketPoxyInterface = new ethers.utils.Interface(PerpsMarketProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const commitOrderTxn = {
    target: PerpsMarketProxyContract.address,
    callData: PerpsMarketPoxyInterface.encodeFunctionData('commitOrder', [
      {
        marketId: orderCommitmentArgs.perpsMarketId,
        accountId: orderCommitmentArgs.perpsAccountId,
        sizeDelta: orderCommitmentArgs.sizeDelta,
        settlementStrategyId: orderCommitmentArgs.settlementStrategyId,
        acceptablePrice: orderCommitmentArgs.acceptablePrice,
        referrer: orderCommitmentArgs.referrer,
        trackingCode: orderCommitmentArgs.trackingCode,
      },
    ]),
    value: 0,
    requireSuccess: true,
  };
  log({ commitOrderTxn });

  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, commitOrderTxn]]),
    value: priceUpdateTxn.value,
  };
  log({ multicallTxn });

  console.time('fetchPerpsCommitOrderWithPriceUpdate');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  log({ tx });
  console.timeEnd('fetchPerpsCommitOrderWithPriceUpdate');
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
