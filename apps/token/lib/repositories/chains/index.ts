import "server-only";

import { Failure, Success } from "@/common/schemas/dtos/utils";
import { TokenWithRelations } from "@/common/types/tokens";
import { prisma } from "@/db";
import logger from "@/lib/services/logger.server";

export class BlockchainController {
	/**
	 * Get all chains.
	 */
	async getAll() {
		try {
			const chains = await prisma.blockchain.findMany({
				where:
					process.env.NODE_ENV === "production"
						? {
								isEnabled: true,
								isTestnet: false,
							}
						: {
								isEnabled: true,
							},
				select: {
					chainId: true,
					explorerUrl: true,
					isTestnet: true,
					name: true,
					isEnabled: true,
					rpcUrl: true,
				},
				orderBy: {
					chainId: "asc",
				},
			});

			return Success({
				chains,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}

	/**
	 * Get all tokens
	 */
	async getTokens({ symbol }: { symbol?: string } = {}) {
		try {
			const tokens = await prisma.token.findMany({
				where: symbol ? { symbol } : undefined,
				select: {
					symbol: true,
					image: true,
					id: true,
					TokensOnBlockchains: {
						select: {
							chainId: true,
							contractAddress: true,
							name: true,
							decimals: true,
							isNative: true,
						},
					},
				},
			});

			const result: TokenWithRelations[] = tokens.map(
				({ TokensOnBlockchains, ...token }) => {
					const blockchainData = TokensOnBlockchains[0]!;
					return {
						...token,
						...blockchainData,
					};
				},
			);

			return Success({
				tokens: result,
			});
		} catch (e) {
			logger(e);
			return Failure(e);
		}
	}
}

export default new BlockchainController();
