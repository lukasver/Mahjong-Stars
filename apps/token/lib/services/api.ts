'use client';

import { DEFAULT_STALE_TIME } from '@/common/config/constants';
import { Currency } from '@/common/schemas/generated';
import {
  getContract,
  getExchangeRate,
  getInputOptions,
  getTransactionAvailabilityForSale,
  getTransactionById,
  getWeb3Contract,
} from '@/lib/actions';
import { FOP } from '@prisma/client';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  getActiveSale,
  getCurrencies,
  getCurrentUser,
  getRecipientForCurrentTransactionSaft,
  getSaftForTransactionDetails,
  getSale,
  getSaleBanks,
  getSaleDocuments,
  getSaleInvestInfo,
  getSales,
  getSaleSaft,
  getSaleSaftForTransaction,
  getUserPendingTransactionsForSale,
  getUserTransactions,
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

export const useTransactionById = (
  id: string,
  opts: {
    refetchInterval?: number;
    staleTime?: number;
    enabled?: boolean;
  } = {}
) => {
  const { data, status, error, isLoading } = useQuery({
    queryKey: ['transactions', id],
    queryFn: () => getTransactionById({ id }),
    staleTime: DEFAULT_STALE_TIME,
    ...opts,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status, isLoading };
};

export const useTransactionAvailabilityForSale = (
  id: string,
  opts: {
    refetchInterval?: number;
    staleTime?: number;
    enabled?: boolean;
  } = {}
) => {
  const { data, status, error, isLoading } = useQuery({
    queryKey: ['transactions', id, 'availability'],
    //TODO should move to fetcher instead of server action?, we don't want to cache this so for now should be ok
    queryFn: () => getTransactionAvailabilityForSale({ id }),
    staleTime: DEFAULT_STALE_TIME,
    ...opts,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status, isLoading };
};

export const useSaleSaftForTransaction = (txId: string) => {
  const { data, status, error, isLoading } = useQuery({
    queryKey: ['transactions', txId, 'saft'],
    queryFn: () => getSaleSaftForTransaction(txId),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status, isLoading };
};

export const useRecipientForCurrentTransactionSaft = (
  saftContractId: string | undefined
) => {
  const { data, status, error, isLoading } = useQuery({
    queryKey: ['saft', 'recipient', saftContractId],
    queryFn: () => getRecipientForCurrentTransactionSaft(saftContractId!),
    staleTime: DEFAULT_STALE_TIME,
    enabled: !!saftContractId,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status, isLoading };
};

export const usePendingTransactionsForSale = (saleId: string) => {
  const { data, status, error, isLoading } = useQuery({
    queryKey: ['transactions', saleId, 'pending'],
    queryFn: ({ queryKey }) =>
      getUserPendingTransactionsForSale(queryKey[1] as string),
    staleTime: DEFAULT_STALE_TIME,
    enabled: !!saleId,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, status, isLoading: isLoading };
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
    queryKey: ['transactions', 'user', 'me', params],
    queryFn: ({ queryKey }) =>
      getUserTransactions(queryKey[3] as typeof params),
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
    queryKey: ['sales', id, 'saft'],
    queryFn: ({ queryKey }) => getSaleSaft(queryKey[1] as string),
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
    queryKey: ['sales', id, 'documents'],
    queryFn: ({ queryKey }) => getSaleDocuments(queryKey[1] as string),
    staleTime: DEFAULT_STALE_TIME,
    enabled: !!id,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, isLoading, refetch };
};

/**
 * @description NOT SUSPENDED: Clienside ussage only.
 */
export const useSaleInvestInfo = (
  id: string | undefined,
  staleTime = 1000 * 60 * 1
) => {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['sales', id, 'invest'],
    queryFn: ({ queryKey }) => getSaleInvestInfo(queryKey[1] as string),
    staleTime, // Refetch every minute to have updated information
    enabled: !!id,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, isLoading, refetch };
};

/**
 * @description NOT SUSPENDED: Clienside ussage only.
 */
export const useCurrencies = () => {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => getCurrencies(),
    staleTime: DEFAULT_STALE_TIME,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, isLoading, refetch };
};

export const useSaftForTransactionDetails = (
  recipientId: string,
  enabled: boolean = true
) => {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['saft', 'details', recipientId],
    queryFn: () => getSaftForTransactionDetails(recipientId),
    staleTime: 7 * 1000, // 7 seconds
    refetchInterval: 7 * 1000,
    enabled: Boolean(recipientId && enabled),
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, isLoading, refetch };
};

/**
 * =====================================
 * =============== ADMIN ===============
 * =====================================
 */

export const useSaleBanks = (saleId: string) => {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['sales', saleId, 'banks'],
    queryFn: () => getSaleBanks(saleId),
    staleTime: DEFAULT_STALE_TIME,
    enabled: !!saleId,
  });
  const e = getError(data, error);
  return { data: data?.data, error: e, isLoading, refetch };
};

// export const useAdminTransactions = () => {
//   const { data, status, error } = useSuspenseQuery({
//     queryKey: ['admin', 'transactions'],
//     queryFn: () => getAdminTransactions(),
//     staleTime: DEFAULT_STALE_TIME,
//   });
//   const e = getError(data, error);
//   return { data: data?.data, error: e, status };
// };
