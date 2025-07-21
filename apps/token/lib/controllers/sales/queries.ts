import { Prisma } from '@prisma/client';

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
