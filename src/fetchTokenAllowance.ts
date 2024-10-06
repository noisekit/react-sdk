import { ethers } from 'ethers';

export async function fetchTokenAllowance({
  provider,
  collateralTypeTokenAddress,
  ownerAddress,
  spenderAddress,
}: {
  provider: ethers.providers.BaseProvider;
  collateralTypeTokenAddress: string;
  ownerAddress: string;
  spenderAddress: string;
}) {
  const Token = new ethers.Contract(
    collateralTypeTokenAddress,
    ['function allowance(address owner, address spender) view returns (uint256)'],
    provider
  );
  return Token.allowance(ownerAddress, spenderAddress);
}
