import { CRYPTO_CURRENCIES, FIAT_CURRENCIES } from '@/common/config/constants';
import { CurrencyTypeSchema } from '@/common/schemas/generated';
import { PrismaClient } from '@prisma/client';

export async function seedCurrencies(
  prisma: PrismaClient,
  environment: string
) {
  const payload = [
    ...FIAT_CURRENCIES.map((s) => ({
      name: s,
      symbol: s,
      type: CurrencyTypeSchema.enum.FIAT,
    })),
    ...CRYPTO_CURRENCIES.map((s) => ({
      name: s,
      symbol: s,
      type: CurrencyTypeSchema.enum.CRYPTO,
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
  ];

  return prisma.currency.createManyAndReturn({
    data: payload,
    skipDuplicates: true,
  });
}
