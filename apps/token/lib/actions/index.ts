"use server";
import "server-only";
import { invariant } from "@epic-web/invariant";
import { FOP, Prisma } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import Decimal from "decimal.js";
import { Route } from "next";
import { cookies } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { defineChain, getContract as getContractThirdweb } from "thirdweb";
import { bscTestnet } from "thirdweb/chains";
import { z } from "zod";
import {
	COOKIE_PREFIX,
	FIAT_CURRENCIES,
	JWT_EXPIRATION_TIME,
	MW_KEY,
	ONE_YEAR,
} from "@/common/config/constants";
import { env } from "@/common/config/env";
import { CreateContractStatusDto } from "@/common/schemas/dtos/contracts";
import { GetSaleDto, GetSalesDto } from "@/common/schemas/dtos/sales";
import { SignatureSchema } from "@/common/schemas/dtos/signatures";
import { UpdateTransactionDto } from "@/common/schemas/dtos/transactions";
import {
	FOPSchema,
	KycVerificationSchema,
	ProfileSchema,
	TransactionStatusSchema,
	UserSchema,
} from "@/common/schemas/generated";
import { InvestFormSchema } from "@/components/invest/schemas";
import { prisma } from "@/db";
import contractController from "@/lib/repositories/contract";
import documentsController from "@/lib/repositories/documents";
import ratesController from "@/lib/repositories/feeds/rates";
import salesController from "@/lib/repositories/sales";
import transactionsController from "@/lib/repositories/transactions";
import usersController from "@/lib/repositories/users";
import { hashJwt } from "@/lib/utils/jwt-hash";
import { authCache } from "../auth/cache";
import {
	deleteSessionCookie,
	getSessionCookie,
	setSessionCookie,
} from "../auth/cookies";
import {
	generateAuthPayload,
	generateJWT,
	serverClient,
	verifyAuthPayload,
	verifyJwt,
} from "../auth/thirdweb";
import { erc20Abi } from "../services/crypto/ABI";
import logger from "../services/logger.server";
import { authActionClient, loginActionClient } from "./config";

export const hasActiveSession = async (address: string, token: string) => {
	const sessions = await prisma.session.findMany({
		where: {
			expiresAt: {
				gt: new Date(),
			},
			token: {
				equals: hashJwt(token),
			},
			user: {
				walletAddress: address,
			},
		},
		select: {
			id: true,
			expiresAt: true,
			token: true,
		},
	});

	// If there is at least one active session
	return sessions.length > 0;
};

export const isLoggedIn = loginActionClient
	.schema(z.string())
	.action(async ({ parsedInput }) => {
		const data = await getSessionCookie();
		if (!data) return false;
		const hasSession = await hasActiveSession(parsedInput, data);
		return hasSession;
	});

const LoginParams = z.object({
	signature: SignatureSchema.shape.signature,
	payload: z.object({
		address: z.string(),
		chain_id: z.string().optional(),
		domain: z.string(),
		expiration_time: z.string(),
		invalid_before: z.string(),
		issued_at: z.string(),
		nonce: z.string(),
		statement: z.string(),
		version: z.string(),
		uri: z.string().optional(),
		resources: z.array(z.string()).optional(),
		temp: z.string().optional(),
	}),
});

export type LoginParams = z.infer<typeof LoginParams>;

export const login = loginActionClient
	.schema(LoginParams)
	.action(async ({ parsedInput }) => {
		const verifiedPayload = await verifyAuthPayload(parsedInput);
		if (!verifiedPayload.valid) {
			redirect("/?error=invalid_payload");
		}
		const { payload } = verifiedPayload;
		// Here should go the JWT logic
		const [jwt] = await Promise.all([
			generateJWT(payload, {
				address: payload.address,
				...(payload.chain_id && { chainId: payload.chain_id }),
			}),
		]);

		await setSessionCookie(jwt);
		const user = await usersController.createUser({
			address: payload.address,
			session: {
				jwt,
				expirationTime: JWT_EXPIRATION_TIME,
			},
			chainId: payload.chain_id ? Number(payload.chain_id) : undefined,
		});
		invariant(user?.success, "User could not be found/created");

		redirect(
			user.data.user.emailVerified ? "/in?to=dashboard" : "/in?to=onboarding",
			RedirectType.replace,
		);
	});

export const generatePayload = loginActionClient
	.schema(
		z.object({
			address: z.string(),
			chainId: z.coerce.number(),
		}),
	)
	.action(async ({ parsedInput: { chainId, address } }) => {
		return await generateAuthPayload({ chainId, address });
	});

export const logout = loginActionClient
	.schema(
		z.object({
			redirectTo: z.string().optional(),
			redirect: z.boolean().optional().default(true),
		}),
	)
	.action(async ({ parsedInput: { redirectTo, redirect: _redirect } }) => {
		const data = String((await getSessionCookie()) || "");
		logger("CALLED LOGOUT ACTION data", data);
		await deleteSessionCookie();
		logger("CALLED LOGOUT ACTION deleteSessionCookie");
		if (data) {
			const verified = await verifyJwt(data).catch(() => {
				return { valid: false, parsedJWT: null };
			});
			if (verified.valid && verified.parsedJWT) {
				const hashedJwt = hashJwt(data);
				waitUntil(
					Promise.allSettled([
						authCache.delete(verified.parsedJWT.sub),
						prisma.session
							.delete({
								where: {
									token: hashedJwt,
								},
							})
							.catch((e) => {
								if (e instanceof Prisma.PrismaClientKnownRequestError) {
									return;
								}
								console.error(
									"Logout error: ",
									e instanceof Error ? e.message : e,
								);
							}),
					]),
				);
			}
		}

		logger("CALLED LOGOUT ACTION _redirect: " + _redirect);

		if (_redirect) {
			redirect((redirectTo || "/") as Route);
		}
	});

// export const getCurrentUser = authActionClient.action(
//   async ({ ctx: { address } }) => {
//     // const user = await getUser({
//     //   client,
//     //   email: address,
//     //   // walletAddress: address,
//     // });

//     const user = await usersController.getMe({ address });
//     if (!user.success) {
//       throw new Error(user.message);
//     }
//     return user.data;
//   }
// );

export const getCurrentUserEmail = authActionClient.action(
	async ({ ctx: { address } }) => {
		const user = await prisma.user.findUnique({
			where: {
				walletAddress: address,
			},
			select: {
				email: true,
			},
		});
		invariant(user, "User not found");
		return user.email;
	},
);

export const getSales = authActionClient
	.schema(GetSalesDto.optional())
	.action(async ({ ctx, parsedInput }) => {
		const sales = await salesController.getSales(parsedInput, ctx);
		if (!sales.success) {
			throw new Error(sales.message);
		}
		return sales.data;
	});

export const getSale = authActionClient
	.schema(GetSaleDto)
	.action(async ({ ctx, parsedInput }) => {
		const sales = await salesController.getSale(parsedInput, ctx);
		if (!sales.success) {
			throw new Error(sales.message);
		}
		return sales.data;
	});

export const getWeb3Contract = authActionClient
	.schema(z.string())
	.action(async ({ parsedInput }) => {
		const contract = await getContractThirdweb({
			// the client you have created via `createThirdwebClient()`
			client: serverClient,
			// the chain the contract is deployed on
			chain: defineChain(bscTestnet.id),
			// the contract's address
			address: parsedInput,
			// OPTIONAL: the contract's abi
			// abi: [...],
			abi: erc20Abi,
		});
		invariant(contract, "Contract not found");

		return;
	});

export const updateUserInfo = authActionClient
	.schema(
		z.object({
			user: UserSchema.omit({ id: true }).partial(),
			profile: ProfileSchema.omit({ userId: true, id: true })
				.partial()
				.optional(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const sales = await usersController.updateUser(parsedInput, ctx);
		if (!sales.success) {
			throw new Error(sales.message);
		}
		return sales.data;
	});

export const getPendingTransactionsForSale = authActionClient
	.schema(
		z.object({
			saleId: z.string(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const sales = await transactionsController.userTransactionsForSale(
			{
				saleId: parsedInput.saleId,
				status: [
					TransactionStatusSchema.enum.PENDING,
					TransactionStatusSchema.enum.AWAITING_PAYMENT,
				],
			},
			ctx,
		);
		if (!sales.success) {
			throw new Error(sales.message);
		}
		return sales.data;
	});

export const getUserSaleTransactions = authActionClient
	.schema(
		z.object({
			saleId: z.string(),
			status: TransactionStatusSchema.array().optional(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const transactions = await transactionsController.userTransactionsForSale(
			parsedInput,
			ctx,
		);
		if (!transactions.success) {
			throw new Error(transactions.message);
		}
		return transactions.data;
	});

export const getTransactionById = authActionClient
	.schema(z.object({ id: z.string() }))
	.action(async ({ ctx, parsedInput }) => {
		const transactions = await transactionsController.getTransactionById(
			parsedInput,
			ctx,
		);
		if (!transactions.success) {
			throw new Error(transactions.message);
		}
		return transactions.data;
	});

export const getTransactionAvailabilityForSale = authActionClient
	.schema(z.object({ id: z.string() }))
	.action(async ({ ctx, parsedInput }) => {
		const transactions =
			await transactionsController.getTransactionAvailabilityForSale(
				parsedInput,
				ctx,
			);
		if (!transactions.success) {
			throw new Error(transactions.message);
		}
		return transactions.data;
	});

export const createTransaction = authActionClient
	.schema(InvestFormSchema)
	.action(async ({ ctx, parsedInput }) => {
		const transactions = await transactionsController.createTransaction(
			{
				tokenSymbol: parsedInput.tokenSymbol,
				quantity: new Prisma.Decimal(parsedInput.paid.quantity),
				formOfPayment:
					parsedInput.fop ||
					(FIAT_CURRENCIES.includes(parsedInput.paid.currency)
						? FOP.TRANSFER
						: FOP.CRYPTO),
				receivingWallet: parsedInput.receivingWallet,
				saleId: parsedInput.saleId,
				totalAmount: parsedInput.paid.amount as unknown as Decimal,
				paidCurrency: parsedInput.paid.currency,
				comment: null,
			},
			ctx,
		);
		if (!transactions.success) {
			throw new Error(transactions.message);
		}
		return transactions.data;
	});

export const confirmTransaction = authActionClient
	.schema(
		UpdateTransactionDto.extend({
			id: z.string(),
			type: z.enum(["CRYPTO", "FIAT"]),
			payload: z
				.object({
					paymentDate: z.coerce.date().optional(),
				})
				.optional(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const transaction = await transactionsController.confirmTransaction(
			parsedInput,
			ctx,
		);
		if (!transaction.success) {
			throw new Error(transaction.message);
		}
		return transaction.data;
	});

export const getExchangeRate = authActionClient
	.schema(
		z.object({
			from: z.string().min(3, "From currency must be at least 3 characters"),
			to: z.string().min(3, "To currency must be at least 3 characters"),
		}),
	)
	.action(async ({ parsedInput }) => {
		const { from, to } = parsedInput;
		const exchangeRate = await ratesController.getExchangeRate(from, to);
		if (!exchangeRate?.success) {
			throw new Error("Failed to fetch exchange rate");
		}
		return exchangeRate;
	});

export const createEmailVerification = authActionClient
	.schema(
		UserSchema.pick({
			email: true,
		}).extend({
			firstName: z
				.string()
				.max(64, "First name must be less than 64 characters")
				.optional(),
			lastName: z
				.string()
				.max(64, "Last name must be less than 64 characters")
				.optional(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const { email, ...profile } = parsedInput;

		const result = await usersController.updateUser(
			{ user: { email }, profile },
			ctx,
		);

		if (!result.success) {
			throw new Error(result.message);
		}
		return result;
	});

export const verifyEmail = authActionClient
	.schema(
		z.object({
			token: z.string(),
			subscribe: z.boolean().optional().default(false),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const result = await usersController.verifyEmail(parsedInput.token, ctx);

		if (!result.success) {
			throw new Error("Failed to verify code");
		}
		if (parsedInput.subscribe) {
			await usersController.subscribeToNewsletter(ctx);
		}
		return result;
	});

export const updateContractStatus = authActionClient
	.schema(CreateContractStatusDto)
	.action(async ({ ctx, parsedInput }) => {
		const result = await contractController.createContractStatus(
			parsedInput,
			ctx,
		);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result;
	});

export const deleteContractStatus = authActionClient
	.schema(z.object({ userId: z.string() }))
	.action(async ({ ctx, parsedInput }) => {
		const result = await contractController.deleteContractStatus(
			parsedInput,
			ctx,
		);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result;
	});

export const confirmContractSignature = authActionClient
	//recipientId
	.schema(z.object({ id: z.string() }))
	.action(async ({ ctx, parsedInput }) => {
		const result = await contractController.confirmSignature(parsedInput, ctx);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result.data;
	});

export const getContract = authActionClient.action(async ({ ctx }) => {
	const result = await contractController.getContract(null, ctx);
	if (!result.success) {
		throw new Error(result.message);
	}
	return result;
});

export const getInputOptions = authActionClient.action(async ({ ctx }) => {
	const result = await salesController.getInputOptions(ctx);
	if (!result.success) {
		throw new Error(result.message);
	}
	return result;
});

/**
 * Used to upload a file to the public bucket
 */
export const getFileUploadPublicPresignedUrl = authActionClient
	.schema(
		z.object({
			key: z.string().min(1),
		}),
	)
	.action(async ({ parsedInput }) => {
		const result = await documentsController.getPresignedUrl(
			parsedInput.key,
			"public",
			"write",
		);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result.data;
	});

/**
 * Used to upload a file to the public bucket
 */
export const getFileUploadPrivatePresignedUrl = authActionClient
	.schema(
		z.object({
			key: z.string().min(1),
		}),
	)
	.action(async ({ parsedInput }) => {
		const result = await documentsController.getPresignedUrl(
			parsedInput.key,
			"private",
			"write",
		);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result.data;
	});

export const validateMagicWord = authActionClient
	.schema(z.object({ invitationCode: z.string() }))
	.action(async ({ parsedInput }) => {
		if (env.MAGIC_WORD && parsedInput.invitationCode !== env.MAGIC_WORD) {
			throw new Error("Invalid magic word");
		}
		const c = await cookies();
		c.set(`${COOKIE_PREFIX}_${MW_KEY}`, MW_KEY, {
			httpOnly: false,
			secure: process.env.NODE_ENV === "production",
			maxAge: ONE_YEAR * 100, // Set to effectively never expire (100 years)
			path: "/",
			sameSite: "lax",
		});
		return true;
	});

/**
 * =====================================
 * =============== MUTATION ACTIONS ===============
 * =====================================
 */

export const deleteOwnTransaction = authActionClient
	.schema(z.object({ id: z.string() }))
	.action(async ({ ctx, parsedInput }) => {
		const result = await transactionsController.deleteOwnTransaction(
			parsedInput,
			ctx,
		);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result;
	});

export const generateContractForTransaction = authActionClient
	.schema(
		z.object({
			transactionId: z.string(),
			contractId: z.string(),
			variables: z
				.record(z.string(), z.string().or(z.record(z.string(), z.string())))
				.optional(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		// transactions controller should
		const result = await transactionsController.generateContractForTransaction(
			parsedInput,
			ctx,
		);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result.data;
	});

export const associateDocumentsToUser = authActionClient
	.schema(
		z.object({
			documents: z.array(
				z.object({
					id: z.string().optional(),
					key: z.string(),
				}),
			),
			type: z.enum(["KYC", "PAYMENT"]).optional().default("KYC"),
			transactionId: z.string().optional(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const result = await documentsController.associateDocumentsToUser(
			parsedInput,
			ctx,
		);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result.data;
	});

export const confirmCryptoTransaction = authActionClient
	.schema(
		z.object({
			txId: z.string(),
			receipt: z.string(),
			chainId: z.number(),
			amountPaid: z.string(),
			paymentDate: z.coerce.date(),
			extraPayload: z
				.object({
					formOfPayment: FOPSchema,
					paidCurrency: z.string(),
				})
				.partial()
				.optional(),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const result = await transactionsController.confirmTransaction(
			{
				id: parsedInput.txId,
				type: "CRYPTO",
				payload: {
					txHash: parsedInput.receipt,
					chainId: parsedInput.chainId,
					amountPaid: parsedInput.amountPaid,
					paymentDate: parsedInput.paymentDate,
					...parsedInput.extraPayload,
				},
			},
			ctx,
		);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result.data;
	});

export const removeApproverFromSaft = authActionClient
	.schema(
		z.object({
			saftId: z.string().describe("Saft contract ID"),
			signature: SignatureSchema,
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const result = await contractController.removeApproverFromSaft(
			parsedInput,
			ctx,
		);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result.data;
	});

export const updateKYCVerification = authActionClient
	.schema(
		KycVerificationSchema.pick({
			status: true,
			tier: true,
			questionnaire: true,
		}).partial(),
	)
	.action(async ({ ctx, parsedInput }) => {
		const result = await usersController.updateKycVerification(
			parsedInput,
			ctx,
		);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result.data;
	});

export const buyPrepare = authActionClient
	.schema(
		z.object({
			chainId: z.number(),
			amount: z.string(),
			originTokenAddress: z.string(),
			sender: z.string(),
			// destinationChainId, Needs to be defined in the backend with fortris
			// destinationTokenAddress, Needs to be defined in the backend with fortris
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const result = await ratesController.buyPrepare(parsedInput, ctx);
		if (!result.success) {
			throw new Error(result.message);
		}
		return result.data;
	});
