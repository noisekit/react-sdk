import { ethers } from 'ethers';

export async function fetchPerpsGetAvailableMargin({
  provider,
  perpsAccountId,
  PerpsMarketProxyContract,
}: {
  provider?: ethers.providers.BaseProvider;
  perpsAccountId: ethers.BigNumber;
  PerpsMarketProxyContract: { address: string; abi: string[] };
}) {
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  console.time('fetchPerpsGetAvailableMargin');
  const accountAvailableCollateral = await PerpsMarketProxy.getAvailableMargin(perpsAccountId);
  console.timeEnd('fetchPerpsGetAvailableMargin');
  console.log({ accountAvailableCollateral });
  return accountAvailableCollateral;
}
