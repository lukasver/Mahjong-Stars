import {
	BankDetails,
	DocumentRecipient,
	DocumentSignatureStatus,
	FOP,
	Token,
	TokensOnBlockchains,
} from "@prisma/client";
import { cache } from "react";
import { ONE_DAY, ONE_MINUTE, ROLES } from "@/common/config/constants";
import { GetExchangeRate } from "@/common/schemas/dtos/rates";
import { SaleInformationItem } from "@/common/schemas/dtos/sales/information";
import { Failure, Success } from "@/common/schemas/dtos/utils";
import {
	Blockchain,
	Currency,
	Document,
	KycTierType,
	SaftContract,
	Sale,
	SaleTransactions,
	TransactionStatusSchema,
	User,
} from "@/common/schemas/generated";
import { SaleWithToken } from "@/common/types/sales";
import { TokenWithRelations } from "@/common/types/tokens";
import {
	TransactionByIdWithRelations,
	TransactionWithRelations,
} from "@/common/types/transactions";

export type FetcherOptions = Omit<RequestInit, "body"> & {
	baseUrl?: string;
	token?: string;
} & (
		| {
				rawBody: true;
				body?: RequestInit["body"];
		  }
		| {
				rawBody?: false | never;
				// biome-ignore lint/suspicious/noExplicitAny: needed for request body
				body?: any;
		  }
	);

type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

class Fetcher {
	private baseUrl: string;
	private defaultToken?: string;
	private defaultOptions: Omit<FetcherOptions, "baseUrl" | "token">;

	constructor(options: FetcherOptions & { basePath?: string } = {}) {
		const { baseUrl = "", token, ...defaultOptions } = options;
		this.baseUrl = baseUrl + options.basePath;
		this.defaultToken = token;
		this.defaultOptions = defaultOptions;
	}

	static create(options: FetcherOptions & { basePath?: string } = {}): Fetcher {
		return new Fetcher(options);
	}

	fetcher = <T>(url: string, options: FetcherOptions = {}) => {
		const { token, ...fetchOptions } = options;
		const fullUrl = this.baseUrl ? `${this.baseUrl}${url}` : url;

		const {
			body,
			rawBody = false,
			...mergedOptions
		} = {
			...this.defaultOptions,
			...fetchOptions,
		};
		const finalToken = token || this.defaultToken;

		return fetch(fullUrl, {
			...mergedOptions,
			...(body && {
				body: typeof body === "string" || rawBody ? body : JSON.stringify(body),
			}),
			headers: {
				...mergedOptions.headers,
				...(finalToken && {
					authorization: finalToken
						? finalToken.startsWith("Bearer ")
							? finalToken
							: `Bearer ${finalToken}`
						: undefined,
				}),
			},
		}).then(async (res) => {
			const isText = res.headers.get("content-type")?.includes("text");
			if (!res.ok) {
				throw (await (isText ? res.text() : res.json())) as Failure<T>;
			}
			if (isText) {
				return res.text() as T;
			}
			if (fetchOptions.rawBody) {
				return res.body as T;
			}
			const json = (await res.json()) as Success<T> | Failure<T>;
			if (json.success) {
				return json.data as T;
			} else {
				throw new Error(json.message);
			}
		});
	};
}

const { fetcher } = Fetcher.create({
	credentials: "same-origin",
	basePath: "/api/proxy",
});

/**
 * Functions to fetch data from the API.
 * Should ONLY be used clientside. Should not be used to mutate data.
 */

export const getCurrentUser = async () => {
	try {
		const data = await fetcher<
			User & { roles: Record<keyof typeof ROLES, string> }
		>(`/users/me`);
		return { data: data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getSales = async (params?: { active?: boolean }) => {
	try {
		const queryParams = params
			? `?${new URLSearchParams({ active: params.active ? "true" : "false" })}`
			: "";
		const data = await fetcher<{ sales: SaleWithToken[]; quantity: number }>(
			`/sales${queryParams}`,
		);
		return { data: data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getSale = async (id: string) => {
	try {
		const data = await fetcher<{ sale: SaleWithToken }>(`/sales/${id}`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getActiveSale = async () => {
	try {
		const queryParams = new URLSearchParams({ active: "true" });
		const data = await fetcher<{ sales: SaleWithToken[]; quantity: number }>(
			`/sales?${queryParams}`,
		);
		return { data: data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getSaleSaft = async (id: string) => {
	try {
		const data = await fetcher<{
			saft: SaftContract | null;
			versions: SaftContract[];
			approver?: Pick<DocumentRecipient, "email" | "fullname" | "role"> | null;
		}>(`/sales/${id}/saft`);
		return { data: data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getSaleDocuments = async (id: string) => {
	try {
		const data = await fetcher<{
			images: Document[];
			documents: Document[];
		}>(`/sales/${id}/documents`);
		return { data: data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getSaleInformation = async (id: string) => {
	try {
		const data = await fetcher<SaleInformationItem[]>(
			`/sales/${id}/information`,
		);
		return { data: data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getSaleInvestInfo = async (id: string) => {
	try {
		const data = await fetcher<{
			sale: Pick<
				SaleWithToken,
				| "id"
				| "tokenPricePerUnit"
				| "tokenContractAddress"
				| "status"
				| "initialTokenQuantity"
				| "availableTokenQuantity"
				| "maximumTokenBuyPerUser"
				| "minimumTokenBuyPerUser"
				| "saleStartDate"
				| "saleClosingDate"
				| "saftCheckbox"
				| "currency"
				| "token"
				| "requiresKYC"
				| "tokenSymbol"
				| "comparisonPricePerUnit"
			> & {
				blockchain: Pick<Blockchain, "chainId" | "name">;
			};
		}>(`/sales/${id}/invest`);

		return { data: data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getExchangeRate = async (from: string, to: string) => {
	try {
		const data = await fetcher<GetExchangeRate>(
			`/feeds/rates?from=${from}&to=${to}`,
			{
				next: {
					revalidate: ONE_MINUTE,
				},
			},
		);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getCurrencies = async () => {
	try {
		const data = await fetcher<{
			currencies: Pick<Currency, "symbol" | "name" | "type">[];
		}>(`/feeds/currencies`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getUserPendingTransactionsForSale = async (saleId: string) => {
	const params = new URLSearchParams([
		["status", TransactionStatusSchema.enum.PENDING],
		["status", TransactionStatusSchema.enum.AWAITING_PAYMENT],
	]);
	try {
		const data = await fetcher<{
			transactions: (Pick<
				SaleTransactions,
				| "id"
				| "quantity"
				| "amountPaid"
				| "paidCurrency"
				| "tokenSymbol"
				| "formOfPayment"
				| "receivingWallet"
				| "comment"
				| "status"
				| "price"
				| "totalAmount"
				| "createdAt"
				| "updatedAt"
			> & {
				user: Pick<User, "email" | "walletAddress" | "id">;
				sale: Pick<Sale, "id" | "name" | "tokenSymbol">;
			})[];
			saft: boolean;
			kyc: boolean;
			paymentMethod: FOP;
		}>(`/transactions/${saleId}?${params.toString()}`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getTransactionById = async (id: string) => {
	try {
		const data = await fetcher<{
			transaction: TransactionByIdWithRelations;
			requiresKYC: KycTierType | null;
			requiresSAFT: boolean;
		}>(`/transactions/${id}`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getSaleSaftForTransaction = async (txId: string) => {
	try {
		const data = await fetcher<{
			id: string;
			content: string;
			missingVariables: string[];
		}>(`/transactions/${txId}/saft`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getRecipientForCurrentTransactionSaft = async (
	transactionId: string,
) => {
	try {
		const data = await fetcher<{
			recipient: null | {
				id: string;
				status: DocumentSignatureStatus;
				email: string;
			};
		}>(`/transactions/${transactionId}/recipient`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getSaftForTransactionDetails = async (recipientId: string) => {
	try {
		const data = await fetcher<{
			recipient: {
				id: string;
				status: DocumentSignatureStatus;
				signatureUrl: string;
				email: string;
				fullname: string;
			};
		}>(`/saft/details/${recipientId}`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

/** Get banks associated with a sale */
export const getSaleBanks = async (saleId: string) => {
	try {
		const data = await fetcher<{
			banks: (Pick<
				Omit<BankDetails, "currency">,
				| "id"
				| "bankName"
				| "accountName"
				| "iban"
				| "swift"
				| "address"
				| "memo"
			> & {
				currency: string;
			})[];
		}>(`/sales/${saleId}/banks`);

		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getUserTransactions = async (params: {
	userId?: string;
	formOfPayment?: FOP;
	symbol?: string;
	sale?: string;
}) => {
	const queryParams = new URLSearchParams(params);
	try {
		const data = await fetcher<{
			transactions: TransactionWithRelations[];
		}>(`/transactions/user/me?${queryParams.toString()}`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getAllTransactions = async (params: {
	saleId?: string;
	userId?: string;
}) => {
	const search = new URLSearchParams();

	Object.entries(params || {}).forEach(([key, value]) => {
		if (value) {
			search.set(key, value);
		}
	});
	const queryParams = search.size > 0 ? `?${search.toString()}` : "";

	try {
		const data = await fetcher<{
			transactions: TransactionWithRelations[];
			quantity: number;
		}>(`/admin/transactions${queryParams}`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getCryptoTransaction = async (
	txId: string,
	params: Record<string, string | number>,
) => {
	const search = new URLSearchParams();

	Object.entries(params || {}).forEach(([key, value]) => {
		if (value) {
			search.set(key, String(value));
		}
	});

	const queryParams = search.size > 0 ? `?${search.toString()}` : "";

	try {
		const data = await fetcher<{
			// amend
			transaction: TransactionByIdWithRelations;
			token: Token;
			blockchain: Pick<
				Blockchain,
				"explorerUrl" | "name" | "chainId" | "isTestnet" | "isEnabled"
			> | null;
			paymentToken: Pick<
				TokensOnBlockchains,
				| "contractAddress"
				| "decimals"
				| "isNative"
				| "name"
				| "tokenSymbol"
				| "id"
				| "chainId"
			> | null;
		}>(`/transactions/${txId}/crypto${queryParams}`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getDocumentById = async (id: string | string[]) => {
	const search = new URLSearchParams();
	const ids = Array.isArray(id) ? id : [id];
	ids.forEach((id) => {
		search.set("ids", id);
	});
	const queryParams = search.size > 0 ? `?${search.toString()}` : "";
	try {
		const data = await fetcher<{
			documents: {
				id: string;
				fileName: string;
				name: string;
				url: string;
			}[];
		}>(`/admin/documents${queryParams}`, {
			next: {
				// Default expire time for GCP presigned url is 1 day
				revalidate: ONE_DAY,
			},
		});
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getSignedAgreement = async (id: string) => {
	try {
		const data = await fetcher<{
			agreement: DocumentRecipient & { downloadUrl: string | null };
		}>(`/admin/agreement/${id}`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getBlockchains = async () => {
	try {
		const data = await fetcher<{
			chains: Pick<
				Blockchain,
				| "chainId"
				| "name"
				| "isTestnet"
				| "isEnabled"
				| "rpcUrl"
				| "explorerUrl"
			>[];
		}>(`/blockchains`);

		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getTokens = cache(
	async (qParams: Record<string, string | number>) => {
		const search = new URLSearchParams();

		Object.entries(qParams || {}).forEach(([key, value]) => {
			if (value) {
				search.set(key, String(value));
			}
		});
		const queryParams = search.size > 0 ? `?${search.toString()}` : "";

		try {
			const data = await fetcher<{ tokens: TokenWithRelations[] }>(
				`/blockchains/tokens${queryParams}`,
			);
			return { data, error: null };
		} catch (e) {
			return { data: null, error: e };
		}
	},
);

export const getCurrentUserKycVerification = async () => {
	try {
		const data = await fetcher<{ kyc: unknown }>(`/users/me/kyc`);
		return { data, error: null };
	} catch (e) {
		return { data: null, error: e };
	}
};

export const getUsers = async (params: {
	page?: number;
	limit?: number;
	search?: string;
	kycStatus?: string;
}) => {
	const search = new URLSearchParams();

	Object.entries(params || {}).forEach(([key, value]) => {
		if (value) {
			search.set(key, String(value));
		}
	});
	const queryParams = search.size > 0 ? `?${search.toString()}` : "";

	try {
		const data = await fetcher<{
			users: Array<{
				id: string;
				walletAddress: string;
				email: string;
				name: string;
				emailVerified: boolean;
				createdAt: Date;
				profile: {
					firstName: string | null;
					lastName: string | null;
					dateOfBirth: Date | null;
					address: {
						street: string | null;
						city: string | null;
						zipCode: string | null;
						state: string | null;
						country: string | null;
					} | null;
				} | null;
				kycVerification: {
					status: string;
					verifiedAt: Date | null;
					rejectionReason: string | null;
					tier: string | null;
					documents?: Array<{
						id: string;
						url: string;
						fileName: string;
						name: string;
					}>;
				} | null;
				transactionCounts: Record<string, number>;
				_count: {
					transactions: number;
				};
			}>;
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
			};
		}>(`/admin/users${queryParams}`);

		return { data, error: null };
	} catch (error) {
		return { data: null, error };
	}
};
