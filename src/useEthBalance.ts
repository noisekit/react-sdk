import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useSynthetix } from './useSynthetix';

export function useEthBalance({ provider, walletAddress }: { provider?: ethers.providers.Web3Provider; walletAddress?: string }) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(chainId && provider && walletAddress),
    queryKey: [chainId, 'EthBalance', { ownerAddress: walletAddress }],
    queryFn: async () => {
      if (!(chainId && provider && walletAddress)) {
        throw 'OMFG';
      }

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
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
