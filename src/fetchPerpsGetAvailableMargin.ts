import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('fetchPerpsGetAvailableMargin');

export async function fetchPerpsGetAvailableMargin({
  provider,
  perpsAccountId,
  PerpsMarketProxyContract,
}: {
  provider: ethers.providers.BaseProvider;
  perpsAccountId: ethers.BigNumberish;
  PerpsMarketProxyContract: { address: string; abi: string[] };
}) {
  const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, provider);
  console.time('fetchPerpsGetAvailableMargin');
  const availableMargin = await PerpsMarketProxy.getAvailableMargin(perpsAccountId);
  console.timeEnd('fetchPerpsGetAvailableMargin');
  log({ availableMargin });
  return availableMargin;
}
