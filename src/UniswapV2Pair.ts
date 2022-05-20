import { BigNumber } from 'ethers';
import { UniswapV2PairToken } from './types';

export class UniswapV2Pair {
  readonly address: string;
  token0: UniswapV2PairToken;
  token1: UniswapV2PairToken;
  fee: number;
  feePrecision: number;
  protocol: string;

  constructor(
    _protocol: string,
    _address: string,
    _token0: string,
    _token1: string,
    _fee: number,
    _feePrecision: number,
  ) {
    this.protocol = _protocol;
    this.address = _address;
    this.token0 = { address: _token0, balance: BigNumber.from(0) };
    this.token1 = { address: _token1, balance: BigNumber.from(0) };
    this.fee = _fee;
    this.feePrecision = _feePrecision;
  }

  updateReserves(token0Balance: BigNumber, token1Balance: BigNumber): void {
    this.token0.balance = token0Balance;
    this.token1.balance = token1Balance;
  }

  getBalance(tokenAddress: string): BigNumber {
    let balance;
    if (tokenAddress.toLowerCase() === this.token0.address.toLowerCase()) {
      balance = this.token0.balance;
    }
    if (tokenAddress.toLowerCase() === this.token1.address.toLowerCase()) {
      balance = this.token1.balance;
    }
    if (balance === undefined) {
      throw new Error('bad token');
    }
    return balance;
  }

  getTokensIn(tokenIn: string, tokenOut: string, amountOut: BigNumber): BigNumber {
    const reserveIn = this.getBalance(tokenIn);
    const reserveOut = this.getBalance(tokenOut);
    return this.getAmountIn(reserveIn, reserveOut, amountOut);
  }

  getTokensOut(tokenIn: string, tokenOut: string, amountIn: BigNumber): BigNumber {
    const reserveIn = this.getBalance(tokenIn);
    const reserveOut = this.getBalance(tokenOut);
    return this.getAmountOut(reserveIn, reserveOut, amountIn);
  }

  getAmountIn(reserveIn: BigNumber, reserveOut: BigNumber, amountOut: BigNumber): BigNumber {
    const numerator: BigNumber = reserveIn.mul(amountOut).mul(this.feePrecision);
    const denominator: BigNumber = reserveOut.sub(amountOut).mul(this.fee);
    return numerator.div(denominator).add(1);
  }

  getAmountOut(reserveIn: BigNumber, reserveOut: BigNumber, amountIn: BigNumber): BigNumber {
    const amountInWithFee: BigNumber = amountIn.mul(this.fee);
    const numerator = amountInWithFee.mul(reserveOut);
    const denominator = reserveIn.mul(this.feePrecision).add(amountInWithFee);
    return numerator.div(denominator);
  }
}
