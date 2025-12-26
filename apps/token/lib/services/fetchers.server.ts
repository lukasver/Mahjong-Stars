import "server-only";
import { SaleStatus, TransactionStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { cache } from "react";
import { decimalsToString } from "@/common/schemas/dtos/utils";
import { getUsers, isAdmin } from "../actions/admin";
import { getUserFromCache } from "../auth/cache";
import { getSessionCookie } from "../auth/cookies";
import {
	extractEmailVerification,
	getUserFromAddress,
	verifyJwt,
} from "../auth/thirdweb";
import { prisma } from "../db/prisma";
import blockchains from "../repositories/chains";
import sales from "../repositories/sales";
import transactions from "../repositories/transactions";
import users from "../repositories/users";

export const getUserFromSession = cache(async (shouldRedirect = true) => {
	const verified = await getSessionCookie()
		.then((d) => verifyJwt(d || ""))
		.catch(() => null);

	if (!verified || !verified.valid) {
		if (shouldRedirect) {
			redirect("/in?error=invalid_session");
		}
		throw new Error("Invalid session");
	}
	return getUserFromCache(verified.parsedJWT.sub);
});

export const getCurrentUser = cache(async (redirect = true) => {
	const user = await getUserFromSession(redirect).catch(() => null);
	if (!user) {
		return { data: null, error: "User not found" };
	}
	const result = await users.getMe({
		address: user.walletAddress,
	});
	if (result.success) {
		return { data: result.data, error: null };
	} else {
		return { data: null, error: result };
	}
});

export const getUserTransactions = cache(async () => {
	const user = await getUserFromSession();
	const result = await transactions.getUserTransactions(
		{},
		{
			userId: user.id,
			address: user.walletAddress,
		},
	);
	if (result.success) {
		return { data: result.data, error: null };
	} else {
		return { data: null, error: result };
	}
});

export const getAllTransactions = cache(
	async ({ saleId, userId }: { saleId?: string; userId?: string }) => {
		const user = await getUserFromSession();
		const isAdminUser = await isAdmin(user.walletAddress);
		const result = await transactions.getAllTransactions(
			{ saleId, userId },
			{
				address: user.walletAddress,
				userId: user.id,
				isAdmin: !!isAdminUser,
			},
		);

		if (result.success) {
			return { data: result.data, error: null };
		} else {
			return { data: null, error: result };
		}
	},
);

export const getAllUsers = cache(
	async (params: {
		page?: number;
		limit?: number;
		search?: string;
		kycStatus?: string;
	}) => {
		const user = await getUserFromSession();
		const isAdminUser = await isAdmin(user.walletAddress);

		if (!isAdminUser) {
			return { data: null, error: "Forbidden" };
		}

		const result = await getUsers({
			page: params.page || 1,
			limit: params.limit || 20,
			search: params.search,
			kycStatus: params.kycStatus as
				| "NOT_STARTED"
				| "SUBMITTED"
				| "VERIFIED"
				| "REJECTED"
				| undefined,
		});

		if (result?.data) {
			return { data: result.data, error: null };
		} else {
			return {
				data: null,
				error: result?.serverError || "Failed to fetch users",
			};
		}
	},
);

export const getActiveSale = cache(async () => {
	const user = await getUserFromSession();
	const result = await sales.getSales(
		{ active: true },
		{
			address: user.walletAddress,
			userId: user.id,
		},
	);
	if (result.success) {
		return { data: result.data, error: null };
	} else {
		return { data: null, error: result };
	}
});

export const getRecentTransactions = cache(async () => {
	try {
		const transactions = await prisma.saleTransactions.findMany({
			where: {
				status: {
					notIn: [
						TransactionStatus.REJECTED,
						TransactionStatus.CANCELLED,
						TransactionStatus.REFUNDED,
					],
				},
			},
			select: {
				id: true,
				quantity: true,
				totalAmount: true,
				amountPaidCurrency: true,
				user: {
					select: {
						walletAddress: true,
					},
				},
				createdAt: true,
				sale: {
					select: {
						tokenSymbol: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 10, // Limit to 10 most recent transactions
		});
		return {
			data: { transactions: decimalsToString(transactions) },
			error: null,
		};
	} catch (error) {
		return { data: null, error: error };
	}
});

export const getIcoPhases = cache(async () => {
	try {
		const sales = await prisma.sale.findMany({
			where: {
				status: {
					in: [SaleStatus.OPEN, SaleStatus.CREATED, SaleStatus.FINISHED],
				},
			},
			select: {
				id: true,
				name: true,
				status: true,
				saleStartDate: true,
				saleClosingDate: true,
				tokenPricePerUnit: true,
				initialTokenQuantity: true,
				availableTokenQuantity: true,
				tokenSymbol: true,
			},
			orderBy: {
				saleStartDate: "asc",
			},
		});
		return { data: { sales: decimalsToString(sales) }, error: null };
	} catch (error) {
		return { data: null, error: error };
	}
});

export const getBlockchains = cache(async () => {
	const result = await blockchains.getAll();
	if (result.success) {
		return { data: result.data, error: null };
	} else {
		return { data: null, error: result };
	}
});

export const checkUserAndVerifyEmail = async (address: string) => {
	const twUser = await getUserFromAddress(address);
	if (!twUser) {
		return;
	}
	const verif = extractEmailVerification(twUser.profiles);
	let email: string | undefined;
	let emailVerified = false;
	let firstName = "Anonymous";
	let lastName = "";
	let image: string | undefined;
	if (verif) {
		email = verif.email || email;
		emailVerified = verif.emailVerified;
		firstName = verif.firstName || firstName;
		lastName = verif.lastName || "";
		image = verif.image || undefined;
		const res = await users.updateUser(
			{
				user: {
					...(email && { email }),
					...(emailVerified && { emailVerified }),
					...(firstName && {
						name: lastName ? `${firstName} ${lastName}` : firstName,
					}),
					...(image && { image }),
					emailVerified: !!verif?.emailVerified,
				},
			},
			{
				address,
			},
		);
		if (res.success && res.data?.user && "email" in res.data.user) {
			return res.data?.user?.email || null;
		}
	}
	return email || null;
};


export const getTransactionStatus = cache(async (id: string) => {
	const user = await getUserFromSession();
	const result = await transactions.getTransactionStatus({ id }, {
		address: user.walletAddress,
		userId: user.id,
	});
	if (result.success) {
		return { data: result.data, error: null };
	} else {
		return { data: null, error: result };
	}
});
