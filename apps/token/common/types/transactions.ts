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

const transactionByIdWithRelations =
  Prisma.validator<Prisma.SaleTransactionsDefaultArgs>()({
    include: {
      sale: {
        select: {
          id: true,
          name: true,
          requiresKYC: true,
          saftCheckbox: true,
          tokenSymbol: true,
          toWalletsAddress: true,
          saftContract: {
            select: {
              id: true,
            },
          },
        },
      },
      approver: true,
      blockchain: true,
      tokenDistributions: true,
      user: {
        select: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          kycVerification: {
            select: {
              id: true,
              status: true,
              documents: {
                select: {
                  url: true,
                  fileName: true,
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
export type TransactionByIdWithRelations = Prisma.SaleTransactionsGetPayload<
  typeof transactionByIdWithRelations
>;
