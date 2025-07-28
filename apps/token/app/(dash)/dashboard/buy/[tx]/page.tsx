import { getCurrentUser, getTransactionById } from '@/lib/actions';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { cn } from '@mjs/ui/lib/utils';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { TransactionConfirmation } from './confirmation';
import {
  KycStatusSchema,
  TransactionStatusSchema,
} from '@/common/schemas/generated';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { VerifyMandatoryEmail } from '@/components/buy/verify-mandatory-email';
import { TransactionStatus } from '@prisma/client';

const idGen = () => {
  let id = 1;
  return () => {
    return id++;
  };
};

const STEP_NAMES = {
  KYC: 'KYC',
  SAFT: 'SAFT',
  Payment: 'Payment',
  Confirmation: 'Confirmation',
} as const;

const getSteps = (
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  {
    requiresKYC,
    requiresSAFT,
  }: {
    requiresKYC?: boolean;
    requiresSAFT?: boolean;
  }
) => {
  const id = idGen();

  const steps: { id: number; name: string; description: string }[] = [];

  const kyc = user?.data?.kycVerification?.status;
  // If sale requires KYC and user has not done it, then add the step
  if (
    (!kyc ||
      [
        KycStatusSchema.enum.NOT_STARTED,
        KycStatusSchema.enum.REJECTED,
      ].includes(kyc)) &&
    !!requiresKYC
  ) {
    steps.push({
      id: id(),
      name: STEP_NAMES.KYC,
      description: 'KYC',
    });
  }
  if (requiresSAFT) {
    steps.push({
      id: id(),
      name: STEP_NAMES.SAFT,
      description: 'SAFT',
    });
  }

  return steps.concat([
    { id: id(), name: STEP_NAMES.Payment, description: 'Payment' },
    { id: id(), name: STEP_NAMES.Confirmation, description: 'Confirmation' },
  ]);
};

export default async function TransactionConfiramationPage({
  params,
}: PageProps<{ tx: string }>) {
  const queryClient = new QueryClient();
  const [p, user] = await Promise.all([params, getCurrentUser()]);
  const tx = await getTransactionById({ id: p.tx });

  // Needs a suspense wrapper (loading.tsx here)
  queryClient.prefetchQuery({
    queryKey: ['transactions', p.tx],
    queryFn: () => {
      return tx;
    },
  });

  if (!tx?.data) {
    notFound();
  }

  const requiresKYC = tx?.data?.requiresKYC;
  const requiresSAFT = tx?.data?.requiresSAFT;
  const steps = getSteps(user, {
    requiresKYC,
    requiresSAFT,
  });
  const status = tx.data.transaction.status;
  if (
    status === TransactionStatusSchema.enum.CANCELLED ||
    status === 'REJECTED'
  ) {
    redirect(`/dashboard/buy/${tx.data.transaction.id}/failure`);
  }
  if (status === TransactionStatusSchema.enum.PAYMENT_SUBMITTED) {
    redirect(`/dashboard/buy/${tx.data.transaction.id}/pending`);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<div>Error</div>}>
        <main
          className={cn(
            'bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center -z-50!'
          )}
        >
          <div className='relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary before:to-5% before:to-transparent before:pointer-events-none before:-z-40'>
            <div className='container mx-auto z-10'>
              <Suspense fallback={null} key={steps.length}>
                <TransactionConfirmation
                  steps={steps}
                  initialStep={getInitialStep(
                    tx.data.transaction.status,
                    steps
                  )}
                />
              </Suspense>
            </div>
          </div>
        </main>
        {(!user?.data?.emailVerified || !user?.data?.email) && (
          <VerifyMandatoryEmail email={user?.data?.email || ''} />
        )}
      </ErrorBoundary>
    </HydrationBoundary>
  );
}

const getInitialStep = (
  status: TransactionStatus,
  steps: { id: number; name: string; description: string }[]
) => {
  const defaultStep = steps[0]!;
  switch (status) {
    case TransactionStatusSchema.enum.AWAITING_PAYMENT:
      return steps.find((s) => s.name === STEP_NAMES.Payment) || defaultStep;
    case TransactionStatusSchema.enum.PAYMENT_VERIFIED:
      return (
        steps.find((s) => s.name === STEP_NAMES.Confirmation) || defaultStep
      );
    default:
      return defaultStep;
  }
};
