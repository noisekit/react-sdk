import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchSpotSellWithPriceUpdate');

export async function fetchSpotSellWithPriceUpdate({
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

  const sellArgs = [synthMarketId, amount, amount, ethers.constants.AddressZero];

  log('sellArgs: %O', sellArgs);

  const sellTnx = {
    target: SpotMarketProxyContract.address,
    callData: SpotMarketProxyInterface.encodeFunctionData('sell', [...sellArgs]),
    value: 0,
    requireSuccess: true,
  };
  log('sellTnx: %O', sellTnx);

  const signer = provider.getSigner(walletAddress);

  const multicallTxn = {
    from: walletAddress,
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, sellTnx]]),
    value: priceUpdateTxn.value,
  };
  log('multicallTxn: %O', multicallTxn);

  console.time('fetchSpotSellWithPriceUpdate');
  const tx: ethers.ContractTransaction = await signer.sendTransaction(multicallTxn);
  console.timeEnd('fetchSpotSellWithPriceUpdate');
  log({ tx });
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
