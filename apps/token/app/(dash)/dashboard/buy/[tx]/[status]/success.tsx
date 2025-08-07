'use client';
import { useEffect } from 'react';
import { TransactionStatus } from '@prisma/client';

import { SuccessContent } from '@/components/buy/confirmation-steps/success-content';
import { useTransactionById } from '@/lib/services/api';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

/**
 * Success status page for dashboard actions.
 * Shows success message, project name, support email, and transaction link if available.
 */
const Success = () => {
  const { tx } = useParams();
  const { data, isLoading } = useTransactionById(tx as string);
  const router = useRouter();

  useEffect(() => {
    if (
      !isLoading &&
      data?.transaction?.status &&
      ![
        TransactionStatus.AWAITING_PAYMENT,
        TransactionStatus.COMPLETED,
        TransactionStatus.PAYMENT_SUBMITTED,
        TransactionStatus.PAYMENT_VERIFIED,
        TransactionStatus.TOKENS_DISTRIBUTED,
      ].includes(data?.transaction.status as TransactionStatus)
    ) {
      if (data?.transaction.status === TransactionStatus.PENDING) {
        router.replace(`/dashboard/buy/${tx}/pending`);
      } else if (data?.transaction.status === TransactionStatus.COMPLETED) {
        router.replace(`/dashboard/buy/${tx}`);
      } else {
        router.replace(`/dashboard/buy/${tx}/failure`);
      }
    }
  }, [data?.transaction?.status, isLoading]);

  return <SuccessContent className='min-h-[60dvh] grid place-content-center' />;
};

export default Success;
