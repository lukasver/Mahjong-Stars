import { invariant } from "@epic-web/invariant";
import { PrismaClient } from "@prisma/client";
import {
	createThirdwebClient,
	defineChain,
	NATIVE_TOKEN_ADDRESS,
} from "thirdweb";
import {
	ALLOWED_CHAINS,
	NETWORK_TO_TOKEN_MAPPING,
} from "@/services/crypto/config";

const secretKey = process.env.THIRDWEB_API_SECRET;
invariant(secretKey, "THIRDWEB_API_SECRET is not set");

// secretKey for serverside usage, wont be available in client
export const client = createThirdwebClient({
	secretKey,
	teamId: process.env.THIRDWEB_TEAM_ID,
});

export async function seedBlockchains(prisma: PrismaClient) {
	await prisma.blockchain.createManyAndReturn({
		data: ALLOWED_CHAINS.map((c) => ({
			name: c.name || "",
			chainId: c.id,
			rpcUrl: c.rpc,
			explorerUrl: c.blockExplorers?.[0]?.url,
			isTestnet: c.testnet || c.name?.toLowerCase()?.includes("testnet"),
			isEnabled: true,
		})),
		skipDuplicates: true,
	});

	const nativeTokens = ALLOWED_CHAINS.map(({ nativeCurrency, id }) => ({
		symbol: nativeCurrency?.symbol,
		decimals: nativeCurrency?.decimals,
		chainId: id,
		name: nativeCurrency?.name,
		contractAddress: NATIVE_TOKEN_ADDRESS,
	})).filter(Boolean);

	await Promise.all([
		...nativeTokens.map((t) =>
			prisma.token.create({
				data: {
					symbol: t.symbol!,
					TokensOnBlockchains: {
						create: {
							blockchain: {
								connect: {
									chainId: t.chainId,
								},
							},
							contractAddress: t.contractAddress,
							name: t.name!,
							decimals: t.decimals!,
							isNative: true,
						},
					},
				},
			}),
		),
	]);
	await Promise.all(
		Object.entries(NETWORK_TO_TOKEN_MAPPING).map(async ([chainId, tokens]) => {
			return Promise.all(
				Object.entries(tokens).map(async ([tokenSymbol, token]) => {
					if (token.isNative) {
						// Native token creation is handled in the previous step
						return Promise.resolve();
					}
					return prisma.token.create({
						data: {
							symbol: tokenSymbol,
							totalSupply: tokenSymbol === "tMJS" ? "888888888" : null,
							image:
								tokenSymbol === "tMJS"
									? "https://storage.googleapis.com/mjs-public/branding/isologo.webp"
									: null,
							TokensOnBlockchains: {
								create: {
									blockchain: {
										connectOrCreate: {
											where: {
												chainId: Number(chainId),
											},
											create: {
												chainId: Number(chainId),
												name: defineChain(Number(chainId)).name || "",
												rpcUrl: defineChain(Number(chainId)).rpc,
												explorerUrl: defineChain(Number(chainId))
													.blockExplorers?.[0]?.url,
												isTestnet:
													defineChain(Number(chainId)).testnet ||
													defineChain(Number(chainId))
														.name?.toLowerCase()
														?.includes("testnet"),
												isEnabled: true,
											},
										},
									},
									name: tokenSymbol,
									decimals: token.decimals,
									contractAddress: token.contract,
									isNative: token.isNative,
								},
							},
						},
					});
				}),
			);
		}),
	);
}
