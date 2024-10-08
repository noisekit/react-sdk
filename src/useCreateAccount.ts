import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useCreateAccount');

export function useCreateAccount({
  provider,
  walletAddress,
  handleAccountCreated,
}: { provider?: ethers.providers.Web3Provider; walletAddress?: string; handleAccountCreated: (accountId: string) => void }) {
  const { chainId, queryClient } = useSynthetix();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');
  const { data: AccountProxyContract } = useImportContract('AccountProxy');

  return useMutation({
    mutationFn: async () => {
      if (!(chainId && provider && CoreProxyContract && AccountProxyContract && walletAddress && queryClient)) throw 'OMFG';

      log({ chainId, provider, CoreProxyContract, AccountProxyContract, walletAddress, queryClient });

      const signer = provider.getSigner(walletAddress);
      const CoreProxy = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, signer);
      const tx: ethers.ContractTransaction = await CoreProxy['createAccount()']();
      log({ tx });
      const txResult = await tx.wait();
      log({ txResult });

      const event = txResult.events?.find((e) => e.event === 'AccountCreated');
      if (event) {
        const accountId = event?.args?.accountId?.toString();
        if (accountId) {
          queryClient.setQueryData(
            [chainId, 'Accounts', { AccountProxy: AccountProxyContract?.address }, { ownerAddress: walletAddress }],
            (oldData: string[]) => oldData.concat([accountId])
          );
          handleAccountCreated(accountId);
        }
      }

      return { tx, txResult };
    },
  });
}
