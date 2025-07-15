'use client';

import { DEFAULT_STALE_TIME } from '@/common/config/constants';
import { Currency } from '@/common/schemas/generated';
import {
  getContract,
  getExchangeRate,
  getInputOptions,
  getPendingTransactions,
  getUserSaleTransactions,
  getUserTransactions,
  getWeb3Contract,
} from '@/lib/actions';
import { FOP, TransactionStatus } from '@prisma/client';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  getActiveSale,
  getCurrentUser,
  getSale,
  getSaleDocuments,
  getSales,
  getSaleSaft,
} from './fetchers';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const getError = (data: any, error: any): string | null => {
  return (
    (error && error?.message) ||
    data?.serverError ||
    //TODO! improve this
    (data?.validationErrors && JSON.stringify(data?.validationErrors)) ||
    null
  );
};

export const useInputOptions = () => {
  const { data, error, ...rest } = useQuery({
    queryKey: ['input', 'options'],
    queryFn: () => getInputOptions(),
  });
  const e = getError(data, error);
  return {
    data: data?.data,
    error: e,
    refetch: rest.refetch,
    isLoading: rest.isLoading,
  };
};

export function useSales() {
  const { data, status, error, refetch } = useSuspenseQuery({
    queryKey: ['sales'],
    queryFn: () => getSales(),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status, refetch };
}

export const useActiveSale = () => {
  const { data, status, error } = useSuspenseQuery({
    queryKey: ['sales', 'active'],
    queryFn: () => getActiveSale(),
    staleTime: DEFAULT_STALE_TIME,
  });

  const e = getError(data, error);
  return { data: data?.data?.sales[0], error: e, status };
};

export const useSale = (id: string | undefined) => {
  const { data, status, error, isLoading } = useSuspenseQuery({
    queryKey: ['sales', id],
    queryFn: ({ queryKey }) => getSale(queryKey[1] as string),
    staleTime: DEFAULT_STALE_TIME,
    // enabled: !!id,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status, isLoading };
};

export const useUser = () => {
  const { data, status, error } = useSuspenseQuery({
    queryKey: ['users', 'me'],
    queryFn: () => getCurrentUser(),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status };
};

export function useWeb3Contract(address: string) {
  const { data, status, error } = useSuspenseQuery({
    queryKey: ['contracts', address],
    queryFn: ({ queryKey }) => getWeb3Contract(queryKey[1] as string),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status };
}

// export const usePendingTransactions = () => {
//   const { data, status, error } = useSuspenseQuery({
//     queryKey: ['transactions', 'pending'],
//     queryFn: () => getPendingTransactions(),
//     staleTime: DEFAULT_STALE_TIME,
//   });
//   const e = getError(data, error);
//   return { data: data?.data, error: e, status };
// };

export const useSaftStatus = () => {
  const { data, status, error } = useSuspenseQuery({
    queryKey: ['safts'],
    queryFn: () => getContract(),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status };
};

export const useTransactions = () => {
  const { data, status, error } = useSuspenseQuery({
    queryKey: ['transactions'],
    queryFn: () => getUserTransactions({}),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status };
};

export const usePendingTransactions = () => {
  const { data, status, error } = useSuspenseQuery({
    queryKey: ['transactions', 'status'],
    queryFn: () => getPendingTransactions(),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status };
};

/**
 * Used to check if there is a pending transaction for current user for a particular sale
 * @param saleId - The ID of the sale to check transactions for
 * @param status - The transaction status to filter by
 */
export const useUserSaleTransactions = (
  saleId: string,
  status?: TransactionStatus
) => {
  const {
    data,
    status: queryStatus,
    error,
  } = useSuspenseQuery({
    queryKey: ['transactions', saleId, status],
    queryFn: ({ queryKey }) =>
      getUserSaleTransactions({
        saleId: queryKey[1] as string,
        status: queryKey[2] as TransactionStatus,
      }),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status: queryStatus };
};

/**
 * Get transactions for a specific user with optional filters
 * @param query - Query parameters for filtering transactions
 * @param query.userId - User ID to get transactions for
 * @param query.formOfPayment - Filter by form of payment
 * @param query.symbol - Filter by token symbol
 * @param query.sale - Filter by sale ID
 */
export const useUserTransactions = (
  params: {
    userId?: string;
    formOfPayment?: FOP;
    symbol?: string;
    sale?: string;
  } = {}
) => {
  const { data, status, error } = useSuspenseQuery({
    queryKey: ['transactions', 'user', params],
    queryFn: ({ queryKey }) =>
      getUserTransactions(queryKey[2] as typeof params),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status };
};

export const useExchangeRate = ({
  from,
  to,
}: {
  from: Currency['symbol'];
  to: Currency['symbol'];
}) => {
  const { data, status, error } = useSuspenseQuery({
    queryKey: ['exchange', 'rate', from, to],
    queryFn: ({ queryKey }) =>
      getExchangeRate({
        from: queryKey[2] as Currency['symbol'],
        to: queryKey[3] as Currency['symbol'],
      }),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status };
};

/**
 * @description NOT SUSPENDED: Clienside ussage only.
 */
export const useSaleSaft = (id: string | undefined) => {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['sale', 'saft', id],
    queryFn: ({ queryKey }) => getSaleSaft(queryKey[2] as string),
    staleTime: DEFAULT_STALE_TIME,
    enabled: !!id,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, isLoading, refetch };
};

/**
 * @description NOT SUSPENDED: Clienside ussage only.
 */
export const useSaleDocuments = (id: string | undefined) => {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['sale', 'documents', id],
    queryFn: ({ queryKey }) => getSaleDocuments(queryKey[2] as string),
    staleTime: DEFAULT_STALE_TIME,
    enabled: !!id,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, isLoading, refetch };
};

/**
 * =====================================
 * =============== ADMIN ===============
 * =====================================
 */

// export const useAdminTransactions = () => {
//   const { data, status, error } = useSuspenseQuery({
//     queryKey: ['admin', 'transactions'],
//     queryFn: () => getAdminTransactions(),
//     staleTime: DEFAULT_STALE_TIME,
//   });
//   const e = getError(data, error);
//   return { data: data?.data, error: e, status };
// };
