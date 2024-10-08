import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchTokenBalance');

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
  const balance = Token.balanceOf(ownerAddress);
  log({ balance });
  return balance;
}
