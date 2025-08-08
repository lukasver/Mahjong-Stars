import { TokenDetails } from '@/components/token-details';
import { VisuallyHidden } from '@mjs/ui/primitives/visually-hidden';
import { QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { FundraisingProgress } from '../../../components/dashboard/fundraising-progress';

import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { ComingSoonContent } from '../../../components/coming-soon';
import { FeatureCards } from '@/components/feature-cards';
import { getActiveSale } from '@/lib/services/fetchers.server';
import {
  UserTokensCard,
  UnconfirmedTokensCard,
  TokenPriceCard,
  RemainingTokensCard,
  DashboardCardLoading,
} from '@/components/dashboard/cards';
import {
  IcoPhasesLoading,
  RecentTransactionsLoading,
} from '@/components/dashboard/loading-components';
import { IcoPhasesSSR } from '@/components/dashboard/ico-phases';
import { RecentTransactionsSSR } from '@/components/dashboard/recent-transactions';

export default async function DashboardPage(_props: PageProps) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['sales', 'active'],
    queryFn: () => getActiveSale(),
  });

  return (
    <div className='flex flex-col gap-4 sm:gap-8'>
      <VisuallyHidden>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Dashboard
        </h1>
      </VisuallyHidden>
      <Suspense fallback={null}>
        <TokenDetails />
      </Suspense>

      <ErrorBoundary
        fallback={
          <div className='py-6'>
            <ComingSoonContent to={undefined} />
          </div>
        }
      >
        {/* <Suspense fallback={<FundraisingProgressLoading />}> */}
        <FundraisingProgress>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4'>
            <Suspense fallback={<DashboardCardLoading />}>
              <UserTokensCard />
            </Suspense>
            <Suspense fallback={<DashboardCardLoading />}>
              <UnconfirmedTokensCard />
            </Suspense>
            <Suspense fallback={<DashboardCardLoading />}>
              <TokenPriceCard />
            </Suspense>
            <Suspense fallback={<DashboardCardLoading />}>
              <RemainingTokensCard />
            </Suspense>
          </div>
        </FundraisingProgress>
        {/* </Suspense> */}
      </ErrorBoundary>

      {/* <ErrorBoundary fallback={null}>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <Suspense fallback={null}>
            <TokenStats />
          </Suspense>
        </div>
      </ErrorBoundary> */}

      <div className='grid gap-4 sm:gap-6 lg:grid-cols-2'>
        {/* <TokenMetrics /> */}
        <Suspense fallback={<RecentTransactionsLoading />}>
          <RecentTransactionsSSR />
        </Suspense>
        <Suspense fallback={<IcoPhasesLoading />}>
          <IcoPhasesSSR />
        </Suspense>
      </div>
      <FeatureCards />
    </div>
  );
}

export const dynamic = 'force-dynamic';
