import { ethers } from 'ethers';
import React from 'react';
import { usePerpsAccounts } from './usePerpsAccounts';

export function usePerpsSelectedAccountId({
  provider,
  walletAddress,
  perpsAccountId,
}: { provider?: ethers.providers.BaseProvider; walletAddress?: string; perpsAccountId?: string }): ethers.BigNumber | undefined {
  const { data: accounts } = usePerpsAccounts({ provider, walletAddress });

  return React.useMemo(() => {
    if (!perpsAccountId) {
      return;
    }
    if (!accounts) {
      return;
    }
    const bigNumberPerpsAccountId = ethers.BigNumber.from(perpsAccountId);
    return accounts.find((id) => bigNumberPerpsAccountId.eq(id));
  }, [accounts, perpsAccountId]);
}
