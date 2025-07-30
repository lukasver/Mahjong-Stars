import { Prisma, SaleStatus } from '@prisma/client';

export const TOKEN_QUERY = {
  select: {
    symbol: true,
    image: true,
    TokensOnBlockchains: {
      select: {
        decimals: true,
        contractAddress: true,
        chainId: true,
      },
    },
  },
} as const;

export const DEFAULT_SALE_SELECT: Prisma.SaleSelect = {
  id: true,
  name: true,
  status: true,
  availableTokenQuantity: true,
  saleCurrency: true,
  initialTokenQuantity: true,
  maximumTokenBuyPerUser: true,
  minimumTokenBuyPerUser: true,
  saleStartDate: true,
  tokenContractAddress: true,
  tokenName: true,
  tokenTotalSupply: true,
  tokenPricePerUnit: true,
  tokenSymbol: true,
  toWalletsAddress: true,
  saleClosingDate: true,
  createdBy: true,
  saftCheckbox: true,
  saftContract: true,
  currency: true,
  token: TOKEN_QUERY,
  information: true,
  banner: {
    select: {
      url: true,
    },
  },
} as const;

const GetAllQueryValidator = Prisma.validator<Prisma.SaleFindManyArgs>();
const SalesWithRelations = GetAllQueryValidator({
  select: DEFAULT_SALE_SELECT,
});
const ActiveSalesQueryValidator = GetAllQueryValidator({
  where: {
    status: SaleStatus.OPEN,
  },
  select: DEFAULT_SALE_SELECT,
});

export type ActiveSalesWithRelationsArgs = typeof ActiveSalesQueryValidator;
export type SalesWithRelationsArgs = typeof SalesWithRelations;
export type GetSalesArgs =
  | SalesWithRelationsArgs
  | ActiveSalesWithRelationsArgs;

export type SalesWithRelations = Prisma.SaleGetPayload<GetSalesArgs>;
