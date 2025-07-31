import { Prisma } from '@prisma/client';

const transactionWithRelations =
  Prisma.validator<Prisma.SaleTransactionsDefaultArgs>()({
    include: {
      sale: true,
      approver: true,
      blockchain: true,
      tokenDistributions: true,
    },
  });
export type TransactionWithRelations = Prisma.SaleTransactionsGetPayload<
  typeof transactionWithRelations
>;
