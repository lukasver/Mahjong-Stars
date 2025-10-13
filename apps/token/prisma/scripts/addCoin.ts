import path from "node:path";
import { stdout } from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { CurrencyTypeSchema } from "@/common/schemas/generated";
import { NETWORK_TO_TOKEN_MAPPING } from "@/lib/services/crypto/config";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

/**
 *
 * Script to run to add a new coin to the database
 *
 */

const args = parseArgs({
	options: {
		/**
		 * Environment must be either local | test | stage | production
		 */
		environment: { type: "string" as const },
		/**
		 * Symbol must be configured in the NETWORK_TO_TOKEN_MAPPING and CRYPTO_CURRENCIES constants first
		 */
		symbol: { type: "string" as const },
		/**
		 * Chain IDs to add the coin to
		 */
		chain: { type: "string" as const, multiple: true },
	},
});

async function main() {
	stdout.write(`Environment: ${args.values.environment}\n`);
	if (args.values.environment === "production") {
		const answer = await rl.question(
			"Are you sure you want to add this coin to the database? (y/n)",
		);
		if (answer !== "y") {
			stdout.write("Aborting...\n");
			process.exit(0);
		}
	}

	const environment = args.values.environment;

	const pathname = path.join(
		path.dirname(fileURLToPath(import.meta.url)),
		`..`,
		`..`,
		environment === "local" ? ".env.local" : `.env.${environment}.local`,
	);

	stdout.write(`Loading environment from ${pathname}\n`);

	dotenv.config({
		path: pathname,
	});

	if (!process.env.DATABASE_URL) {
		stdout.write("DATABASE_URL is not set\n");
		process.exit(1);
	}

	const db = new PrismaClient({
		datasourceUrl: process.env.DATABASE_URL,
	});

	if (!db) {
		stdout.write("Database connection failed\n");
		process.exit(1);
	}

	const argSymbol = args.values.symbol;
	if (!argSymbol) {
		stdout.write("Symbol is required\n");
		process.exit(1);
	}

	const argChains = args.values.chain;

	let image = "";
	let name = "";

	await db.$transaction(async (tx) => {
		for (const [chainId, tokens] of Object.entries(NETWORK_TO_TOKEN_MAPPING)) {
			// If chains are passed, skip the ones that are not passed
			if (argChains && argChains.length > 0 && !argChains.includes(chainId)) {
				continue;
			}

			for (const [symbol, token] of Object.entries(tokens)) {
				// Skip those tokens that are not the one we are adding
				if (symbol !== argSymbol) {
					continue;
				}
				stdout.write(
					`Adding coin ${symbol} to the database on chain ${chainId}\n`,
				);
				// Extract this information to create the currency record, these are the same for all chains
				name = token.name;
				image = token.image;

				// Create each token under its corresponding chain
				stdout.write(`Token data: ${JSON.stringify(token)}\n`);

				// First, create or get the token
				const createdToken = await tx.token.create({
					data: {
						symbol: symbol,
						...(token.image ? { image: token.image } : {}),
						image: token.image,
					},
				});

				// Then create the TokensOnBlockchains record
				await tx.tokensOnBlockchains
					.upsert({
						where: {
							tokenSymbol_chainId: {
								tokenSymbol: symbol,
								chainId: Number(chainId),
							},
						},
						create: {
							token: {
								connect: {
									id: createdToken.id,
									symbol: createdToken.symbol,
								},
							},
							blockchain: {
								connect: {
									chainId: Number(chainId),
								},
							},
							name: name || token.symbol,
							decimals: token.decimals,
							contractAddress: token.contract || null,
							isNative: token.isNative,
						},
						update: {},
					})
					.catch((error) => {
						throw error;
					});
			}
		}

		stdout.write(`Creating currency record for ${argSymbol}\n`);
		return tx.currency
			.upsert({
				where: {
					symbol: argSymbol,
				},
				create: {
					symbol: argSymbol,
					name: name || argSymbol,
					type: CurrencyTypeSchema.enum.CRYPTO,
					image: image,
				},
				update: {},
			})
			.catch((error) => {
				throw error;
			});
	});
}

main()
	.then(() => {
		stdout.write("Coin added to the database\n");
		process.exit(0);
	})
	.catch((error) => {
		stdout.write(`Script error: ${JSON.stringify(error)}\n`);
		process.exit(1);
	});
