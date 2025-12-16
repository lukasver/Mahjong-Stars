import path from "node:path";
import { stdout } from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 *
 * Script to toggle (enable/disable) existing blockchains by chain ID
 *
 */

const args = parseArgs({
  options: {
    /**
     * Environment must be either local | test | stage | production
     */
    environment: { type: "string" as const },
    /**
     * Chain ID of the blockchain to toggle
     */
    chainId: { type: "string" as const },
    /**
     * Explicitly enable the blockchain (optional)
     */
    enable: { type: "boolean" as const },
    /**
     * Explicitly disable the blockchain (optional)
     */
    disable: { type: "boolean" as const },
  },
});

async function main() {
  stdout.write(`Environment: ${args.values.environment}\n`);

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

  // Check if both enable and disable flags are provided
  if (args.values.enable && args.values.disable) {
    stdout.write("Cannot specify both --enable and --disable flags\n");
    process.exit(1);
  }

  // Find the blockchain in the database
  const blockchain = await db.blockchain.findUnique({
    where: {
      chainId: chainId,
    },
  });

  if (!blockchain) {
    stdout.write(
      `Blockchain with chain ID ${chainId} not found in the database\n`,
    );
    stdout.write(
      `Use the addChain script to add this blockchain first\n`,
    );
    process.exit(1);
  }

  // Determine the new enabled status
  let newEnabledStatus: boolean;
  if (args.values.enable !== undefined) {
    newEnabledStatus = args.values.enable;
  } else if (args.values.disable !== undefined) {
    newEnabledStatus = false;
  } else {
    // Toggle the current status
    newEnabledStatus = !blockchain.isEnabled;
  }

  // Show what will happen
  const action = newEnabledStatus ? "enable" : "disable";
  stdout.write(
    `Current status: ${blockchain.isEnabled ? "enabled" : "disabled"}\n`,
  );
  stdout.write(`Will ${action} blockchain ${blockchain.name} (ID: ${chainId})\n`);

  if (environment === "production") {
    const answer = await rl.question(
      `Are you sure you want to ${action} this blockchain? (y/n) `,
    );
    if (answer !== "y") {
      rl.close();
      stdout.write("Aborting...\n");
      process.exit(0);
    }
  }

  // Update the blockchain
  const updated = await db.blockchain
    .update({
      where: {
        chainId: chainId,
      },
      data: {
        isEnabled: newEnabledStatus,
      },
    })
    .catch((error) => {
      stdout.write(`Failed to update blockchain: ${JSON.stringify(error)}\n`);
      throw error;
    });

  stdout.write(
    `Blockchain ${updated.name} (ID: ${chainId}) has been ${updated.isEnabled ? "enabled" : "disabled"}\n`,
  );
}

main()
  .then(() => {
    rl.close();
    stdout.write("Blockchain status updated successfully\n");
    process.exit(0);
  })
  .catch((error) => {
    rl.close();
    stdout.write(`Script error: ${JSON.stringify(error)}\n`);
    process.exit(1);
  });

