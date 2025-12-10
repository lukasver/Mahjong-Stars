import { Blockchain, Prisma } from "@prisma/client";
import { TOKEN_QUERY } from "@/lib/repositories/sales/queries";

const saleWithRelations = Prisma.validator<Prisma.SaleDefaultArgs>()({
  include: { token: TOKEN_QUERY, banner: { select: { url: true } } },
});

export type SaleWithRelations = Prisma.SaleGetPayload<typeof saleWithRelations>;

export interface SaleWithToken extends Omit<SaleWithRelations, "token"> {
  token: {
    chainId: number | undefined;
    contractAddress: string | undefined | null;
    decimals: number | undefined;
    symbol: string | undefined;
    image: string | undefined | null;
  };
}

export type SaleInvestInfo = {
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
  }
};
