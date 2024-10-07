import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('fetchPositionDebtWithPriceUpdate');

export async function fetchPositionDebtWithPriceUpdate({
  provider,
  CoreProxyContract,
  MulticallContract,
  accountId,
  poolId,
  collateralTypeTokenAddress,
  priceUpdateTxn,
}: {
  provider: ethers.providers.BaseProvider;
  CoreProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  poolId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumberish;
    requireSuccess: boolean;
  };
}) {
  // const CoreProxyInterface = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  await new Promise((ok) => setTimeout(ok, 500));

  const getPositionDebtTxn = {
    target: CoreProxyContract.address,
    callData: CoreProxyInterface.encodeFunctionData('getPositionDebt', [accountId, poolId, collateralTypeTokenAddress]),
    value: 0,
    requireSuccess: true,
  };
  // const Multicall = new ethers.Contract(MulticallContract.address, MulticallContract.abi, provider);

  console.time('fetchPositionDebtWithPriceUpdate');
  const response = await provider.call({
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, getPositionDebtTxn]]),
    value: priceUpdateTxn.value,
  });
  console.timeEnd('fetchPositionDebtWithPriceUpdate');
  log({ response });

  if (response) {
    const decodedMulticall = MulticallInterface.decodeFunctionResult('aggregate3Value', response);
    log({ decodedMulticall });
    if (decodedMulticall?.returnData?.[1]?.returnData) {
      const getPositionDebtTxnData = decodedMulticall.returnData[1].returnData;
      log({ getPositionDebtTxnData });
      const positionDebt = CoreProxyInterface.decodeFunctionResult('getPositionDebt', getPositionDebtTxnData);
      log({ positionDebt });
      return positionDebt.debt;
    }
    console.error({ decodedMulticall });
    throw new Error('Unexpected multicall response');
  }
  throw new Error('Empty multicall response');
}
