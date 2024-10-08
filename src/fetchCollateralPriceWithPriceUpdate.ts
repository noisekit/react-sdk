import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchCollateralPriceWithPriceUpdate');

export async function fetchCollateralPriceWithPriceUpdate({
  provider,
  CoreProxyContract,
  MulticallContract,
  collateralTypeTokenAddress,
  priceUpdateTxn,
}: {
  provider: ethers.providers.BaseProvider;
  CoreProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  collateralTypeTokenAddress: string;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumberish;
    requireSuccess: boolean;
  };
}) {
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  await new Promise((ok) => setTimeout(ok, 500));

  const getCollateralPriceTxn = {
    target: CoreProxyContract.address,
    callData: CoreProxyInterface.encodeFunctionData('getCollateralPrice', [collateralTypeTokenAddress]),
    value: 0,
    requireSuccess: true,
  };

  console.time('fetchCollateralPriceWithPriceUpdate');

  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);

  log({
    block,
    now: Math.floor(new Date().getTime() / 1000),
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, getCollateralPriceTxn]]),
    value: priceUpdateTxn.value,
  });

  const response = await provider.call({
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [[priceUpdateTxn, getCollateralPriceTxn]]),
    value: priceUpdateTxn.value,
  });
  console.timeEnd('fetchCollateralPriceWithPriceUpdate');
  log('response: %O', response);

  if (response) {
    const decodedMulticall = MulticallInterface.decodeFunctionResult('aggregate3Value', response);
    log('decodedMulticall: %O', decodedMulticall);
    if (decodedMulticall?.returnData?.[1]?.returnData) {
      const getCollateralPriceTxnData = decodedMulticall.returnData[1].returnData;
      log('getCollateralPriceTxnData: %O', getCollateralPriceTxnData);
      const collateralPrice = CoreProxyInterface.decodeFunctionResult('getCollateralPrice', getCollateralPriceTxnData);
      log('collateralPrice: %O', collateralPrice);
      return collateralPrice[0];
    }
    console.error({ decodedMulticall });
    throw new Error('Unexpected multicall response');
  }
  throw new Error('Empty multicall response');
}
