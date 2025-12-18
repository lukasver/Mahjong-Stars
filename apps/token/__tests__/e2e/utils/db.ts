import { statSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { invariant } from "@epic-web/invariant";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const envPath = path.join(process.cwd(), ".env.test.local");

// Check if the env file exists
statSync(envPath, {
  throwIfNoEntry: true,
});

loadEnvFile(path.join(process.cwd(), ".env.test.local"));

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const datasourceUrl = process.env.DATABASE_URL;
const environment = process.env.NODE_ENV;
invariant(datasourceUrl, "DATABASE_URL is not set");
invariant(environment === "test", "NODE_ENV is not test");

/**
 * Test environment Prisma client
 */
const testDb =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl,
  }).$extends(withAccelerate());

// Use singleton pattern to avoid multiple instances of the Prisma client
globalForPrisma.prisma = testDb;

export { testDb };
