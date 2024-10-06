import { ethers } from 'ethers';

export async function fetchSpotSell({
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

  console.time('fetchSpotSell');
  const tx: ethers.ContractTransaction = await SpotMarketProxy.sell(synthMarketId, amount, amount, ethers.constants.AddressZero);
  console.timeEnd('fetchSpotSell');
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
