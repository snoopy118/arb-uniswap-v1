import 'dotenv/config';
import _ from 'lodash';

import milko from './configs/milko';
import polygon from './configs/polygon';
import fantom from './configs/fantom';

import { BigNumber, Contract, providers } from 'ethers';
import { UNISWAP_QUERY_ABI } from './abi';
import { CrossedPairDetails, Factory } from './types';
import { UniswapV2Pair } from './UniswapV2Pair';
import { formatBigNumber } from './utils/numbers';

const getConfig = () => {
  switch (process.env.CHAIN) {
    case 'polygon':
      return polygon;
    case 'fantom':
      return fantom;
    case 'milko':
      return milko;
    default:
      throw Error('Invalid Chain');
  }
};

const Config = getConfig();

const provider = new providers.StaticJsonRpcProvider(Config.rpcUrl);

const updateReservesAll = async (
  provider: providers.JsonRpcProvider,
  allPairs: Array<UniswapV2Pair>,
): Promise<void> => {
  const uniswapQuery = new Contract(
    Config.contracts.uniswapLookup,
    UNISWAP_QUERY_ABI,
    provider,
  );
  const pairAddresses = allPairs.map((pair) => pair.address);
  const reserves: Array<Array<BigNumber>> = (
    await uniswapQuery.functions.getReservesByPairs(pairAddresses)
  )[0];
  for (let i = 0; i < allPairs.length; i++) {
    allPairs[i].updateReserves(reserves[i][0], reserves[i][1]);
  }
};

const getUniswapPoolsByFactory = async (
  provider: providers.JsonRpcProvider,
  factory: Factory,
  baseToken: string,
): Promise<Array<UniswapV2Pair>> => {
  const uniswapQuery = new Contract(
    Config.contracts.uniswapLookup,
    UNISWAP_QUERY_ABI,
    provider,
  );
  const marketPairs = new Array<UniswapV2Pair>();
  for (let i = 0; i < Config.batchCountLimit * Config.batchSize; i += Config.batchSize) {
    const allPairsData: Array<Array<string>> = (
      await uniswapQuery.functions.getPairsByIndexRange(
        factory.address,
        i,
        i + Config.batchSize,
      )
    )[0];
    for (let i = 0; i < allPairsData.length; i++) {
      const pairData = allPairsData[i];
      const pairAddress = pairData[2];
      let token: string;

      if (pairData[0].toLowerCase() === baseToken.toLowerCase()) {
        token = pairData[1];
      } else if (pairData[1].toLowerCase() === baseToken.toLowerCase()) {
        token = pairData[0];
      } else {
        continue;
      }
      if (!Config.blacklistTokens.includes(token)) {
        marketPairs.push(
          new UniswapV2Pair(
            factory.name,
            pairAddress,
            pairData[0],
            pairData[1],
            factory.fee,
            factory.feePrecision,
          ),
        );
      }
    }
    if (allPairsData.length < Config.batchSize) {
      break;
    }
  }

  return marketPairs;
};

const getBestCrossedPair = (
  crossedPairs: Array<UniswapV2Pair>[],
  token: string,
  baseToken: string,
): CrossedPairDetails | undefined => {
  let bestCrossedPair: CrossedPairDetails | undefined = undefined;
  for (const crossedPair of crossedPairs) {
    const sellTo = crossedPair[0];
    const buyFrom = crossedPair[1];
    for (const size of Config.testVolumes) {
      const tokensOutFromBuyingSize = buyFrom.getTokensOut(baseToken, token, size);
      const proceedsFromSellingTokens = sellTo.getTokensOut(
        token,
        baseToken,
        tokensOutFromBuyingSize,
      );
      const profit = proceedsFromSellingTokens.sub(size);

      if (bestCrossedPair !== undefined && profit.lt(bestCrossedPair.profit)) {
        // If the next size up lost value, meet halfway. TODO: replace with real binary search
        const trySize = size.add(bestCrossedPair.volume).div(2);
        const tryTokensOutFromBuyingSize = buyFrom.getTokensOut(baseToken, token, trySize);
        const tryProceedsFromSellingTokens = sellTo.getTokensOut(
          token,
          baseToken,
          tryTokensOutFromBuyingSize,
        );
        const tryProfit = tryProceedsFromSellingTokens.sub(trySize);
        if (tryProfit.gt(bestCrossedPair.profit)) {
          bestCrossedPair = {
            volume: trySize,
            profit: tryProfit,
            tokenAddress: token,
            sellTo: sellTo,
            buyFrom: buyFrom,
          };
        }
        break;
      }
      bestCrossedPair = {
        volume: size,
        profit: profit,
        tokenAddress: token,
        sellTo: sellTo,
        buyFrom: buyFrom,
      };
    }
  }
  return bestCrossedPair;
};

const getUniswapPoolsFromFactories = async (
  provider: providers.JsonRpcProvider,
  factories: Factory[],
  baseToken: string,
) => {
  const allPairsByFactory = await Promise.all(
    _.map(factories, (f) => getUniswapPoolsByFactory(provider, f, baseToken)),
  );

  const marketsByTokenAll = _.chain(allPairsByFactory)
    .flatten()
    .groupBy((pair) =>
      pair.token0.address.toLowerCase() === baseToken.toLowerCase()
        ? pair.token1.address
        : pair.token0.address,
    )
    .value();

  const allMarketPairs = _.chain(marketsByTokenAll).values().flatten().value();
  await updateReservesAll(provider, allMarketPairs);

  const marketsByToken = _.chain(allMarketPairs)
    .filter((pair) => pair.getBalance(baseToken).gt(Config.minReserveLiquidity))
    .groupBy((pair) =>
      pair.token0.address.toLowerCase() === baseToken.toLowerCase()
        ? pair.token1.address
        : pair.token0.address,
    )
    .value();

  return {
    marketsByToken,
    allMarketPairs,
  };
};

const evaluateMarkets = async (
  marketsByToken: {
    [tokenAddress: string]: Array<UniswapV2Pair>;
  },
  baseToken: string,
): Promise<Array<CrossedPairDetails>> => {
  const bestCrossedPairs = new Array<CrossedPairDetails>();
  for (const token in marketsByToken) {
    const pairs = marketsByToken[token];
    const pricedPairs = _.map(pairs, (pair: UniswapV2Pair) => {
      return {
        pair,
        buyTokenPrice: pair.getTokensIn(token, baseToken, Config.minReserveLiquidity.div(100)),
        sellTokenPrice: pair.getTokensOut(
          baseToken,
          token,
          Config.minReserveLiquidity.div(100),
        ),
      };
    });

    const crossedPairs = new Array<Array<UniswapV2Pair>>();
    for (const p of pricedPairs) {
      _.forEach(pricedPairs, (pm) => {
        if (pm.sellTokenPrice.gt(p.buyTokenPrice)) {
          crossedPairs.push([p.pair, pm.pair]);
        }
      });
    }

    const bestPair = getBestCrossedPair(crossedPairs, token, baseToken);
    if (bestPair !== undefined && bestPair.profit.gte(Config.minProfit)) {
      bestCrossedPairs.push(bestPair);
      console.log(`${Config.minProfit} == ${bestPair.profit} -- ${bestPair.volume}`);
    }
  }
  bestCrossedPairs.sort((a, b) => (a.profit.lt(b.profit) ? 1 : a.profit.gt(b.profit) ? -1 : 0));
  return bestCrossedPairs;
};

const printCrossedMarket = (crossedPair: CrossedPairDetails): void => {
  const buyFromPair = crossedPair.buyFrom;
  const sellToPair = crossedPair.sellTo;
  console.log(
    `Profit: ${formatBigNumber(crossedPair.profit, 18, { significantDigits: 18 })}
     Volume: ${formatBigNumber(crossedPair.volume, 18, { significantDigits: 18 })}\n` +
      `${buyFromPair.protocol} (${buyFromPair.address})\n` +
      `  ${buyFromPair.token0.address} => ${buyFromPair.token1.address}\n` +
      `${sellToPair.protocol} (${sellToPair.address})\n` +
      `  ${sellToPair.token0.address} => ${sellToPair.token1.address}\n` +
      `\n`,
  );
};

const scan = async (provider: providers.JsonRpcProvider, data: any, baseToken: string) => {
  try {
    await updateReservesAll(provider, data.allMarketPairs);
    const bestCrossedMarkets = await evaluateMarkets(data.marketsByToken, baseToken);
    bestCrossedMarkets.forEach(printCrossedMarket);
    console.log(`\r\n=====================`);
    console.log(`Update for blockNumber: ${provider.blockNumber}`);
    console.log(`Profitable pairs found: ${bestCrossedMarkets.length}`);
  } catch {}
  await scan(provider, data, baseToken);
};

async function main() {
  const baseToken = Config.baseToken;
  console.log(`Running on chain: ${process.env.CHAIN}`);
  const data = await getUniswapPoolsFromFactories(provider, Config.factories, baseToken);
  console.log(`Processing ${data.allMarketPairs.length} pairs`);
  await scan(provider, data, baseToken);
}

main();
