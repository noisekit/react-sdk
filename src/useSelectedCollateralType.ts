import React from 'react';
import { useCollateralTokens } from './useCollateralTokens';

export function useSelectedCollateralType({ collateralType }: { collateralType: string }) {
  const collateralTokens = useCollateralTokens();
  return React.useMemo(() => collateralTokens.find((token) => collateralType === token.address), [collateralTokens, collateralType]);
}
