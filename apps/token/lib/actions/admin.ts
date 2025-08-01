'use server';
import 'server-only';
import documentsController from '@/lib/repositories/documents';
import { ROLES } from '@/common/config/constants';
import { prisma } from '@/db';
import { adminCache } from '@/lib/auth/cache';
import { Prisma, User } from '@prisma/client';
import { authActionClient } from './config';
import {
  CreateSaleDto,
  DeleteSaleDto,
  UpdateSaleDto,
  UpdateSaleStatusDto,
} from '@/common/schemas/dtos/sales';

import {
  CancelAllTransactionsDto,
  UpdateTransactionDto,
} from '@/common/schemas/dtos/transactions';
import salesController from '@/lib/repositories/sales';
import transactionsController from '@/lib/repositories/transactions';
import { TransactionStatus } from '@prisma/client';
import { z } from 'zod';
import { type JSONContent } from '@mjs/utils/server/tiptap';
import { BankDetailsSchema } from '@/components/admin/create-sales/utils';
import {
  verifyAdminSignature,
  AdminActionPayloadSchema,
} from '@/lib/auth/admin-wallet-auth';

export const isAdmin = adminCache.wrap(async (walletAddress: string) => {
  return await prisma.user.findUniqueOrThrow({
    where: {
      walletAddress,
      userRole: {
        some: {
          role: {
            name: {
              in: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
            },
          },
        },
      },
    },
    select: {
      id: true,
    },
  });
});

const adminMiddleware: Parameters<typeof authActionClient.use>[0] = async ({
  next,
  ctx,
}) => {
  let authed: Pick<User, 'id'> | null = null;
  try {
    authed = await isAdmin(ctx.address);
  } catch (_e: unknown) {
    console.log(
      'NON ADMIN, NOT CACHEEABLE',
      _e instanceof Error ? _e.message : _e
    );
    authed = null;
  }
  return next({
    ctx: {
      ...ctx,
      isAdmin: !!authed,
      userId: authed?.id,
    },
  });
};

/**
 * Use this client for sensistive administrative actions only
 */
const adminClient = authActionClient.use(adminMiddleware);

/**
 * =====================================
 * =============== ADMIN ===============
 * =====================================
 */

// /**
//  * @warning ADMIN REQUIRED
//  */
// const createSale = adminClient
//   .schema(CreateSaleDto)
//   .action(async ({ ctx, parsedInput }) => {
//     const sales = await salesController.createSale(parsedInput, ctx);
//     if (!sales.success) {
//       throw new Error(sales.message);
//     }
//     return sales.data;
//   });

export const upsertSale = adminClient
  .schema(CreateSaleDto.extend({ id: z.string().optional() }))
  .action(async ({ ctx, parsedInput }) => {
    let sale:
      | Awaited<ReturnType<typeof salesController.updateSale>>
      | Awaited<ReturnType<typeof salesController.createSale>>
      | null = null;
    if (parsedInput.id) {
      const { id, ...rest } = parsedInput;

      sale = await salesController.updateSale(
        {
          id,
          data: {
            ...rest,
            tokenPricePerUnit: new Prisma.Decimal(rest.tokenPricePerUnit),
          },
        },
        ctx
      );
    } else {
      sale = await salesController.createSale(parsedInput, ctx);
    }
    if (!sale.success) {
      throw new Error(sale.message);
    }
    return sale.data;
  });

/**
 * @warning ADMIN REQUIRED
 */
export const updateSale = adminClient
  .schema(UpdateSaleDto)
  .action(async ({ ctx, parsedInput }) => {
    const sales = await salesController.updateSale(parsedInput, ctx);
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

export const associateBankDetailsToSale = adminClient
  .schema(
    z.object({
      banks: z.array(BankDetailsSchema),
      saleId: z.string(),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const sales = await salesController.associateBankDetailsToSale(
      parsedInput,
      ctx
    );
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

export const disassociateBankDetailsFromSale = adminClient
  .schema(
    z.object({
      saleId: z.string(),
      bankId: z.string().or(z.array(z.string())),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const sales = await salesController.disassociateBankDetailsFromSale(
      parsedInput,
      ctx
    );
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

// /**
//  * @warning ADMIN REQUIRED
//  */
// export const updateProjectInformation = adminClient
//   .schema(
//     z.object({
//       saleId: z.string(),
//       information: z.array(
//         z.object({
//           label: z.string(),
//           type: z.string(),
//           value: z.string(),
//         })
//       ),
//     })
//   )
//   .action(async ({ ctx, parsedInput }) => {
//     const { saleId, ...rest } = parsedInput;

//     const sales = await salesController.updateSaleInformation(
//       saleId,
//       rest,
//       ctx
//     );
//     if (!sales.success) {
//       throw new Error(sales.message);
//     }
//     return sales.data;
//   });

/**
 * @warning ADMIN REQUIRED
 */
export const updateSaleStatus = adminClient
  .schema(UpdateSaleStatusDto)
  .action(async ({ ctx, parsedInput }) => {
    const sales = await salesController.updateSaleStatus(parsedInput, ctx);
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

/**
 * @warning ADMIN REQUIRED
 */
export const deleteSale = adminClient
  .schema(DeleteSaleDto)
  .action(async ({ ctx, parsedInput }) => {
    const sales = await salesController.deleteSale(parsedInput, ctx);
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

/**
 * @warning ADMIN REQUIRED
 */
export const confirmAdminTransaction = adminClient
  .schema(UpdateTransactionDto)
  .action(async ({ ctx, parsedInput }) => {
    const transaction = await transactionsController.adminUpdateTransaction(
      parsedInput,
      ctx
    );
    if (!transaction.success) {
      throw new Error(transaction.message);
    }
    return transaction.data;
  });

/**
 * @warning ADMIN REQUIRED
 */
export const cancelAllTransactions = adminClient
  .schema(CancelAllTransactionsDto)
  .action(async ({ ctx, parsedInput }) => {
    const transaction = await transactionsController.adminUpdateTransaction(
      { ...parsedInput, status: TransactionStatus.CANCELLED },
      ctx
    );
    if (!transaction.success) {
      throw new Error(transaction.message);
    }
    return transaction.data;
  });

/**
 * @warning ADMIN REQUIRED
 */
export const createSaftContract = adminClient
  .schema(
    z.object({
      content: z.union([z.string(), z.custom<JSONContent>()]),
      name: z.string(),
      description: z.string().optional(),
      saleId: z.string(),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    console.log('ENTRE?', parsedInput);
    const result = await documentsController.createSaft(parsedInput, ctx);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  });

/**
 * Verify admin action signature and permissions
 */
export const verifyAdminAction = adminClient
  .schema(
    z.object({
      payload: AdminActionPayloadSchema,
      signature: z.string(),
      address: z.string(),
      chainId: z.number(),
    })
  )
  .action(async ({ parsedInput }) => {
    const result = await verifyAdminSignature(parsedInput);

    return result;
  });
