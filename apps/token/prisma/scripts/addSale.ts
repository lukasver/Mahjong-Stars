import path from "node:path";
import { stdout } from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { invariant } from "@epic-web/invariant";
import { Prisma, PrismaClient, SaleStatus } from "@prisma/client";
import dotenv from "dotenv";
import { defineChain } from "thirdweb";
import { z } from "zod";

const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
} as const;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Schema for validating sale input JSON
 */
const SaleInputSchema = z.object({
  name: z.string().min(1, "Sale name required"),
  status: z
    .enum(["CREATED", "OPEN", "CLOSED", "FINISHED"])
    .default("CREATED"),
  currency: z.string().default("USD"),
  initialTokenQuantity: z.coerce
    .number()
    .int()
    .min(1, "Initial token quantity must be at least 1"),
  availableTokenQuantity: z.coerce
    .number()
    .int()
    .min(0, "Available token quantity must be at least 0"),
  minimumTokenBuyPerUser: z.coerce.number().int().min(1).default(1),
  maximumTokenBuyPerUser: z.coerce.number().int().nullable().optional(),
  saleStartDate: z.coerce.date(),
  saleClosingDate: z.coerce.date(),
  tokenName: z.string().min(1, "Token name required"),
  tokenSymbol: z
    .string()
    .max(6, "Token symbol must be at most 6 characters")
    .min(1, "Token symbol required"),
  tokenPricePerUnit: z.coerce
    .number()
    .min(0.001, "Price per unit must be at least 0.001")
    .or(z.string()),
  toWalletsAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/g, "Invalid wallet address")
    .min(1, "Wallet address required"),
  saftCheckbox: z.boolean().default(false),
  tokenContractAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/g, "Invalid token contract address")
    .nullable()
    .optional(),
  tokenContractChainId: z.coerce.number().int().nullable().optional(),
  tokenTotalSupply: z.string().nullable().optional(),
  comparisonPricePerUnit: z.coerce
    .number()
    .min(0.001)
    .or(z.string())
    .nullable()
    .optional(),
  requiresKYC: z.boolean().default(false),
  catchPhrase: z.string().max(200).nullable().optional(),
  information: z
    .array(
      z.object({
        type: z.enum(["text", "textarea", "file"]),
        label: z.string(),
        value: z.string(),
        props: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .nullable()
    .optional(),
});

type SaleInput = z.infer<typeof SaleInputSchema>;

/**
 * Script to add a new sale to the database
 *
 * Usage:
 *   npx tsx prisma/scripts/addSale.ts --environment=<local|test|stage|production> --sale='<JSON string>'
 *
 * Example:
 *   npx tsx prisma/scripts/addSale.ts --environment=local --sale='{"name":"Pre-Seed Round","status":"CREATED",...}'
 */

const args = parseArgs({
  options: {
    /**
     * Environment must be either local | test | stage | production
     */
    environment: { type: "string" as const },
    /**
     * Sale JSON string containing the sale data
     */
    sale: { type: "string" as const },
    /**
     * Optional: Path to a JSON file containing the sale data
     */
    file: { type: "string" as const },
  },
});

/**
 * Loads environment variables based on the environment
 * @param environment - The environment to load variables for
 */
function loadEnvironment(environment: string): void {
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
}

/**
 * Parses the sale input from either a JSON string or file
 * @returns The parsed sale input
 */
async function parseSaleInput(): Promise<SaleInput> {
  let saleData: unknown;

  if (args.values.file) {
    const fs = await import("node:fs/promises");
    const filePath = path.resolve(args.values.file);
    stdout.write(`Reading sale data from file: ${filePath}\n`);
    const fileContent = await fs.readFile(filePath, "utf-8");
    saleData = JSON.parse(fileContent);
  } else if (args.values.sale) {
    saleData = JSON.parse(args.values.sale);
  } else {
    stdout.write(
      "Either --sale or --file argument is required\n",
    );
    process.exit(1);
  }

  const result = SaleInputSchema.safeParse(saleData);
  if (!result.success) {
    stdout.write(`Invalid sale data:\n${JSON.stringify(result.error.format(), null, 2)}\n`);
    process.exit(1);
  }

  return result.data;
}

/**
 * Gets or creates a token for the sale
 * @param prisma - The Prisma client
 * @param tokenSymbol - The token symbol
 * @returns The token ID
 */
async function getOrCreateToken(
  prisma: PrismaClient,
  tokenSymbol: string,
): Promise<string> {
  const existingToken = await prisma.token.findFirst({
    where: { symbol: tokenSymbol },
  });

  if (existingToken) {
    stdout.write(`Using existing token: ${tokenSymbol} (ID: ${existingToken.id})\n`);
    return existingToken.id;
  }

  const newToken = await prisma.token.create({
    data: { symbol: tokenSymbol },
  });

  stdout.write(`Created new token: ${tokenSymbol} (ID: ${newToken.id})\n`);
  return newToken.id;
}

/**
 * Gets an admin user to associate with the sale
 * @param prisma - The Prisma client
 * @returns The admin user
 */
async function getAdminUser(prisma: PrismaClient) {
  const user = await prisma.user.findFirst({
    where: {
      userRole: {
        some: {
          role: {
            name: {
              in: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
            },
          },
        },
      },
    },
  });

  invariant(user, "No admin user found. Please ensure an admin user exists in the database.");
  return user;
}

/**
 * Creates the sale in the database
 * @param prisma - The Prisma client
 * @param saleInput - The validated sale input
 * @param tokenId - The token ID
 * @param userId - The user ID
 */
async function createSale(
  prisma: PrismaClient,
  saleInput: SaleInput,
  tokenId: string,
  userId: string,
) {
  const saleData: Prisma.SaleCreateInput = {
    name: saleInput.name,
    catchPhrase: saleInput.catchPhrase,
    status: saleInput.status as SaleStatus,
    initialTokenQuantity: saleInput.initialTokenQuantity,
    availableTokenQuantity: saleInput.availableTokenQuantity,
    minimumTokenBuyPerUser: saleInput.minimumTokenBuyPerUser,
    maximumTokenBuyPerUser: saleInput.maximumTokenBuyPerUser ?? null,
    saleStartDate: saleInput.saleStartDate,
    saleClosingDate: saleInput.saleClosingDate,
    tokenName: saleInput.tokenName,
    tokenPricePerUnit: new Prisma.Decimal(String(saleInput.tokenPricePerUnit)),
    comparisonPricePerUnit: saleInput.comparisonPricePerUnit
      ? new Prisma.Decimal(String(saleInput.comparisonPricePerUnit))
      : null,
    toWalletsAddress: saleInput.toWalletsAddress,
    saftCheckbox: saleInput.saftCheckbox,
    requiresKYC: saleInput.requiresKYC,
    tokenContractAddress: saleInput.tokenContractAddress ?? null,
    tokenTotalSupply: saleInput.tokenTotalSupply ?? null,
    information: saleInput.information as unknown as Prisma.InputJsonValue ?? null,
    token: {
      connect: {
        id_symbol: {
          id: tokenId,
          symbol: saleInput.tokenSymbol,
        },
      },
    },
    saleCurrency: {
      connect: {
        symbol: saleInput.currency,
      },
    },
    user: {
      connect: {
        id: userId,
      },
    },
  };

  // Connect blockchain if chainId is provided
  if (saleInput.tokenContractChainId) {
    saleData.blockchain = {
      connect: {
        chainId: defineChain(saleInput.tokenContractChainId).id,
      },
    };
  }

  const sale = await prisma.sale.create({
    data: saleData,
  });

  return sale;
}

async function main() {
  stdout.write(`Environment: ${args.values.environment}\n`);

  if (!args.values.environment) {
    stdout.write("Environment is required (--environment=local|test|stage|production)\n");
    process.exit(1);
  }

  if (args.values.environment === "production") {
    const answer = await rl.question(
      "Are you sure you want to add a sale to PRODUCTION? (y/n) ",
    );
    if (answer.toLowerCase() !== "y") {
      rl.close();
      stdout.write("Aborting...\n");
      process.exit(0);
    }
  }

  loadEnvironment(args.values.environment);

  const saleInput = await parseSaleInput();
  stdout.write(`\nSale data to be created:\n`);
  stdout.write(`  Name: ${saleInput.name}\n`);
  stdout.write(`  Token: ${saleInput.tokenSymbol} (${saleInput.tokenName})\n`);
  stdout.write(`  Price: ${saleInput.tokenPricePerUnit} ${saleInput.currency}\n`);
  stdout.write(`  Quantity: ${saleInput.initialTokenQuantity}\n`);
  stdout.write(`  Start: ${saleInput.saleStartDate.toISOString()}\n`);
  stdout.write(`  End: ${saleInput.saleClosingDate.toISOString()}\n`);
  stdout.write(`  Status: ${saleInput.status}\n`);
  stdout.write(`  Requires KYC: ${saleInput.requiresKYC}\n\n`);

  const confirm = await rl.question("Proceed with creating this sale? (y/n) ");
  if (confirm.toLowerCase() !== "y") {
    rl.close();
    stdout.write("Aborting...\n");
    process.exit(0);
  }

  const db = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

  try {
    const tokenId = await getOrCreateToken(db, saleInput.tokenSymbol);
    const adminUser = await getAdminUser(db);

    stdout.write(`Using admin user: ${adminUser.walletAddress} (ID: ${adminUser.id})\n`);

    const sale = await createSale(db, saleInput, tokenId, adminUser.id);

    stdout.write(`\n✓ Sale created successfully!\n`);
    stdout.write(`  ID: ${sale.id}\n`);
    stdout.write(`  Name: ${sale.name}\n`);
    stdout.write(`  Status: ${sale.status}\n`);
  } catch (error) {
    stdout.write(`\n✗ Failed to create sale: ${error instanceof Error ? error.message : JSON.stringify(error)}\n`);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main()
  .then(() => {
    rl.close();
    stdout.write("\nScript completed successfully.\n");
    process.exit(0);
  })
  .catch((error) => {
    rl.close();
    stdout.write(`Script error: ${JSON.stringify(error)}\n`);
    process.exit(1);
  });

