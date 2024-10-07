import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('fetchPerpsSettleOrderWithPriceUpdate');

export async function fetchPerpsSettleOrderWithPriceUpdate({
  provider,
  walletAddress,
  PerpsMarketProxyContract,
  MulticallContract,
  perpsAccountId,
  priceUpdateTxn,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  perpsAccountId: ethers.BigNumberish;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumberish;
    requireSuccess: boolean;
  };
}) {
  const PerpsMarketPoxyInterface = new ethers.utils.Interface(PerpsMarketProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const settleOrderTxn = {
    target: PerpsMarketProxyContract.address,
    callData: PerpsMarketPoxyInterface.encodeFunctionData('settleOrder', [perpsAccountId]),
    value: 0,
    requireSuccess: true,
  };
  log({ settleOrderTxn });

  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, settleOrderTxn]]),
    value: priceUpdateTxn.value,
  };
  log({ multicallTxn });

  console.time('fetchPerpsSettleOrderWithPriceUpdate');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('fetchPerpsSettleOrderWithPriceUpdate');
  log({ tx });
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
