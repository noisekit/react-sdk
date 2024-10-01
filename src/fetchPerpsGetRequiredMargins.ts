import { ethers } from 'ethers';

export async function fetchPerpsGetRequiredMargins({
  provider,
  PerpsMarketProxyContract,
  perpsAccountId,
}: {
  provider: ethers.providers.BaseProvider;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  perpsAccountId: ethers.BigNumber;
}) {
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  console.time('fetchPerpsGetRequiredMargins');
  const requiredMargins = await PerpsMarketProxy.getRequiredMargins(perpsAccountId);
  console.timeEnd('fetchPerpsGetRequiredMargins');
  console.log({ requiredMargins });
  return requiredMargins;
}
