import { parseArgs } from "node:util";
import { invariant } from "@epic-web/invariant";
import { PrismaClient } from "@prisma/client";
import { ROLES } from "@/common/config/constants";
import log from "../lib/services/logger.server";
import { seedBlockchains } from "./scripts/blockchains";
import { seedCurrencies } from "./scripts/currencies";
import { seedRoles, seedUserRoles } from "./scripts/roles";
import { seedOpenSale } from "./scripts/sales";
import { seedUsers } from "./scripts/users";

const truncateTables = async (prisma: PrismaClient, _tables?: string[]) => {
	const tables = _tables || [
		"users",
		"sales",
		"tokens",
		"blockchain",
		"sales_transactions",
	];
	await Promise.all(
		tables.map((table) =>
			prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table} CASCADE;`),
		),
	);
	await prisma.$executeRawUnsafe(
		`TRUNCATE TABLE ${tables.join(", ")} CASCADE;`,
	);
};

const TEST_ADMIN_WALLET = "0x8f75517e97e0bB99A2E2132FDe0bBaC5815Bac70";

const options = {
	environment: { type: "string" as const },
};

async function main() {
	const prisma = new PrismaClient();

	const {
		values: { environment },
	} = parseArgs({ options });
	invariant(environment, "Environment is required");
	try {
		log(`Not implemented: ${environment}`);
		switch (environment) {
			case "development": {
				await truncateTables(prisma, [
					"users",
					"sales",
					"tokens",
					"blockchain",
					"sales_transactions",
				]);
				await seedCurrencies(prisma);
				await seedRoles(prisma);
				await seedUsers(
					[
						{
							walletAddress: TEST_ADMIN_WALLET,
							name: "Admin MJS",
							email: "lucas@smat.io",
						},
					],
					prisma,
				).then((r) => {
					return seedUserRoles(
						r.map((user) => ({
							id: user.id,
							role: ROLES.SUPER_ADMIN,
						})),
						prisma,
					);
				});

				// await seedTransactions(prisma);
				await seedBlockchains(prisma);
				await seedOpenSale(prisma);
				// await deleteAndRecreateOriginalSaleTransactions(prisma);
				break;
			}

			case "test":
				/** data for your test environment */
				break;

			case "stage":
				if (process.env.NODE_ENV === "production") {
					throw new Error(
						"This script is only for STAGE environments, check env vars",
					);
				}
				console.log("Seeding stage data");
				console.time("truncateTables");
				await truncateTables(prisma);
				console.timeEnd("truncateTables");
				console.time("seedCurrencies");
				await seedCurrencies(prisma);
				console.timeEnd("seedCurrencies");
				console.time("seedRoles");
				await seedRoles(prisma);
				console.timeEnd("seedRoles");
				console.time("seedUsers");
				await seedUsers(
					[
						{
							walletAddress: TEST_ADMIN_WALLET,
							name: "Admin MJS",
							email: "lucas@smat.io",
						},
					],
					prisma,
				);
				console.timeEnd("seedUsers");
				console.time("seedBlockchains");
				await seedBlockchains(prisma);
				console.timeEnd("seedBlockchains");
				break;
			case "production":
				if (process.env.NODE_ENV !== "production") {
					throw new Error(
						"This script is only for PRODUCTION environments, check env vars",
					);
				}
				console.log("Seeding production data");
				console.time("seedRoles");
				await seedRoles(prisma);
				console.timeEnd("seedRoles");
				console.time("seedCurrencies");
				await seedCurrencies(prisma);
				console.timeEnd("seedCurrencies");
				console.time("seedBlockchains");
				await seedBlockchains(prisma);
				console.timeEnd("seedBlockchains");
				break;
			default:
				break;
		}
	} catch (error) {
		console.error("Seeding error:", error);
	} finally {
		// Cierra la conexión de Prisma al finalizar
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error("Error en la función principal:", error);
	process.exit(1);
});
