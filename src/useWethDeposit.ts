import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useErrorParser } from './useErrorParser';
import { useImportWethContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useWethDeposit');

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
  const { chainId, preset, queryClient } = useSynthetix();

  const { data: WethContract } = useImportWethContract();

  const errorParser = useErrorParser();

  return useMutation({
    mutationFn: async (amount: ethers.BigNumberish) => {
      if (!(chainId && provider && walletAddress && perpsAccountId && WethContract)) {
        throw 'OMFG';
      }

      log({ chainId, preset, walletAddress, perpsAccountId, WethContract });

      const signer = provider.getSigner(walletAddress);
      const Weth = new ethers.Contract(WethContract.address, WethContract.abi, signer);
      const tx = await Weth.deposit({
        value: amount,
      });
      log({ tx });
      const txResult = await tx.wait();
      log({ txResult });
      return { tx, txResult };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: () => {
      if (!queryClient) return;

      queryClient.invalidateQueries({
        queryKey: [chainId, preset, 'Balance', { collateralTypeTokenAddress, ownerAddress: walletAddress }],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, preset, 'EthBalance', { ownerAddress: walletAddress }],
      });
      onSuccess();
    },
  });
}
