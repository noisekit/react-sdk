import { ethers } from 'ethers';

export async function fetchPerpsSettleOrder({
  provider,
  walletAddress,
  PerpsMarketProxyContract,
  perpsAccountId,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  perpsAccountId: ethers.BigNumberish;
}) {
  const signer = provider.getSigner(walletAddress);
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);

  console.time('fetchPerpsSettleOrder');
  const tx: ethers.ContractTransaction = await PerpsMarketProxy.settleOrder(perpsAccountId);
  console.timeEnd('fetchPerpsSettleOrder');
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
