import path from "node:path";
import { stdout } from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { invariant } from "@epic-web/invariant";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import type { Chain } from "thirdweb/chains";
import * as c from "thirdweb/chains";

const chains = Object.values(c).filter((chain) => !!chain && "id" in chain);
const chainMap = new Map(chains.map((chain) => [chain.id, chain]));

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

/**
 *
 * Script to run to add a new blockchain to the database
 *
 */

const args = parseArgs({
	options: {
		/**
		 * Environment must be either local | test | stage | production
		 */
		environment: { type: "string" as const },
		/**
		 * Chain ID must be a valid chain ID supported by thirdweb/chains
		 */
		chainId: { type: "string" as const },
	},
});

async function main() {
	stdout.write(`Environment: ${args.values.environment}\n`);
	if (args.values.environment === "production") {
		const answer = await rl.question(
			"Are you sure you want to add this blockchain to the database? (y/n)",
		);
		if (answer !== "y") {
			rl.close();
			stdout.write("Aborting...\n");
			process.exit(0);
		}
	}

	const environment = args.values.environment;

	const pathname = path.join(
		path.dirname(fileURLToPath(import.meta.url)),
		`..`,
		`..`,
		environment === "local" ? ".env.local" : `./envs/.env.${environment}.local`,
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

	const argChainId = args.values.chainId;
	if (!argChainId) {
		stdout.write("Chain ID is required\n");
		process.exit(1);
	}

	const chainId = Number(argChainId);
	if (Number.isNaN(chainId)) {
		stdout.write("Chain ID must be a valid number\n");
		process.exit(1);
	}

	// Try to get chain information from thirdweb/chains
	let chain: Chain;
	try {
		chain = chainMap.get(chainId)!;

		invariant(chain, `Chain with ID ${chainId} not found in thirdweb/chains`);
	} catch (error) {
		stdout.write(
			`Failed to find chain with ID ${chainId} in thirdweb/chains: ${JSON.stringify(error)}\n`,
		);
		process.exit(1);
	}

	// Validate that we have the required chain information
	if (!chain.name || !chain.rpc) {
		stdout.write(
			`Chain with ID ${chainId} is missing required information (name or rpc)\n`,
		);
		process.exit(1);
	}

	stdout.write(
		`Adding blockchain ${chain.name} (ID: ${chainId}) to the database\n`,
	);
	stdout.write(
		`Chain data: ${JSON.stringify({ name: chain.name, rpc: chain.rpc, explorerUrl: chain.blockExplorers?.[0]?.url, testnet: chain.testnet })}\n`,
	);

	await db.blockchain
		.upsert({
			where: {
				chainId: chainId,
			},
			create: {
				name: chain.name || "",
				chainId: chainId,
				rpcUrl: chain.rpc,
				explorerUrl: chain.blockExplorers?.[0]?.url || null,
				isTestnet:
					chain.testnet ||
					chain.name?.toLowerCase()?.includes("testnet") ||
					false,
				isEnabled: true,
			},
			update: {
				name: chain.name || "",
				rpcUrl: chain.rpc,
				explorerUrl: chain.blockExplorers?.[0]?.url || null,
				isTestnet:
					chain.testnet ||
					chain.name?.toLowerCase()?.includes("testnet") ||
					false,
			},
		})
		.catch((error) => {
			stdout.write(`Failed to upsert blockchain: ${JSON.stringify(error)}\n`);
			throw error;
		});

	stdout.write(
		`Blockchain ${chain.name} (ID: ${chainId}) added/updated in the database\n`,
	);
}

main()
	.then(() => {
		rl.close();
		stdout.write("Blockchain added to the database\n");
		process.exit(0);
	})
	.catch((error) => {
		rl.close();
		stdout.write(`Script error: ${JSON.stringify(error)}\n`);
		process.exit(1);
	});
