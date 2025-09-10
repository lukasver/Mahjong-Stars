import "server-only";

import { Failure, Success } from "@/common/schemas/dtos/utils";
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
}

export default new BlockchainController();
