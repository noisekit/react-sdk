import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportWethContract } from './useImports';
import { useSynthetix } from './useSynthetix';

export function useWethDeposit({
  provider,
  walletAddress,
  perpsAccountId,
  collateralTypeTokenAddress,
  onSuccess,
}: {
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  perpsAccountId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
  onSuccess: () => void;
}) {
  const { chainId, queryClient } = useSynthetix();

  const { data: WethContract } = useImportWethContract();

  const errorParser = useErrorParser();

  return useMutation({
    mutationFn: async (amount: ethers.BigNumberish) => {
      if (!(chainId && provider && walletAddress && perpsAccountId && WethContract)) {
        throw 'OMFG';
      }

      const signer = provider.getSigner(walletAddress);
      const Weth = new ethers.Contract(WethContract.address, WethContract.abi, signer);
      const tx = await Weth.deposit({
        value: amount,
      });
      const txResult = await tx.wait();
      console.log({ txResult });
      return txResult;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: () => {
      if (!queryClient) return;

      queryClient.invalidateQueries({
        queryKey: [chainId, 'Balance', { collateralTypeTokenAddress, ownerAddress: walletAddress }],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, 'EthBalance', { ownerAddress: walletAddress }],
      });
      onSuccess();
    },
  });
}
