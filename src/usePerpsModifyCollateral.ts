import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchApproveToken } from './fetchApproveToken';
import { fetchTokenAllowance } from './fetchTokenAllowance';
import { fetchTokenBalance } from './fetchTokenBalance';
import { useErrorParser } from './useErrorParser';
import { useImportContract, useImportSystemToken } from './useImports';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePerpsModifyCollateral');

const USDx_MARKET_ID = 0;

export function usePerpsModifyCollateral({
  provider,
  walletAddress,
  perpsAccountId,
}: { provider?: ethers.providers.Web3Provider; walletAddress?: string; perpsAccountId?: ethers.BigNumberish }) {
  const { chainId, preset, queryClient } = useSynthetix();
  const errorParser = useErrorParser();
  const { data: systemToken } = useImportSystemToken();

  const { data: PerpsMarketProxyContract } = useImportContract('PerpsMarketProxy');

  return useMutation({
    mutationFn: async (depositAmount: ethers.BigNumberish) => {
      if (!(chainId && preset && provider && PerpsMarketProxyContract?.address && walletAddress && perpsAccountId && systemToken)) {
        throw 'OMFG';
      }

      log({ chainId, preset, PerpsMarketProxyContract, walletAddress, perpsAccountId, systemToken });

      if (ethers.BigNumber.from(depositAmount).lte(0)) {
        throw new Error('Amount required');
      }

      const freshBalance = await fetchTokenBalance({
        provider,
        ownerAddress: walletAddress,
        collateralTypeTokenAddress: systemToken?.address,
      });
      log('freshBalance: %O', freshBalance);

      if (freshBalance.lt(depositAmount)) {
        throw new Error('Not enough balance');
      }

      const freshAllowance = await fetchTokenAllowance({
        provider,
        ownerAddress: walletAddress,
        collateralTypeTokenAddress: systemToken.address,
        spenderAddress: PerpsMarketProxyContract.address,
      });
      log('freshAllowance: %O', freshAllowance);

      if (freshAllowance.lt(depositAmount)) {
        await fetchApproveToken({
          provider,
          walletAddress,
          collateralTypeTokenAddress: systemToken.address,
          spenderAddress: PerpsMarketProxyContract.address,
          allowance: ethers.BigNumber.from(depositAmount).sub(freshAllowance),
        });
      }

      const signer = provider.getSigner(walletAddress);
      const PerpsMarketProxy = new ethers.Contract(PerpsMarketProxyContract.address, PerpsMarketProxyContract.abi, signer);

      const modifyCollateralTxnArgs = [perpsAccountId, USDx_MARKET_ID, depositAmount];
      log('modifyCollateralTxnArgs: %O', modifyCollateralTxnArgs);
      const tx = await PerpsMarketProxy.modifyCollateral(...modifyCollateralTxnArgs);
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
        queryKey: [
          chainId,
          preset,
          'PerpsGetCollateralAmount',
          { PerpsMarketProxy: PerpsMarketProxyContract?.address },
          { collateral: USDx_MARKET_ID },
          perpsAccountId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [chainId, preset, 'Balance', { collateralTypeTokenAddress: systemToken?.address, ownerAddress: walletAddress }],
      });
      queryClient.invalidateQueries({
        queryKey: [chainId, preset, 'Perps GetAvailableMargin', { PerpsMarketProxy: PerpsMarketProxyContract?.address }, perpsAccountId],
      });
    },
  });
}
