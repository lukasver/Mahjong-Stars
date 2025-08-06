import 'server-only';
import { getSessionCookie } from '../auth/cookies';
import { verifyJwt } from '../auth/thirdweb';
import users from '../repositories/users';
import transactions from '../repositories/transactions';
import sales from '../repositories/sales';

import { getUserFromCache } from '../auth/cache';
import { isAdmin } from '../actions/admin';
import { cache } from 'react';
import { SaleStatus, TransactionStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { decimalsToString } from '@/common/schemas/dtos/utils';

export const getUserFromSession = cache(async () => {
  const verified = await getSessionCookie()
    .then((d) => verifyJwt(d || ''))
    .catch(() => null);
  if (!verified || !verified.valid) {
    throw new Error('Invalid session');
  }
  return getUserFromCache(verified.parsedJWT.sub);
});

export const getCurrentUser = cache(async () => {
  const user = await getUserFromSession();
  const result = await users.getMe({
    address: user.walletAddress,
  });
  if (result.success) {
    return { data: result.data, error: null };
  } else {
    return { data: null, error: result };
  }
});

export const getUserTransactions = cache(async () => {
  const user = await getUserFromSession();
  const result = await transactions.getUserTransactions(
    {},
    {
      userId: user.id,
      address: user.walletAddress,
    }
  );
  if (result.success) {
    return { data: result.data, error: null };
  } else {
    return { data: null, error: result };
  }
});

export const getAllTransactions = cache(
  async ({ saleId }: { saleId?: string }) => {
    const user = await getUserFromSession();
    const isAdminUser = await isAdmin(user.walletAddress);
    const result = await transactions.getAllTransactions(
      { saleId },
      {
        address: user.walletAddress,
        userId: user.id,
        isAdmin: !!isAdminUser,
      }
    );

    if (result.success) {
      return { data: result.data, error: null };
    } else {
      return { data: null, error: result };
    }
  }
);

export const getActiveSale = cache(async () => {
  const user = await getUserFromSession();
  const result = await sales.getSales(
    { active: true },
    {
      address: user.walletAddress,
      userId: user.id,
    }
  );
  if (result.success) {
    return { data: result.data, error: null };
  } else {
    return { data: null, error: result };
  }
});

export const getRecentTransactions = cache(async () => {
  try {
    const transactions = await prisma.saleTransactions.findMany({
      where: {
        status: {
          notIn: [
            TransactionStatus.REJECTED,
            TransactionStatus.CANCELLED,
            TransactionStatus.REFUNDED,
          ],
        },
      },
      select: {
        id: true,
        quantity: true,
        totalAmount: true,
        amountPaidCurrency: true,
        user: {
          select: {
            walletAddress: true,
          },
        },
        createdAt: true,
        sale: {
          select: {
            tokenSymbol: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to 10 most recent transactions
    });
    return {
      data: { transactions: decimalsToString(transactions) },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error };
  }
});

export const getIcoPhases = cache(async () => {
  try {
    const sales = await prisma.sale.findMany({
      where: {
        status: {
          in: [SaleStatus.OPEN, SaleStatus.CREATED, SaleStatus.FINISHED],
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        saleStartDate: true,
        saleClosingDate: true,
        tokenPricePerUnit: true,
        initialTokenQuantity: true,
        availableTokenQuantity: true,
        tokenSymbol: true,
      },
      orderBy: {
        saleStartDate: 'asc',
      },
    });
    return { data: { sales: decimalsToString(sales) }, error: null };
  } catch (error) {
    return { data: null, error: error };
  }
});
