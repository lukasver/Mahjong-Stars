"use server";
import "server-only";
import { type JSONContent } from "@mjs/utils/server/tiptap";
import { Prisma, TransactionStatus, User } from "@prisma/client";
import { z } from "zod";
import { ROLES } from "@/common/config/constants";
import {
	CreateSaleDto,
	DeleteSaleDto,
	UpdateSaleDto,
	UpdateSaleStatusDto,
} from "@/common/schemas/dtos/sales";
import { BankDetailsSchema } from "@/components/admin/create-sales/utils";
import { prisma } from "@/db";
import {
	AdminActionPayloadSchema,
	verifyAdminSignature,
} from "@/lib/auth/admin-wallet-auth";
import { adminCache } from "@/lib/auth/cache";
import documentsController from "@/lib/repositories/documents";
import salesController from "@/lib/repositories/sales";
import transactionsController from "@/lib/repositories/transactions";
import { TransactionsExporter } from "../repositories/transactions/exporter";
import { authActionClient } from "./config";

export const isAdmin = adminCache.wrap(async (walletAddress: string) => {
	return await prisma.user.findUniqueOrThrow({
		where: {
			walletAddress,
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
		select: {
			id: true,
		},
	});
});

const adminMiddleware: Parameters<typeof authActionClient.use>[0] = async ({
	next,
	ctx,
}) => {
	let authed: Pick<User, "id"> | null = null;
	try {
		authed = await isAdmin(ctx.address);
	} catch (_e: unknown) {
		console.log(
			"NON ADMIN, NOT CACHEEABLE",
			_e instanceof Error ? _e.message : _e,
		);
		authed = null;
	}
	return next({
		ctx: {
			...ctx,
			isAdmin: !!authed,
			userId: authed?.id,
		},
	});
};

/**
 * Use this client for sensistive administrative actions only
 */
const adminClient = authActionClient.use(adminMiddleware);

/**
 * =====================================
 * =============== ADMIN ===============
 * =====================================
 */

// /**
//  * @warning ADMIN REQUIRED
//  */
// const createSale = adminClient
//   .schema(CreateSaleDto)
//   .action(async ({ ctx, parsedInput }) => {
//     const sales = await salesController.createSale(parsedInput, ctx);
//     if (!sales.success) {
//       throw new Error(sales.message);
//     }
//     return sales.data;
//   });

export const upsertSale = adminClient
	.schema(CreateSaleDto.extend({ id: z.string().optional() }))
	.action(async ({ ctx, parsedInput }) => {
		let sale:
			| Awaited<ReturnType<typeof salesController.updateSale>>
			| Awaited<ReturnType<typeof salesController.createSale>>
			| null = null;
		if (parsedInput.id) {
			const { id, ...rest } = parsedInput;


			sale = await salesController.updateSale(
				{
					id,
					data: {
						...rest,
						tokenPricePerUnit: new Prisma.Decimal(rest.tokenPricePerUnit),
					},
				},
				ctx,
			);
		} else {
			sale = await salesController.createSale(parsedInput, ctx);
		}
		if (!sale.success) {
			throw new Error(sale.message);
		}
		return sale.data;
	});

/**
 * @warning ADMIN REQUIRED
 */
export const updateSale = adminClient
	.schema(UpdateSaleDto)
	.action(async ({ ctx, parsedInput }) => {
		const sales = await salesController.updateSale(parsedInput, ctx);
		if (!sales.success) {
			throw new Error(sales.message);
		}
		return sales.data;
	});

export const associateBankDetailsToSale = adminClient
	.schema(
		z.object({
			banks: z.array(BankDetailsSchema),
			saleId: z.string(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const sales = await salesController.associateBankDetailsToSale(
			parsedInput,
			ctx,
		);
		if (!sales.success) {
			throw new Error(sales.message);
		}
		return sales.data;
	});

export const disassociateBankDetailsFromSale = adminClient
	.schema(
		z.object({
			saleId: z.string(),
			bankId: z.string().or(z.array(z.string())),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const sales = await salesController.disassociateBankDetailsFromSale(
			parsedInput,
			ctx,
		);
		if (!sales.success) {
			throw new Error(sales.message);
		}
		return sales.data;
	});

// /**
//  * @warning ADMIN REQUIRED
//  */
// export const updateProjectInformation = adminClient
//   .schema(
//     z.object({
//       saleId: z.string(),
//       information: z.array(
//         z.object({
//           label: z.string(),
//           type: z.string(),
//           value: z.string(),
//         })
//       ),
//     })
//   )
//   .action(async ({ ctx, parsedInput }) => {
//     const { saleId, ...rest } = parsedInput;

//     const sales = await salesController.updateSaleInformation(
//       saleId,
//       rest,
//       ctx
//     );
//     if (!sales.success) {
//       throw new Error(sales.message);
//     }
//     return sales.data;
//   });

/**
 * @warning ADMIN REQUIRED
 */
export const updateSaleStatus = adminClient
	.schema(UpdateSaleStatusDto)
	.action(async ({ ctx, parsedInput }) => {
		const sales = await salesController.updateSaleStatus(parsedInput, ctx);
		if (!sales.success) {
			throw new Error(sales.message);
		}
		return sales.data;
	});

/**
 * @warning ADMIN REQUIRED
 */
export const deleteSale = adminClient
	.schema(DeleteSaleDto)
	.action(async ({ ctx, parsedInput }) => {
		const sales = await salesController.deleteSale(parsedInput, ctx);
		if (!sales.success) {
			throw new Error(sales.message);
		}
		return sales.data;
	});

/**
 * @warning ADMIN REQUIRED
 */
export const confirmAdminTransaction = adminClient
	.schema(
		z.object({
			id: z.string(),
			requiresKYC: z.boolean(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const transaction = await transactionsController.adminUpdateTransaction(
			{ ...parsedInput, status: TransactionStatus.PAYMENT_VERIFIED },
			ctx,
		);
		if (!transaction.success) {
			throw new Error(transaction.message);
		}
		return transaction.data;
	});

/**
 * @warning ADMIN REQUIRED
 */
export const rejectAdminTransaction = adminClient
	.schema(
		z.object({
			id: z.string(),
			comment: z.string().optional(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const transaction = await transactionsController.adminUpdateTransaction(
			{
				...parsedInput,
				status: TransactionStatus.REJECTED,
				comment: parsedInput.comment,
				requiresKYC: false,
			},
			ctx,
		);
		if (!transaction.success) {
			throw new Error(transaction.message);
		}
		return transaction.data;
	});

/**
 * @warning ADMIN REQUIRED
 */
export const createSaftContract = adminClient
	.schema(
		z.object({
			content: z.union([z.string(), z.custom<JSONContent>()]),
			name: z.string(),
			description: z.string().optional(),
			saleId: z.string(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		console.log("ENTRE?", parsedInput);
		const result = await documentsController.createSaft(parsedInput, ctx);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result;
	});

/**
 * Verify admin action signature and permissions
 */
export const verifyAdminAction = adminClient
	.schema(
		z.object({
			payload: AdminActionPayloadSchema,
			signature: z.string(),
			address: z.string(),
			chainId: z.number(),
		}),
	)
	.action(async ({ parsedInput }) => {
		const result = await verifyAdminSignature(parsedInput);

		return result;
	});

/**
 * Export transactions to CSV/XLSX format
 */
export const exportTransactions = adminClient
	.schema(
		z.object({
			format: z.enum(["csv", "xlsx"]),
			saleId: z.string().optional(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const transactions = await new TransactionsExporter().export(
			parsedInput,
			ctx,
		);
		if (!transactions.success) {
			throw new Error(transactions.message);
		}
		return transactions.data;
	});
