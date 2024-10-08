import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useEthBalance');

export function useEthBalance({ provider, walletAddress }: { provider?: ethers.providers.Web3Provider; walletAddress?: string }) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && preset && provider && walletAddress),
    queryKey: [chainId, preset, 'EthBalance', { ownerAddress: walletAddress }],
    queryFn: async () => {
      if (!(chainId && preset && provider && walletAddress)) {
        throw 'OMFG';
      }

      log({ chainId, preset, walletAddress });

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      log('balance: %O', balance);
      return balance;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    refetchInterval: 5 * 60 * 1000,
    select: (balance) => ethers.BigNumber.from(balance),
  });
}
