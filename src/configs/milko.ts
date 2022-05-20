import { parseEther } from 'ethers/lib/utils';
import { ArbConfig } from '../types';

const MIN_RESERVE = parseEther('10');
const MIN_PROFIT = parseEther('1');

const config: ArbConfig = {
  rpcUrl: 'https://rpc-mainnet-cardano-evm.c1.milkomeda.com',
  factories: [
    {
      name: 'MilkySwap',
      address: '0xD6Ab33Ad975b39A8cc981bBc4Aaf61F957A5aD29',
      fee: 997,
      feePrecision: 1000,
    },
    {
      name: 'Occam',
      address: '0x2ef06A90b0E7Ae3ae508e83Ea6628a3987945460',
      fee: 997,
      feePrecision: 1000,
    },
    {
      name: 'Muesliswap',
      address: '0x57A8C24B2B0707478f91D3233A264eD77149D408',
      fee: 997,
      feePrecision: 1000,
    },
    {
      name: 'MilkyDex',
      address: '0x194Db21D9108f9da7a4E21f367d0eb8f8979144e',
      fee: 9975,
      feePrecision: 10000,
    },
  ],
  baseToken: '0xae83571000af4499798d1e3b0fa0070eb3a3e3f9',
  blacklistTokens: [''],
  contracts: {
    uniswapLookup: '0x5DdDc84B41B1e661E7738BD5CdfFC3067AA48dbd',
  },
  batchSize: 100,
  batchCountLimit: 30,
  minReserveLiquidity: MIN_RESERVE,
  minProfit: MIN_PROFIT,
  testVolumes: [
    MIN_RESERVE.div(100),
    MIN_RESERVE.div(10),
    MIN_RESERVE.div(6),
    MIN_RESERVE.div(4),
    MIN_RESERVE.div(2),
    MIN_RESERVE.div(1),
    MIN_RESERVE.mul(2),
    MIN_RESERVE.mul(5),
    MIN_RESERVE.mul(10),
  ],
};

export default config;
