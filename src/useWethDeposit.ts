import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportWethContract } from './useImports';
import { useSynthetix } from './useSynthetix';

export function useWethDeposit({
  onSuccess,
  provider,
  walletAddress,
  perpsAccountId,
}: {
  onSuccess: () => void;
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  perpsAccountId?: ethers.BigNumber;
}) {
  const { chainId } = useSynthetix();
  const errorParser = useErrorParser();
  const { data: WethContract } = useImportWethContract();

  return useMutation({
    mutationFn: async (amount: ethers.BigNumber) => {
      if (!(chainId && provider && walletAddress && perpsAccountId && WethContract)) {
        throw 'OMFG';
      }

      const signer = provider.getSigner(walletAddress);
      const Weth = new ethers.Contract(WethContract.address, WethContract.abi, signer);
      const tx = await Weth.deposit({
        value: amount,
      });
      const txResult = await tx.wait();
      return txResult;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: () => {
      onSuccess();
    },
  });
}
