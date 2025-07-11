'use server';
import documentsController from '@/lib/controllers/documents';
import { ROLES } from '@/common/config/constants';
import { prisma } from '@/db';
import { adminCache } from '@/lib/auth/cache';
import { User } from '@prisma/client';
import { authActionClient } from './config';
import 'server-only';
import {
  CreateSaleDto,
  DeleteSaleDto,
  UpdateSaleDto,
  UpdateSaleStatusDto,
} from '@/common/schemas/dtos/sales';
import {
  CreateSaleInformationDto,
  UpdateSaleInformationDto,
} from '@/common/schemas/dtos/sales/information';
import {
  CancelAllTransactionsDto,
  UpdateTransactionDto,
} from '@/common/schemas/dtos/transactions';
import salesController from '@/lib/controllers/sales';
import salesInformationController from '@/lib/controllers/salesInformation';
import transactionsController from '@/lib/controllers/transactions';
import { TransactionStatus } from '@prisma/client';
import { z } from 'zod';
import { JSONContent } from '../controllers/documents/types';

const isAdmin = adminCache.wrap(async (walletAddress: string) => {
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

/**
 * @warning ADMIN REQUIRED
 */
export const createSale = adminClient
  .schema(CreateSaleDto)
  .action(async ({ ctx, parsedInput }) => {
    const sales = await salesController.createSale(parsedInput, ctx);
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
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

/**
 * @warning ADMIN REQUIRED
 */
export const createSaleInformation = adminClient
  .schema(CreateSaleInformationDto.extend({ saleId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    const sales = await salesInformationController.upsertSaleInformation(
      parsedInput,
      ctx
    );
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

/**
 * @warning ADMIN REQUIRED
 */
export const updateSaleInformation = adminClient
  .schema(
    UpdateSaleInformationDto.extend({
      saleId: z.string(),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const { saleId, ...rest } = parsedInput;

    const sales = await salesInformationController.updateSaleInformation(
      saleId,
      rest,
      ctx
    );
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

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
export const createSaftContract = authActionClient
  .schema(
    z.object({
      content: z.union([z.string(), z.custom<JSONContent>()]),
      name: z.string(),
      description: z.string().optional(),
      saleId: z.string(),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const result = await documentsController.createSaft(parsedInput, ctx);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  });
