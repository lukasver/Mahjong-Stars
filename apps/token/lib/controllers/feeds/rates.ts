import 'server-only';
import { Currency } from '@prisma/client';
import logger from '@/lib/services/logger.server';

import { invariant } from '@epic-web/invariant';
import { env } from '@/common/config/env';
import { getContract, readContract } from 'thirdweb';
import { serverClient } from '@/lib/auth/thirdweb';
import { bsc } from 'thirdweb/chains';
import { formatUnits } from 'ethers';
import { AggregatorV3InterfaceABI } from '@/lib/services/crypto/ABI';
import { Failure, Success } from '@/common/schemas/dtos/utils';
import { GetExchangeRate } from '@/common/schemas/dtos/rates';
import { prisma } from '@/lib/db/prisma';

import { Cacheable } from 'cacheable';
import 'server-only';
import { ONE_MINUTE } from '@/common/config/constants';

const cacheTTL =
  ONE_MINUTE * (process.env.NODE_ENV === 'production' ? 1 : 10 * 60);
const cache = new Cacheable({
  namespace: 'feeds::rates:',
  ttl: cacheTTL,
});

const PRICE_FEED_CONTRACTS = {
  [bsc.id]: {
    BNBUSD: '0xc5a35fc58efdc4b88ddca51acacd2e8f593504be',
    BTCUSD: '0x83968bCa5874D11e02fD80444cDDB431a1DbEc0f',
    ETHUSD: '0x7a023F0346a564F5e8942dae1342c2bB42909406',
    SUIUSD: '0x503896170e85a0e1deab984f84f1ff8e69dcdc4c',
  },
};

export class RatesController {
  private apiUrl = '';
  private apiKey = '';
  private backupServiceUrl: string = '';

  constructor(
    service = env.EXCHANGE_RATES_API_URL,
    backup = env.EXCHANGE_RATES_API_URL_BACKUP
  ) {
    const serviceUrl = new URL(service);
    invariant(serviceUrl, 'EXCHANGE_RATES_API_URL is not set');
    this.apiUrl = serviceUrl.href;
    invariant(env.EXCHANGE_RATES_API_KEY, 'EXCHANGE_RATES_API_KEY is not set');
    this.apiKey = env.EXCHANGE_RATES_API_KEY;
    if (backup) {
      const backupUrl = new URL(backup);
      invariant(backupUrl, 'EXCHANGE_RATES_API_URL_BACKUP is not set');
      this.backupServiceUrl = backupUrl.href;
    }
  }

  /**
   * Generate a unique cache key for a currency pair and chainId.
   * @param from - Source currency symbol(s)
   * @param to - Target currency symbol(s)
   * @param chainId - Chain ID
   * @returns Cache key string
   */
  private getCacheKey(
    from: string | string[],
    to: string | string[],
    chainId: number
  ): string {
    const fromKey = Array.isArray(from) ? from.join(',') : from;
    const toKey = Array.isArray(to) ? to.join(',') : to;
    return `${fromKey}:${toKey}:chain:${chainId}`;
  }

  async getExchangeRate(
    from: string | string[],
    to: string | string[],
    opts?: { chainId: number }
  ) {
    return cache.getOrSet(
      this.getCacheKey(from, to, opts?.chainId || bsc.id),
      async () => {
        return this._getExchangeRate(from, to, opts);
      }
    );
  }

  /**
   * Non cached version of getExchangeRate
   */
  async _getExchangeRate(
    from: string | string[],
    to: string | string[],
    opts?: { chainId: number }
  ) {
    const chainId = opts?.chainId || bsc.id;
    const address =
      PRICE_FEED_CONTRACTS[chainId]?.[
        `${from}${to}` as keyof (typeof PRICE_FEED_CONTRACTS)[typeof chainId]
      ];

    let result: GetExchangeRate | null = null;

    // If the keypair is valid for onchain quote, do it otherwise go offchain
    if (address && !Array.isArray(from) && !Array.isArray(to)) {
      const chainResult = await this.getExchangeRateFromChain(from, to, opts);
      if (chainResult) {
        result = this.toGetExchangeRate(from, to, chainResult.feed);
      }
    }
    result = await this.getExchangeRateOffchain(from, to);
    if (!result) {
      return Failure(new Error('Failed to fetch exchange rate'));
    }
    return Success(result);
  }

  async getCurrencies() {
    try {
      const data = await prisma.currency.findMany({
        select: {
          symbol: true,
          name: true,
          type: true,
        },
      });
      return Success({ currencies: data });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  /**
   * This function is used to get the exchange rate from a chain oracle that adheres to chainlinks aggregatorV3InterfaceABI.
   * It is used to get the exchange rate from the chain.
   * @param address - The address of the chain oracle.
   * @returns The exchange rate from the chain.
   */
  async getExchangeRateFromChain(
    from: string,
    to: string,
    opts?: { chainId: number }
  ) {
    try {
      const chainId = opts?.chainId || bsc.id;
      const address =
        PRICE_FEED_CONTRACTS[chainId]?.[
          `${from}${to}` as keyof (typeof PRICE_FEED_CONTRACTS)[typeof chainId]
        ];
      invariant(
        address,
        `Price feed contract not found for symbol ${from} ${to}`
      );

      const contract = getContract({
        client: serverClient,
        chain: bsc,
        address,
        abi: AggregatorV3InterfaceABI,
      });
      const [result, decimals] = await Promise.all([
        readContract({
          contract,
          method: 'latestAnswer',
        }),
        readContract({
          contract,
          method: 'decimals',
        }),
      ]);

      return {
        raw: result.toString(),
        decimals: decimals.toString(),
        feed: formatUnits(result, Number(decimals)), // human-readable string
        pair: `${from}/${to}`,
      };
    } catch (e) {
      logger(e);
      return null;
    }
  }

  async getExchangeRateOffchain(
    from: Currency['symbol'] | Currency['symbol'][],
    to: Currency['symbol'] | Currency['symbol'][]
  ) {
    const parsedFrom = Array.isArray(from) ? from.join(',') : from;
    const parsedTo = Array.isArray(to) ? to.join(',') : to;

    const url = new URL(this.apiUrl);
    url.pathname = '/data/pricemulti';
    url.searchParams.set('fsyms', parsedFrom);
    url.searchParams.set('tsyms', parsedTo);

    try {
      const response = await fetch(url.href, {
        method: 'GET',
        headers: {
          Authorization: this.apiKey,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }
      const data = await response.json();
      return GetExchangeRate.parse(data);
    } catch (e) {
      // if fetcher or parsing fails, then response is unexpected. We need to try calling the backup service.
      logger(e);
      if (this.backupServiceUrl) {
        //TODO pending implementation
      }
      return null;
    }
  }
  /**
   * Converts a chain oracle result to a GetExchangeRate-compatible object.
   * @param from - The source currency symbol.
   * @param to - The target currency symbol.
   * @param feed - The human-readable exchange rate as a string.
   * @returns An object matching the GetExchangeRate schema.
   */
  private toGetExchangeRate(
    from: string,
    to: string,
    feed: string
  ): GetExchangeRate {
    return {
      [from]: {
        [to]: Number(feed),
      },
    };
  }
}

export default new RatesController();
