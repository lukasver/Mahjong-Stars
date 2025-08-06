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
> & {
  explorerUrl?: string | null;
};

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
          blockchain: {
            select: {
              explorerUrl: true,
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

const AdminTransactionsWithRelations =
  Prisma.validator<Prisma.SaleTransactionsDefaultArgs>()({
    include: {
      sale: true,
      user: {
        select: {
          email: true,
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
                  id: true,
                  url: true,
                  fileName: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      approver: true,
      blockchain: true,
      tokenDistributions: true,
    },
  });
export type AdminTransactionsWithRelations = Prisma.SaleTransactionsGetPayload<
  typeof AdminTransactionsWithRelations
>;
