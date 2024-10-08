import { useQuery } from '@tanstack/react-query';
import { importAccountProxy } from './importAccountProxy';
import { importAllErrors } from './importAllErrors';
import { importCollateralTokens } from './importCollateralTokens';
import { importCoreProxy } from './importCoreProxy';
import { importExtras } from './importExtras';
import { importMintableTokens } from './importMintableTokens';
import { importMulticall } from './importMulticall';
import { importPerpsAccountProxy } from './importPerpsAccountProxy';
import { importPerpsMarketProxy } from './importPerpsMarketProxy';
import { importPythERC7412Wrapper } from './importPythERC7412Wrapper';
import { importRewardsDistributors } from './importRewardsDistributors';
import { importSpotMarketProxy } from './importSpotMarketProxy';
import { importSynthTokens } from './importSynthTokens';
import { importSystemToken } from './importSystemToken';
import { importWeth } from './importWeth';
import { useSynthetix } from './useSynthetix';

export function useImportContract(
  name:
    | 'AccountProxy'
    | 'AllErrors'
    | 'CoreProxy'
    | 'Multicall'
    | 'PythERC7412Wrapper'
    | 'SpotMarketProxy'
    | 'PerpsAccountProxy'
    | 'PerpsMarketProxy'
) {
  const { chainId, preset, queryClient } = useSynthetix();

  return useQuery(
    {
      queryKey: [chainId, preset, `Import${name}`],
      enabled: Boolean(name && chainId && preset),
      queryFn: () => {
        if (!(name && chainId && preset)) {
          throw 'OMFG';
        }
        switch (name) {
          case 'AccountProxy':
            return importAccountProxy(chainId, preset);
          case 'AllErrors':
            return importAllErrors(chainId, preset);
          case 'CoreProxy':
            return importCoreProxy(chainId, preset);
          case 'Multicall':
            return importMulticall(chainId, preset);
          case 'PythERC7412Wrapper':
            return importPythERC7412Wrapper(chainId, preset);
          case 'SpotMarketProxy':
            return importSpotMarketProxy(chainId, preset);
          case 'PerpsMarketProxy':
            return importPerpsMarketProxy(chainId, preset);
          case 'PerpsAccountProxy':
            return importPerpsAccountProxy(chainId, preset);
          default:
            throw new Error(`Unsupported contract ${name}`);
        }
      },
      staleTime: 60 * 60 * 1000,
      refetchInterval: false,
    },
    queryClient
  );
}

export function useImportExtras() {
  const { chainId, preset, queryClient } = useSynthetix();
  return useQuery(
    {
      queryKey: [chainId, preset, 'ImportExtras'],
      enabled: Boolean(chainId && preset),
      queryFn: () => {
        if (!(chainId && preset)) {
          throw 'OMFG';
        }
        return importExtras(chainId, preset);
      },
      staleTime: 60 * 60 * 1000,
      refetchInterval: false,
    },
    queryClient
  );
}

export function useImportSystemToken() {
  const { chainId, preset, queryClient } = useSynthetix();
  return useQuery(
    {
      queryKey: [chainId, preset, 'ImportSystemToken'],
      enabled: Boolean(chainId && preset),
      queryFn: () => {
        if (!(chainId && preset)) {
          throw 'OMFG';
        }
        return importSystemToken(chainId, preset);
      },
      staleTime: 60 * 60 * 1000,
      refetchInterval: false,
    },
    queryClient
  );
}

export function useImportPythFeeds() {
  const { chainId, preset, queryClient } = useSynthetix();
  return useQuery(
    {
      queryKey: [chainId, preset, 'ImportPythFeeds'],
      enabled: Boolean(chainId && preset),
      queryFn: () => {
        if (!(chainId && preset)) {
          throw 'OMFG';
        }
        return importSystemToken(chainId, preset);
      },
      staleTime: 60 * 60 * 1000,
      refetchInterval: false,
    },
    queryClient
  );
}

export function useImportSynthTokens() {
  const { chainId, preset, queryClient } = useSynthetix();
  return useQuery(
    {
      queryKey: [chainId, preset, 'ImportSynthTokens'],
      enabled: Boolean(chainId && preset),
      queryFn: () => {
        if (!(chainId && preset)) {
          throw 'OMFG';
        }
        return importSynthTokens(chainId, preset);
      },
      staleTime: 60 * 60 * 1000,
      refetchInterval: false,
    },
    queryClient
  );
}

export function useImportMintableTokens() {
  const { chainId, preset, queryClient } = useSynthetix();
  return useQuery(
    {
      queryKey: [chainId, preset, 'ImportMintableTokens'],
      enabled: Boolean(chainId && preset),
      queryFn: () => {
        if (!(chainId && preset)) {
          throw 'OMFG';
        }
        return importMintableTokens(chainId, preset);
      },
      staleTime: 60 * 60 * 1000,
      refetchInterval: false,
    },
    queryClient
  );
}

export function useImportRewardsDistributors() {
  const { chainId, preset, queryClient } = useSynthetix();

  return useQuery(
    {
      queryKey: [chainId, preset, 'ImportRewardsDistributors'],
      enabled: Boolean(chainId && preset),
      queryFn: () => {
        if (!(chainId && preset)) {
          throw 'OMFG';
        }
        return importRewardsDistributors(chainId, preset);
      },
      staleTime: 60 * 60 * 1000,
      refetchInterval: false,
    },
    queryClient
  );
}

export function useImportCollateralTokens() {
  const { chainId, preset, queryClient } = useSynthetix();

  return useQuery(
    {
      queryKey: [chainId, preset, 'ImportCollateralTokens'],
      enabled: Boolean(chainId && preset),
      queryFn: () => {
        if (!(chainId && preset)) {
          throw 'OMFG';
        }
        return importCollateralTokens(chainId, preset);
      },
      staleTime: 60 * 60 * 1000,
      refetchInterval: false,
    },
    queryClient
  );
}

export function useImportWethContract() {
  const { chainId, preset, queryClient } = useSynthetix();

  return useQuery(
    {
      queryKey: [chainId, preset, 'ImportWethContract'],
      enabled: Boolean(chainId && preset),
      queryFn: () => {
        if (!(chainId && preset)) {
          throw 'OMFG';
        }
        return importWeth(chainId, preset);
      },
      staleTime: 60 * 60 * 1000,
      refetchInterval: false,
    },
    queryClient
  );
}
