import { ethers } from 'ethers';

export async function fetchApproveToken({
  provider,
  walletAddress,
  collateralTypeTokenAddress,
  spenderAddress,
  allowance,
}: {
  provider: ethers.providers.Web3Provider;
  walletAddress: string;
  collateralTypeTokenAddress: string;
  spenderAddress: string;
  allowance: ethers.BigNumberish;
}) {
  const signer = provider.getSigner(walletAddress);
  const Token = new ethers.Contract(
    collateralTypeTokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)'],
    signer
  );
  const tx: ethers.ContractTransaction = await Token.approve(spenderAddress, allowance);
  console.log({ tx });
  const txResult = await tx.wait();
  console.log({ txResult });
  return txResult;
}
