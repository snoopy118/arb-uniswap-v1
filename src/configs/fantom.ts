import { BigNumber } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { ArbConfig } from '../types';

const MIN_RESERVE = parseEther('10');
const MIN_PROFIT = parseEther('1');

const config: ArbConfig = {
  rpcUrl: 'https://rpc.ftm.tools/',
  factories: [
    {
      name: 'Spooky',
      address: '0x152ee697f2e276fa89e96742e9bb9ab1f2e61be3',
      fee: 998,
      feePrecision: 1000,
    },
    {
      name: 'Spirit',
      address: '0xef45d134b73241eda7703fa787148d9c9f4950b0',
      fee: 998,
      feePrecision: 1000,
    },
  ],
  baseToken: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
  blacklistTokens: ['0x46C642d20A21879cF0E54662dC6BBc19ef15E86e'],
  contracts: {
    uniswapLookup: '0x57E8741d93bfb3e3c5796d29e8649288e72fbd5c',
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
