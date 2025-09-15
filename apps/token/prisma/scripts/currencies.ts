import { Currency, PrismaClient } from "@prisma/client";
import { CRYPTO_CURRENCIES, FIAT_CURRENCIES } from "@/common/config/constants";
import { CurrencyTypeSchema } from "@/common/schemas/generated";

export async function seedCurrencies(
	prisma: PrismaClient,
	environment: string,
) {
	const payload = [
		...FIAT_CURRENCIES.map((s) => ({
			name: s,
			symbol: s,
			type: CurrencyTypeSchema.enum.FIAT,
			image: `https://storage.googleapis.com/mjs-public/branding/curs/${s}.webp`,
		})),
		...CRYPTO_CURRENCIES.map((s) => ({
			name: s,
			symbol: s,
			type: CurrencyTypeSchema.enum.CRYPTO,
			image: `https://storage.googleapis.com/mjs-public/branding/curs/${s}.webp`,
		})),
		// ...(environment === 'production'
		//   ? []
		//   : [
		//       {
		//         name: 'TESTNET BNB',
		//         symbol: 'tBNB',
		//         type: CurrencyTypeSchema.enum.CRYPTO,
		//       },
		//     ]),
	] satisfies Pick<Currency, "name" | "symbol" | "type" | "image">[];

	return prisma.currency.createManyAndReturn({
		data: payload,
		skipDuplicates: true,
	});
}
