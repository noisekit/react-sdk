import { ethers } from 'ethers';

export async function fetchPerpsCommitOrder({
  walletAddress,
  provider,
  PerpsMarketProxyContract,
  orderCommitmentArgs,
}: {
  walletAddress?: string;
  provider: ethers.providers.Web3Provider;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  orderCommitmentArgs: {
    perpsMarketId: string;
    perpsAccountId: ethers.BigNumber;
    sizeDelta: ethers.BigNumber;
    settlementStrategyId: string;
    acceptablePrice: ethers.BigNumber;
    referrer: string;
    trackingCode: string;
  };
}) {
  const signer = provider.getSigner(walletAddress);
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);

  console.time('fetchPerpsCommitOrder');
  const tx: ethers.ContractTransaction = await PerpsMarketProxy.commitOrder({
    marketId: orderCommitmentArgs.perpsMarketId,
    accountId: orderCommitmentArgs.perpsAccountId,
    sizeDelta: orderCommitmentArgs.sizeDelta,
    settlementStrategyId: orderCommitmentArgs.settlementStrategyId,
    acceptablePrice: orderCommitmentArgs.acceptablePrice,
    referrer: orderCommitmentArgs.referrer,
    trackingCode: orderCommitmentArgs.trackingCode,
  });
  console.timeEnd('fetchPerpsCommitOrder');
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
