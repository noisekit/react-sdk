import { ethers } from 'ethers';
import React from 'react';
import { useImportCollateralTokens } from './useImports';

export function useCollateralTokens(): Array<{
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  depositingEnabled: boolean;
  oracleNodeId: string;
  tokenAddress: string;
  issuanceRatioD18: ethers.BigNumber;
  liquidationRatioD18: ethers.BigNumber;
  liquidationRewardD18: ethers.BigNumber;
  minDelegationD18: ethers.BigNumber;
}> {
  const { data: tokens } = useImportCollateralTokens();
  return React.useMemo(() => {
    if (tokens) {
      return tokens
        .filter(({ depositingEnabled }) => depositingEnabled)
        .map(({ issuanceRatioD18, liquidationRatioD18, liquidationRewardD18, minDelegationD18, ...rest }) => ({
          ...rest,
          issuanceRatioD18: ethers.BigNumber.from(issuanceRatioD18),
          liquidationRatioD18: ethers.BigNumber.from(liquidationRatioD18),
          liquidationRewardD18: ethers.BigNumber.from(liquidationRewardD18),
          minDelegationD18: ethers.BigNumber.from(minDelegationD18),
        }));
    }
    return [];
  }, [tokens]);
}
