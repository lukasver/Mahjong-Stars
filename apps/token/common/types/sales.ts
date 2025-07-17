import { TOKEN_QUERY } from '@/lib/controllers/sales/queries';
import { Prisma } from '@prisma/client';

const saleWithRelations = Prisma.validator<Prisma.SaleDefaultArgs>()({
  include: { token: TOKEN_QUERY },
});

export type SaleWithRelations = Prisma.SaleGetPayload<typeof saleWithRelations>;

export interface SaleWithToken extends Omit<SaleWithRelations, 'token'> {
  token: {
    chainId: number | undefined;
    contractAddress: string | undefined | null;
    decimals: number | undefined;
    symbol: string | undefined;
    image: string | undefined | null;
  };
}
