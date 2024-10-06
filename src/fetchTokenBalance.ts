import { ethers } from 'ethers';

export async function fetchTokenBalance({
  provider,
  collateralTypeTokenAddress,
  ownerAddress,
}: {
  provider: ethers.providers.BaseProvider;
  collateralTypeTokenAddress: string;
  ownerAddress: string;
}) {
  const Token = new ethers.Contract(collateralTypeTokenAddress, ['function balanceOf(address account) view returns (uint256)'], provider);
  return Token.balanceOf(ownerAddress);
}
