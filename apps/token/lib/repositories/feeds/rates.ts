import "server-only";

import { invariant } from "@epic-web/invariant";
import { Currency } from "@prisma/client";
import { Cacheable } from "cacheable";
import { Bridge, getContract, readContract } from "thirdweb";
import { base, bsc } from "thirdweb/chains";
import { env } from "@/common/config/env";
import { GetExchangeRate } from "@/common/schemas/dtos/rates";
import { Failure, Success } from "@/common/schemas/dtos/utils";
import { serverClient } from "@/lib/auth/thirdweb";
import { prisma } from "@/lib/db/prisma";
import { AggregatorV3InterfaceABI } from "@/lib/services/crypto/ABI";
import logger from "@/lib/services/logger.server";
import "server-only";
import { Decimal } from "@prisma/client/runtime/library";
import { formatUnits, parseUnits } from "ethers";
import { ONE_MINUTE } from "@/common/config/constants";

const cacheTTL =
	ONE_MINUTE * (process.env.NODE_ENV === "production" ? 1 : 10 * 60);
const cache = new Cacheable({
	namespace: "feeds::rates:",
	ttl: cacheTTL,
});

const PRICE_FEED_CONTRACTS = {
	[bsc.id]: {
		tBNBUSD: "0xc5a35fc58efdc4b88ddca51acacd2e8f593504be",
		BNBUSD: "0xc5a35fc58efdc4b88ddca51acacd2e8f593504be",
		BTCUSD: "0x83968bCa5874D11e02fD80444cDDB431a1DbEc0f",
		ETHUSD: "0x7a023F0346a564F5e8942dae1342c2bB42909406",
		SUIUSD: "0x503896170e85a0e1deab984f84f1ff8e69dcdc4c",
	},
};

export class RatesController {
	private apiUrl = "";
	private apiKey = "";
	private backupServiceUrl: string = "";

	constructor(
		service = env.EXCHANGE_RATES_API_URL,
		backup = env.EXCHANGE_RATES_API_URL_BACKUP,
	) {
		const serviceUrl = new URL(service);
		invariant(serviceUrl, "EXCHANGE_RATES_API_URL is not set");
		this.apiUrl = serviceUrl.href;
		invariant(env.EXCHANGE_RATES_API_KEY, "EXCHANGE_RATES_API_KEY is not set");
		this.apiKey = env.EXCHANGE_RATES_API_KEY;
		if (backup) {
			const backupUrl = new URL(backup);
			invariant(backupUrl, "EXCHANGE_RATES_API_URL_BACKUP is not set");
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
		chainId: number,
	): string {
		const fromKey = Array.isArray(from) ? from.join(",") : from;
		const toKey = Array.isArray(to) ? to.join(",") : to;
		return `${fromKey}:${toKey}:chain:${chainId}`;
	}

	async getExchangeRate(
		from: string | string[],
		to: string | string[],
		opts?: { chainId: number },
	) {
		const cacheKey = this.getCacheKey(from, to, opts?.chainId || bsc.id);

		return cache.getOrSet(cacheKey, async () => {
			return this._getExchangeRate(from, to, opts);
		});
	}

	/**
	 * Non cached version of getExchangeRate
	 */
	async _getExchangeRate(
		from: string | string[],
		to: string | string[],
		opts?: { chainId: number },
	) {
		const chainId = opts?.chainId || bsc.id;
		let address: string | undefined =
			PRICE_FEED_CONTRACTS[chainId]?.[
				`${from}${to}` as keyof (typeof PRICE_FEED_CONTRACTS)[typeof chainId]
			];

		let inverted = false;
		if (!address) {
			address =
				PRICE_FEED_CONTRACTS[chainId]?.[
					`${to}${from}` as keyof (typeof PRICE_FEED_CONTRACTS)[typeof chainId]
				];
			if (address) {
				inverted = true;
			}
		}

		let result: GetExchangeRate | null = null;

		// If the keypair is valid for onchain quote, do it otherwise go offchain
		if (address && !Array.isArray(from) && !Array.isArray(to)) {
			const chainResult = await this.getExchangeRateFromChain(
				inverted ? to : from,
				inverted ? from : to,
				opts,
			);
			if (chainResult) {
				result = this.toGetExchangeRate(from, to, {
					...chainResult,
					inverted,
				});
			}
		} else {
			result = await this.getExchangeRateOffchain(from, to);
		}
		if (!result) {
			return Failure(new Error("Failed to fetch exchange rate"));
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
		opts?: { chainId: number },
	) {
		try {
			const chainId = opts?.chainId || bsc.id;
			const address =
				PRICE_FEED_CONTRACTS[chainId]?.[
					`${from}${to}` as keyof (typeof PRICE_FEED_CONTRACTS)[typeof chainId]
				];
			invariant(
				address,
				`Price feed contract not found for symbol ${from} ${to}`,
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
					method: "latestAnswer",
				}),
				readContract({
					contract,
					method: "decimals",
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
		from: Currency["symbol"] | Currency["symbol"][],
		to: Currency["symbol"] | Currency["symbol"][],
	) {
		const parsedFrom = Array.isArray(from) ? from.join(",") : from;
		const parsedTo = Array.isArray(to) ? to.join(",") : to;

		const url = new URL(this.apiUrl);
		url.pathname = "/data/pricemulti";
		url.searchParams.set("fsyms", parsedFrom);
		url.searchParams.set("tsyms", parsedTo);

		if (process.env.NODE_ENV === "development" && parsedTo === "tMJS") {
			// For testing ERC-20 purposes
			return GetExchangeRate.parse({
				[parsedFrom]: {
					[parsedTo]: 0.012,
				},
			});
		}

		try {
			const response = await fetch(url.href, {
				method: "GET",
				headers: {
					Authorization: this.apiKey,
				},
			});
			if (!response.ok) {
				throw new Error("Failed to fetch exchange rate");
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
		{
			feed,
			decimals,
			inverted,
		}: {
			feed: string;
			decimals: string;
			inverted: boolean;
		},
	): GetExchangeRate {
		return {
			[inverted ? to : from]: {
				[inverted ? from : to]: feed,
			},
			[inverted ? from : to]: {
				[inverted ? to : from]: new Decimal(1)
					.div(new Decimal(feed))
					.toFixed(Number(decimals || 8)),
			},
		};
	}

	async buyPrepare(params: {
		chainId: number;
		amount: string;
		originTokenAddress: string;
		sender: string;
	}) {
		try {
			const { chainId, amount, originTokenAddress, sender } = params;

			console.log("🚀 ~ rates.ts:288 ~ params:", params);

			const token = await prisma.tokensOnBlockchains.findFirst({
				where: {
					chainId: chainId,
					contractAddress: originTokenAddress,
				},
				select: {
					decimals: true,
					id: true,
				},
			});

			invariant(token, "Token not not configured in app");

			// TODO: Get receiver from Fortris
			const receiver = "0x8f75517e97e0bB99A2E2132FDe0bBaC5815Bac70";
			// TODO: Get receiver from Fortris
			const destinationTokenAddress =
				"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
			// Define from mapping w/ fortris
			const destinationChainId = base.id;
			// const destinationTokenDecimals = STABLECOIN_DECIMALS;

			const preparedQuote = await Bridge.Sell.prepare({
				originChainId: chainId,
				originTokenAddress,
				destinationChainId,
				destinationTokenAddress,
				amount: parseUnits(amount, token.decimals),
				sender,
				receiver,
				client: serverClient,
			});

			console.log("🚀 ~ rates.ts:307 ~ preparedQuote:", preparedQuote);

			return Success(preparedQuote);
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}
}

export default new RatesController();
