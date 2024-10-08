import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchSpotWrapWithPriceUpdate');

export async function fetchSpotWrapWithPriceUpdate({
  provider,
  walletAddress,
  SpotMarketProxyContract,
  MulticallContract,
  synthMarketId,
  amount,
  priceUpdateTxn,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  SpotMarketProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  synthMarketId: ethers.BigNumberish;
  amount: ethers.BigNumberish;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumberish;
    requireSuccess: boolean;
  };
}) {
  const SpotMarketProxyInterface = new ethers.utils.Interface(SpotMarketProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const wrapArgs = [synthMarketId, amount, amount];
  log('wrapArgs: %O', wrapArgs);

  const wrapTxn = {
    target: SpotMarketProxyContract.address,
    callData: SpotMarketProxyInterface.encodeFunctionData('wrap', [...wrapArgs]),
    value: 0,
    requireSuccess: true,
  };
  log('wrapTxn: %O', wrapTxn);

  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, wrapTxn]]),
    value: priceUpdateTxn.value,
  };
  log('multicallTxn: %O', multicallTxn);

  console.time('fetchSpotWrapWithPriceUpdate');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('fetchSpotWrapWithPriceUpdate');
  log({ tx });
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
