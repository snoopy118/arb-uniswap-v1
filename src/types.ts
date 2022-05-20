import { BigNumber } from 'ethers';
import { UniswapV2Pair } from './UniswapV2Pair';

export interface UniswapV2PairToken {
  address: string;
  balance: BigNumber;
}

export interface Factory {
  name: string;
  address: string;
  fee: number;
  feePrecision: number;
}

export interface ArbContracts {
  uniswapLookup: string;
}

export interface ArbConfig {
  rpcUrl: string;
  factories: Factory[];
  baseToken: string;
  blacklistTokens: string[];
  contracts: ArbContracts;
  batchSize: number;
  batchCountLimit: number;
  minReserveLiquidity: BigNumber;
  minProfit: BigNumber;
  testVolumes: BigNumber[];
}

export interface CrossedPairDetails {
  profit: BigNumber;
  volume: BigNumber;
  tokenAddress: string;
  buyFrom: UniswapV2Pair;
  sellTo: UniswapV2Pair;
}
