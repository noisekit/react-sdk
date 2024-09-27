import { ethers } from 'ethers';

export async function fetchSpotSell({
  provider,
  walletAddress,
  SpotMarketProxyContract,
  marketId,
  amount,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  SpotMarketProxyContract: { address: string; abi: string[] };
  marketId: string;
  amount: ethers.BigNumber;
}) {
  const signer = provider.getSigner(walletAddress);
  const SpotMarketProxy = new ethers.Contract(SpotMarketProxyContract.address, SpotMarketProxyContract.abi, signer);

  console.time('fetchSpotSell');
  const tx: ethers.ContractTransaction = await SpotMarketProxy.sell(marketId, amount, amount, ethers.constants.AddressZero);
  console.timeEnd('fetchSpotSell');
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
