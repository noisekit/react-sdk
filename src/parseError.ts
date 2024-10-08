import debug from 'debug';
/* eslint-disable no-console */
import { ethers } from 'ethers';
import { decodeBuiltinErrors } from './decodeBuiltinErrors';
import { decodePythErrors } from './decodePythErrors';

const log = debug('snx:parseError');

export async function parseError({
  error,
  AllErrorsContract,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: Error comes from wallets and can be anything
  error: Error | any;
  AllErrorsContract: { address: string; abi: string[] };
}) {
  const errorData =
    error?.error?.error?.error?.data ||
    error?.error?.error?.data ||
    error?.error?.data?.data ||
    error?.error?.data ||
    error?.data?.data ||
    error?.data;

  if (typeof errorData !== 'string') {
    log('Error data missing', { error });
    throw error;
  }
  const errorParsed = (() => {
    try {
      const panic = decodeBuiltinErrors(errorData);
      if (panic) {
        return panic;
      }
      const pythError = decodePythErrors(errorData);
      if (pythError) {
        return pythError;
      }
      const AllErrorsInterface = new ethers.utils.Interface(AllErrorsContract.abi);
      const data = AllErrorsInterface.parseError(errorData);
      log('decodedError: %O', data);

      if (data?.name === 'OracleDataRequired' && data?.args?.oracleContract && data?.args?.oracleQuery) {
        const oracleAddress = data?.args?.oracleContract;
        const oracleQueryRaw = data?.args?.oracleQuery;

        let updateType: number;
        let publishTime: number | undefined;
        let stalenessTolerance: number | undefined;
        let feedIds: string[];
        let priceId: string;
        // eslint-disable-next-line prefer-const
        [updateType, publishTime, priceId] = ethers.utils.defaultAbiCoder.decode(['uint8', 'uint64', 'bytes32'], oracleQueryRaw);

        if (updateType === 1) {
          [updateType, stalenessTolerance, feedIds] = ethers.utils.defaultAbiCoder.decode(['uint8', 'uint64', 'bytes32[]'], oracleQueryRaw);
          publishTime = undefined;
        } else {
          feedIds = [priceId];
        }
        Object.assign(error, {
          name: data.name,
          error,
          args: {
            oracleAddress,
            oracleQuery: {
              updateType,
              publishTime: Number(publishTime),
              stalenessTolerance: Number(stalenessTolerance),
              feedIds,
            },
            oracleQueryRaw,
          },
          signature: data.signature,
          sighash: data.sighash,
          errorFragment: data.errorFragment,
        });
        return error;
      }
      return data;
    } catch (e) {
      log(e);
    }
    return error;
  })();
  if (!errorParsed.name) {
    throw error;
  }
  const args = errorParsed?.args
    ? Object.fromEntries(Object.entries(errorParsed.args).filter(([key]) => `${Number.parseInt(key)}` !== key))
    : {};
  error.message = `${errorParsed?.name}, ${errorParsed?.sighash} (${JSON.stringify(args)})`;
  throw error;
}
