import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchPerpsGetRequiredMargins');

export async function fetchPerpsGetRequiredMargins({
  provider,
  PerpsMarketProxyContract,
  perpsAccountId,
}: {
  provider: ethers.providers.BaseProvider;
  PerpsMarketProxyContract: { address: string; abi: string[] };
  perpsAccountId: ethers.BigNumberish;
}) {
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  console.time('fetchPerpsGetRequiredMargins');
  const requiredMargins = await PerpsMarketProxy.getRequiredMargins(perpsAccountId);
  console.timeEnd('fetchPerpsGetRequiredMargins');
  log({ requiredMargins });
  return requiredMargins;
}
