import { NextResponse } from "next/server";
import { env } from "@/common/config/env";
import { TransactionStatusSchema } from "@/common/schemas/generated";
import blockchains from "@/lib/repositories/chains";
import documents from "@/lib/repositories/documents";
import rates from "@/lib/repositories/feeds/rates";
import sales from "@/lib/repositories/sales";
import transactions from "@/lib/repositories/transactions";
import users from "@/lib/repositories/users";

import { withAuth } from "./_auth";

/**
 * Handles GET requests for the proxy route with authentication.
 */
export const GET = withAuth(async (req, context, auth) => {
	const { all } = await context.params;

	const qParams = req.nextUrl.searchParams;
	const qParamsObject = Object.fromEntries(qParams.entries());

	const controller = all[0];
	const identifier = all[1];
	const subIdentifier = all[2];

	if (!controller) {
		return NextResponse.json({ error: "Bad request" }, { status: 404 });
	}

	try {
		switch (controller) {
			case "sales": {
				if (identifier) {
					if (subIdentifier === "saft") {
						const data = await sales.getSaleSaftContract(identifier);
						return NextResponse.json(data);
					}
					if (subIdentifier === "documents") {
						const data = await sales.getSaleDocuments(identifier);
						return NextResponse.json(data);
					}
					if (subIdentifier === "invest") {
						const data = await sales.getSaleInvestInfo(identifier);
						return NextResponse.json(data);
					}
					if (subIdentifier === "banks") {
						const data = await sales.getSaleBanks(identifier, {
							address: auth.address,
						});
						return NextResponse.json(data);
					}

					const data = await sales.getSale(
						{ id: identifier },
						{ address: auth.address },
					);

					return NextResponse.json(data);
				}

				const data = await sales.getSales(
					{ active: qParamsObject.active === "true" },
					{ address: auth.address },
				);

				return NextResponse.json(data);
			}

			case "users": {
				if (identifier === "me") {
					const data = await users.getMe({ address: auth.address });
					return NextResponse.json(data);
				}
				return NextResponse.json({ error: "Bad request" }, { status: 404 });
			}

			case "feeds": {
				if (identifier === "rates") {
					const from = qParams.get("from");
					const to = qParams.get("to");

					if (!from || !to) {
						return NextResponse.json({ error: "Bad request" }, { status: 404 });
					}
					const fromArray = from.split(",");
					const toArray = to.split(",");

					const data = await rates.getExchangeRate(
						fromArray?.length > 1 ? fromArray : from,
						toArray?.length > 1 ? toArray : to,
					);

					console.log("🚀 ~ route.ts:93 ~ data:", data);

					return NextResponse.json(data);
				}
				return NextResponse.json({ error: "Bad request" }, { status: 404 });
			}

			case "transactions": {
				if (identifier) {
					if (subIdentifier === "saft") {
						const data = await transactions.getSaleSaftForTransaction(
							{ txId: identifier },
							{ address: auth.address },
						);
						return NextResponse.json(data);
					}
					if (subIdentifier === "recipient") {
						const data =
							await transactions.getRecipientForCurrentTransactionSaft(
								{ transactionId: identifier },
								{ address: auth.address },
							);
						return NextResponse.json(data);
					}
					if (subIdentifier === "me") {
						const data = await transactions.getUserTransactions(qParamsObject, {
							address: auth.address,
						});
						return NextResponse.json(data);
					}
					if (subIdentifier === "crypto") {
						const data = await transactions.getCryptoTransaction(
							{
								id: identifier,
							},
							{ address: auth.address },
						);
						return NextResponse.json(data);
					}
					const data = await transactions.userTransactionsForSale(
						{
							saleId: identifier,
							status: TransactionStatusSchema.array().parse(
								qParams.getAll("status") || [],
							),
						},
						{ address: auth.address },
					);
					return NextResponse.json(data);
				}
				return NextResponse.json({ error: "Bad request" }, { status: 404 });
			}

			case "saft": {
				if (identifier === "details") {
					if (subIdentifier) {
						const data = await transactions.getSaftForTransactionDetails(
							{ recipientId: subIdentifier },
							{ address: auth.address },
						);
						return NextResponse.json(data);
					}
					return NextResponse.json({ error: "Bad request" }, { status: 404 });
				}

				return NextResponse.json({ error: "Bad request" }, { status: 404 });
			}

			case "blockchains": {
				const res = await blockchains.getAll();
				return NextResponse.json(res);
			}

			case "admin": {
				if (!auth.isAdmin) {
					return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
				}

				if (identifier === "transactions") {
					const data = await transactions.getAllTransactions(
						qParamsObject || {},
						{
							address: auth.address,
							userId: auth.userId,
							isAdmin: auth.isAdmin,
						},
					);
					return NextResponse.json(data);
				}

				if (identifier === "documents") {
					const data = await documents.getDocumentById(
						qParamsObject.ids as string | string[],
						{ presignedUrl: true },
						{
							address: auth.address,
							userId: auth.userId,
							isAdmin: auth.isAdmin,
						},
					);
					return NextResponse.json(data);
				}

				if (identifier === "agreement") {
					const data = await documents.getAgreementById(
						{ agreementId: subIdentifier as string },
						{
							address: auth.address,
							userId: auth.userId,
							isAdmin: auth.isAdmin,
						},
					);
					return NextResponse.json(data);
				}
				return NextResponse.json({ error: "Bad request" }, { status: 404 });
			}
		}

		return NextResponse.json({ error: "Bad request" }, { status: 404 });
	} catch (e) {
		let error = "Internal server error";
		if (e instanceof Error && env.IS_DEV) {
			error += ": " + e.message;
		}
		return new NextResponse(JSON.stringify({ error }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
});
