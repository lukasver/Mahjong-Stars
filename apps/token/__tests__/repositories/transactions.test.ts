import { faker } from "@faker-js/faker";
import {
	Prisma,
	SaftContract,
	Sale,
	SaleTransactions,
	TransactionStatus,
	User,
} from "@prisma/client";
import nock from "nock";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { CreateTransactionDto } from "@/common/schemas/dtos/transactions";
import { decimalsToString } from "@/common/schemas/dtos/utils";
import { prisma as db } from "@/lib/db/prisma";
import TransactionsController from "@/lib/repositories/transactions";
import {
	cleanUpTestContext,
	createMockSaleWithToken,
	mockProfile,
	mockTransactions,
	mockUsers,
} from "../mocks/helpers";

const Decimal = Prisma.Decimal;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/repositories/documents/storage", () => ({
	StorageService: vi.fn().mockImplementation(() => ({
		getFileUrl: vi.fn(),
	})),
}));

vi.mock("@/lib/repositories/documents", () => ({
	default: vi.fn().mockImplementation(() => ({
		generatePDF: vi.fn(),
	})),
}));

vi.mock("@/lib/repositories/notifications", () => ({
	default: vi.fn().mockImplementation(() => ({
		send: vi.fn(),
	})),
}));

// Block all external HTTP requests except localhost
nock.disableNetConnect();
nock.enableNetConnect("127.0.0.1");

function createCtx(overrides = {}) {
	return {
		isAdmin: true,
		userId: "user-1",
		address: "0xabc",
		...overrides,
	};
}

/**
 * Vitest suite for TransactionsController
 * Mocks prisma, logger, and blocks HTTP. Uses vi for stubs.
 */
describe("TransactionsController", () => {
	let adminUser: User;
	let regularUser: User;
	let testSale: Sale;
	let txs: SaleTransactions[] = [];

	beforeEach(async () => {
		vi.restoreAllMocks();
		// Clean up database before each test
		await cleanUpTestContext(db, {
			transactions: txs,
			sales: [testSale],
			users: [adminUser, regularUser],
		});

		const mUser = mockUsers();
		// Create test data
		adminUser = await db.user.create({
			data: {
				...mUser,
				profile: {
					create: mockProfile(),
				},
				userRole: {
					create: {
						role: {
							connectOrCreate: {
								where: { name: "ADMIN" },
								create: { name: "ADMIN" },
							},
						},
					},
				},
			},
		});

		const mUserRegular = mockUsers();

		regularUser = await db.user.create({
			data: {
				...mUserRegular,
				profile: {
					create: mockProfile(),
				},
			},
		});

		const { sale } = await createMockSaleWithToken(db, {
			userAddress: adminUser.walletAddress,
			currency: "USD",
		});
		testSale = sale;
		// Create test transactions
		txs = await db.saleTransactions.createManyAndReturn({
			data: [
				{
					id: faker.string.uuid(),
					tokenSymbol: "TEST",
					quantity: 100,
					formOfPayment: "CRYPTO",
					receivingWallet: faker.finance.ethereumAddress(),
					status: TransactionStatus.PENDING,
					paidCurrency: "ETH",
					totalAmountCurrency: "ETH",
					saleId: testSale.id,
					userId: regularUser.id,
					price: 1.5,
					totalAmount: 150,
				},
				{
					id: faker.string.uuid(),
					tokenSymbol: "TEST",
					quantity: 200,
					formOfPayment: "TRANSFER",
					receivingWallet: faker.finance.ethereumAddress(),
					status: TransactionStatus.PAYMENT_VERIFIED,
					paidCurrency: "USD",
					totalAmountCurrency: "USD",
					saleId: testSale.id,
					userId: regularUser.id,
					price: 1.5,
					totalAmount: 300,
					approvedBy: adminUser.id,
				},
			],
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		nock.cleanAll();
	});

	afterAll(async () => {
		// Clean up after each test
		if (txs.length > 0) {
			await db.saleTransactions.deleteMany({
				where: {
					id: {
						in: txs.map((tx) => tx.id),
					},
				},
			});
		}
		if (testSale) {
			await db.sale.deleteMany({
				where: {
					id: testSale.id,
				},
			});
		}
		if (adminUser?.id || regularUser?.id) {
			await db.user.deleteMany({
				where: {
					id: {
						in: [adminUser.id, regularUser.id],
					},
				},
			});
		}
	});

	describe("getAllTransactions", () => {
		it("returns all transactions for admin", async () => {
			const fakeTransactions: SaleTransactions[] = [
				mockTransactions(),
				mockTransactions(),
			];
			vi.spyOn(db.saleTransactions, "findMany").mockResolvedValue(
				fakeTransactions,
			);
			const ctx = createCtx({ isAdmin: true });
			const result = await TransactionsController.getAllTransactions({}, ctx);
			if (result.success) {
				expect(result.data.transactions).toEqual(
					decimalsToString(fakeTransactions),
				);
				expect(result.data.quantity).toBe(2);
			} else {
				throw new Error("Expected success but got failure");
			}
		});

		it("returns failure if not admin", async () => {
			const ctx = createCtx({ isAdmin: false });
			const result = await TransactionsController.getAllTransactions({}, ctx);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeDefined();
			}
		});
	});

	describe("createTransaction", () => {
		it("creates a transaction successfully", async () => {
			// Use a minimal Sale shape for the test
			const sale: Partial<Sale> = {
				id: "sale-1",
				status: "OPEN",
				availableTokenQuantity: 100, // Sale expects number, not Decimal
				requiresKYC: false,
				saftCheckbox: false,
				tokenPricePerUnit: new Prisma.Decimal(1),
				currency: "USD",
			};
			const transaction: SaleTransactions = mockTransactions({
				id: "tx-1",
				quantity: new Prisma.Decimal(10),
			});
			vi.spyOn(db.sale, "findUnique").mockResolvedValue(sale as Sale);
			vi.spyOn(db.saleTransactions, "findFirst").mockResolvedValue(null);
			vi.spyOn(db, "$transaction").mockImplementation(async (input) => {
				if (Array.isArray(input)) {
					// Handle array-based syntax: prisma.$transaction([promise1, promise2, ...])
					return Promise.all(input);
				} else if (typeof input === "function") {
					// Handle function-based syntax: prisma.$transaction(async (tx) => { ... })
					return input(db);
				}
				throw new Error("Invalid $transaction input");
			});
			vi.spyOn(db.sale, "update").mockResolvedValue(sale as Sale);
			vi.spyOn(db.saleTransactions, "create").mockResolvedValue(transaction);
			vi.spyOn(db.user, "findUnique").mockResolvedValue(regularUser);

			const ctx = createCtx();
			const dto = {
				tokenSymbol: "TKN",
				quantity: new Prisma.Decimal(10),
				formOfPayment: "TRANSFER" as const,
				receivingWallet: null,
				saleId: "sale-1",
				comment: null,
				totalAmount: new Prisma.Decimal(10),
				paidCurrency: "USD",
			} satisfies CreateTransactionDto;

			const result = await TransactionsController.createTransaction(dto, ctx);

			if (result.success) {
				expect(result.data.transaction).toBeDefined();
			} else {
				throw new Error("Expected success but got failure");
			}
		});

		it("returns failure if sale not found", async () => {
			vi.spyOn(db.sale, "findUnique").mockResolvedValue(null);
			const ctx = createCtx();
			const dto = {
				tokenSymbol: "TKN",
				quantity: new Prisma.Decimal(10),
				formOfPayment: "TRANSFER" as const,
				receivingWallet: null,
				saleId: "sale-1",
				comment: null,
				amountPaid: "10",
				paidCurrency: "USD",
			};
			// @ts-expect-error - test
			const result = await TransactionsController.createTransaction(dto, ctx);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeDefined();
			}
		});
	});

	/**
	 * Test for parseTransactionVariablesToContract
	 * Ensures all variables are replaced and returned correctly.
	 */
	describe("parseTransactionVariablesToContract", () => {
		it("should populate all contract variables correctly", () => {
			// Arrange: create mocks for tx, sale, user, profile, address
			const tx = mockTransactions({
				quantity: new Prisma.Decimal(42),
				tokenSymbol: "TKN",
				paidCurrency: "USD",
				totalAmount: new Prisma.Decimal(1234.5678),
			});
			const user = mockUsers({ email: "test@example.com" });
			const profile = mockProfile();
			const address = {
				city: "TestCity",
				zipCode: "12345",
				state: "TestState",
				country: "TestCountry",
			};
			const sale = {
				tokenPricePerUnit: new Prisma.Decimal(10),
				currency: "USD",
			};
			// All variables as used in the controller
			const contractTemplate = `
        <div>
          <span>{{recipient.firstName}}</span>
          <span>{{recipient.lastName}}</span>
          <span>{{recipient.email}}</span>
          <span>{{recipient.city}}</span>
          <span>{{recipient.zipcode}}</span>
          <span>{{recipient.state}}</span>
          <span>{{recipient.country}}</span>
          <span>{{token.quantity}}</span>
          <span>{{token.symbol}}</span>
          <span>{{paid.currency}}</span>
          <span>{{paid.amount}}</span>
          <span>{{sale.currency}}</span>
          <span>{{sale.equivalentAmount}}</span>
          <span>{{date}}</span>
        </div>
      `;
			// The controller expects variables to be of type SaftContract["variables"], but does not use it. Pass as empty object with test-only workaround.
			// const variables = {} as SaftContract['variables'];
			// Act
			const { contract, variables } =
				TransactionsController.parseTransactionVariablesToContract({
					tx,
					user,
					profile,
					address,
					sale,
					contract: contractTemplate,
					inputVariables: {},
				});

			// Assert: all variables are replaced in the contract
			expect(contract).not.toContain("{{");
			expect(contract).toContain(profile.firstName);
			expect(contract).toContain(profile.lastName);
			expect(contract).toContain(user.email);
			expect(contract).toContain(address.city);
			expect(contract).toContain(address.zipCode);
			expect(contract).toContain(address.state);
			expect(contract).toContain(address.country);
			expect(contract).toContain(tx.quantity.toString());
			expect(contract).toContain(tx.tokenSymbol);
			expect(contract).toContain(tx.paidCurrency);
			expect(contract).toContain(variables.paid.amount);
			expect(contract).toContain(sale.currency);
			expect(contract).toContain(variables.sale.equivalentAmount);
			expect(contract).toContain(variables["date"]);
			// Assert: variables object contains all expected keys
			expect(variables.recipient.firstName).toBe(profile.firstName);
			expect(variables.recipient.lastName).toBe(profile.lastName);
			expect(variables.recipient.email).toBe(user.email);
			expect(variables.recipient.city).toBe(address.city);
			expect(variables.recipient.zipcode).toBe(address.zipCode);
			expect(variables.recipient.state).toBe(address.state);
			expect(variables.recipient.country).toBe(address.country);
			expect(variables.token.quantity).toBe(tx.quantity.toString());
			expect(variables.token.symbol).toBe(tx.tokenSymbol);
			expect(variables.paid.currency).toBe(tx.paidCurrency);
			expect(variables.sale.currency).toBe(sale.currency);
			expect(variables.sale.equivalentAmount).toBe(
				new Decimal(tx.quantity).mul(sale.tokenPricePerUnit).toFixed(2),
			);
			expect(variables["date"]).toMatch(/\d{4}-\d{2}-\d{2}/);
		});
	});

	describe("computeMissingVariables", () => {
		it("should return missing variables correctly", () => {
			// Only these variables are required (in the variables array)

			const toBeMissing = [
				"recipient.city",
				"recipient.zipcode",
				"missing.variable",
			];
			const requiredVariables = [
				"recipient.firstName",
				"token.quantity",
				...toBeMissing,
			];

			const availableVariables = {
				recipient: {
					firstName: "John",
					lastName: "Doe", // This is NOT in requiredVariables, so it's ignored even if null
					email: "john@example.com", // This is NOT in requiredVariables, so it's ignored even if null
					city: null, // missing - in requiredVariables
					zipcode: "", // missing - in requiredVariables
					state: "CA", // This is NOT in requiredVariables, so it's ignored
					country: "USA", // This is NOT in requiredVariables, so it's ignored
				},
				token: {
					quantity: "100", // present - in requiredVariables
					symbol: "TKN", // This is NOT in requiredVariables, so it's ignored
				},
				paid: {
					currency: "USD", // This is NOT in requiredVariables, so it's ignored
					amount: "1000.00", // This is NOT in requiredVariables, so it's ignored
				},
				sale: {
					currency: "USD", // This is NOT in requiredVariables, so it's ignored
					equivalentAmount: "1000.00", // This is NOT in requiredVariables, so it's ignored
				},
				date: "2024-01-01", // This is NOT in requiredVariables, so it's ignored
			};

			const missingVariables = TransactionsController[
				"computeMissingVariables"
			](requiredVariables, availableVariables);

			// Only variables that are in requiredVariables AND missing should be returned
			expect(missingVariables).toEqual(toBeMissing);
		});

		it("should handle empty required variables array", () => {
			const missingVariables = TransactionsController[
				"computeMissingVariables"
			]([], { some: "data" });

			expect(missingVariables).toEqual([]);
		});

		it("should handle non-array required variables", () => {
			const missingVariables = TransactionsController[
				"computeMissingVariables"
			]("not an array" as unknown as SaftContract["variables"], {
				some: "data",
			});

			expect(missingVariables).toEqual([]);
		});

		it("should handle nested object access", () => {
			const requiredVariables = ["deeply.nested.value"];
			const availableVariables = {
				deeply: {
					nested: {
						value: "exists",
					},
				},
			};

			const missingVariables = TransactionsController[
				"computeMissingVariables"
			](requiredVariables, availableVariables);

			expect(missingVariables).toEqual([]);
		});

		it("should handle missing nested paths", () => {
			const requiredVariables = ["deeply.nested.missing"];
			const availableVariables = {
				deeply: {
					nested: {
						value: "exists",
					},
				},
			};

			const missingVariables = TransactionsController[
				"computeMissingVariables"
			](requiredVariables, availableVariables);

			expect(missingVariables).toEqual(["deeply.nested.missing"]);
		});

		it("should ignore variables not in required array even if they have null values", () => {
			const requiredVariables = ["recipient.firstName", "token.quantity"];
			const availableVariables = {
				recipient: {
					firstName: "John",
					lastName: null, // This is NOT in requiredVariables, so it's ignored
					email: undefined, // This is NOT in requiredVariables, so it's ignored
				},
				token: {
					quantity: "100",
					symbol: "", // This is NOT in requiredVariables, so it's ignored
				},
				paid: {
					currency: null, // This is NOT in requiredVariables, so it's ignored
					amount: undefined, // This is NOT in requiredVariables, so it's ignored
				},
			};

			const missingVariables = TransactionsController[
				"computeMissingVariables"
			](requiredVariables, availableVariables);

			// Should return empty array since all required variables have values
			expect(missingVariables).toEqual([]);
		});
	});
});
