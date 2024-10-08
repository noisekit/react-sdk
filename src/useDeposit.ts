import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { depositCollateral } from './depositCollateral';
import { fetchApproveToken } from './fetchApproveToken';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useErrorParser } from './useErrorParser';
import { useImportContract } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:useDeposit');

export function useDeposit({
  provider,
  walletAddress,
  accountId,
  poolId,
  collateralTypeTokenAddress,
  onSuccess,
}: {
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
  accountId?: ethers.BigNumberish;
  poolId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
  onSuccess: () => void;
}) {
  const { chainId, preset, queryClient } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: CoreProxyContract } = useImportContract('CoreProxy');

  return useMutation({
    mutationFn: async (depositAmount: ethers.BigNumberish) => {
      if (!(chainId && provider && CoreProxyContract && walletAddress && accountId && poolId && collateralTypeTokenAddress)) {
        throw 'OMFG';
      }

      log({ chainId, preset, CoreProxyContract, walletAddress, accountId, poolId, collateralTypeTokenAddress });

      if (ethers.BigNumber.from(depositAmount).lte(0)) {
        throw new Error('Amount required');
      }

      const freshBalance = await fetchTokenBalance({
        provider,
        ownerAddress: walletAddress,
        collateralTypeTokenAddress,
      });
      log('freshBalance: %O', freshBalance);

      if (freshBalance.lt(depositAmount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        provider,
        ownerAddress: walletAddress,
        collateralTypeTokenAddress,
        spenderAddress: CoreProxyContract?.address,
      });
      log('freshAllowance: %O', freshAllowance);

      if (freshAllowance.lt(depositAmount)) {
        await fetchApproveToken({
          provider,
          walletAddress,
          collateralTypeTokenAddress,
          spenderAddress: CoreProxyContract.address,
          allowance: ethers.BigNumber.from(depositAmount).sub(freshAllowance),
        });
      }

      log('-> depositCollateral');
      const { tx, txResult } = await depositCollateral({
        provider,
        walletAddress,
        CoreProxyContract,
        accountId,
        collateralTypeTokenAddress,
        depositAmount,
      });
      return { tx, txResult };
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    onSuccess: () => {
      if (!queryClient) return;

      // Intentionally do not await
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          preset,
          'AccountAvailableCollateral',
          { CoreProxy: CoreProxyContract?.address },
          {
            accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined,
            collateralTypeTokenAddress,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          chainId,
          preset,
          'PositionCollateral',
          { CoreProxy: CoreProxyContract?.address },
          {
            accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined,
            poolId: poolId ? ethers.BigNumber.from(poolId).toHexString() : undefined,
            collateralTypeTokenAddress,
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, preset, 'Balance', { collateralTypeTokenAddress, ownerAddress: walletAddress }],
      });

      onSuccess();
    },
  });
}
