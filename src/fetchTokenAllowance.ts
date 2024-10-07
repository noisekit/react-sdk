import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('fetchTokenAllowance');

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
  const allowance = Token.allowance(ownerAddress, spenderAddress);
  log({ allowance });
  return allowance;
}
