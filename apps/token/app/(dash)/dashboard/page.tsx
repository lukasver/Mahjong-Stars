import { FundraisingProgressLoading } from '@/components/skeletons/fundraising-progress-loading';
import { TokenDetails } from '@/components/token-details';
import { VisuallyHidden } from '@mjs/ui/primitives/visually-hidden';
import { QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { FundraisingProgress } from '../../../components/dashboard/fundraising-progress';

import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { ComingSoonContent } from '../../../components/coming-soon';
import { FeatureCards } from '@/components/feature-cards';
import { getActiveSale } from '@/lib/services/fetchers-server';
import {
  UserTokensCard,
  TokenHoldersCard,
  TokenPriceCard,
  RemainingTokensCard,
  DashboardCardLoading,
} from '@/components/dashboard/cards';
import { TokenStats } from '@/components/dashboard/token-stats';
import { TokenMetrics } from '@/components/dashboard/token-metrics';
import { IcoPhases } from '@/components/dashboard/ico-phases';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';

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
        <Suspense fallback={<FundraisingProgressLoading />}>
          <FundraisingProgress>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <Suspense fallback={<DashboardCardLoading />}>
                <UserTokensCard />
              </Suspense>
              <Suspense fallback={<DashboardCardLoading />}>
                <TokenHoldersCard />
              </Suspense>
              <Suspense fallback={<DashboardCardLoading />}>
                <TokenPriceCard />
              </Suspense>
              <Suspense fallback={<DashboardCardLoading />}>
                <RemainingTokensCard />
              </Suspense>
            </div>
          </FundraisingProgress>
        </Suspense>
      </ErrorBoundary>

      <FeatureCards />

      <ErrorBoundary fallback={null}>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <TokenStats address={'0x8699210141B710c46eC211cDD39D2C2edDA7A63c'} />
        </div>
      </ErrorBoundary>

      <div className='grid gap-6 lg:grid-cols-2'>
        <TokenMetrics />
        <IcoPhases />
      </div>

      <RecentTransactions />
    </div>
  );
}
