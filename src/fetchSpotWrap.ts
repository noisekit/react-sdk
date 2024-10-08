import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchSpotWrap');

export async function fetchSpotWrap({
  provider,
  walletAddress,
  SpotMarketProxyContract,
  synthMarketId,
  amount,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  SpotMarketProxyContract: { address: string; abi: string[] };
  synthMarketId: ethers.BigNumberish;
  amount: ethers.BigNumberish;
}) {
  const signer = provider.getSigner(walletAddress);
  const SpotMarketProxy = new ethers.Contract(SpotMarketProxyContract.address, SpotMarketProxyContract.abi, signer);

  console.time('fetchSpotWrap');
  const tx: ethers.ContractTransaction = await SpotMarketProxy.wrap(synthMarketId, amount, amount);
  console.timeEnd('fetchSpotWrap');
  log({ tx });
  const txResult = await tx.wait();
  log({ txResult });
  return { tx, txResult };
}
