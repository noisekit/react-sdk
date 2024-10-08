import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import debug from 'debug';

const log = debug('snx:getPythPrice');

const PYTH_MAINNET_ENDPOINT = process.env.PYTH_MAINNET_ENDPOINT || 'https://hermes.pyth.network';

export async function getPythPrice({ feedId }: { feedId: string }) {
  const priceService = new EvmPriceServiceConnection(PYTH_MAINNET_ENDPOINT);
  const feeds = await priceService.getLatestPriceFeeds([feedId]);

  if (!feeds || feeds.length !== 1) {
    throw Error(`Price feed not found, feed id: ${feedId}`);
  }

  const [feed] = feeds;
  const uncheckedPrice = feed.getPriceUnchecked();
  const price = uncheckedPrice.getPriceAsNumberUnchecked();
  log({ price });
  return price;
}
