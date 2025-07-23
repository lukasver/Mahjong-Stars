import { getCurrentUser, getTransactionById } from '@/lib/actions';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { cn } from '@mjs/ui/lib/utils';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { TransactionConfirmation } from './confirmation';
import { KycStatusSchema } from '@/common/schemas/generated';
import { notFound } from 'next/navigation';

const idGen = () => {
  let id = 1;
  return () => {
    return id++;
  };
};

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

  const steps = [];

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
      name: 'KYC',
      description: 'KYC',
    });
  }
  if (requiresSAFT) {
    steps.push({
      id: id(),
      name: 'SAFT',
      description: 'SAFT',
    });
  }

  return steps.concat([
    { id: id(), name: 'Payment', description: 'Payment' },
    { id: id(), name: 'Confirmation', description: 'Confirmation' },
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
              <TransactionConfirmation
                steps={getSteps(user, {
                  requiresKYC,
                  requiresSAFT,
                })}
                initialStep={1}
              />
            </div>
          </div>
        </main>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
