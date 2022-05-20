import { BigNumber } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { ArbConfig } from '../types';

const MIN_RESERVE = parseEther('10');
const MIN_PROFIT = parseEther('1');

const config: ArbConfig = {
  rpcUrl:
    'https://little-divine-snow.matic.quiknode.pro/48c33c1cdaa3859fa1691690a492a539f5056e46/',
  factories: [
    {
      name: 'Quickswap',
      address: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
      fee: 997,
      feePrecision: 1000,
    },
    {
      name: 'Sushi',
      address: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      fee: 997,
      feePrecision: 1000,
    },
    {
      name: 'Meshswap',
      address: '0x9F3044f7F9FC8bC9eD615d54845b4577B833282d',
      fee: 997,
      feePrecision: 1000,
    },
  ],
  baseToken: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  blacklistTokens: ['0x071ab2bf3Cb7c51897d74CEC58a47aE85d655956'],
  contracts: {
    uniswapLookup: '0x04290D4a6E2465b7D7cB0E9Cc166031bDc564603',
  },
  batchSize: 1000,
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
