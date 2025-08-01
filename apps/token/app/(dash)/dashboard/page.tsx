import { FundraisingProgressLoading } from '@/components/skeletons/fundraising-progress-loading';
import { TokenDetails } from '@/components/token-details';
import { VisuallyHidden } from '@mjs/ui/primitives/visually-hidden';
import { QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { FundraisingProgress } from '../../../components/dashboard/fundraising-progress';

import { cn } from '@mjs/ui/lib/utils';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { ComingSoonContent } from '../../../components/coming-soon';
import { FeatureCards } from '@/components/feature-cards';
import BackgroundWrapper from '@/components/bg-wrapper';
import { getActiveSale } from '@/lib/services/fetchers-server';

export default async function DashboardPage(_props: PageProps) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['sales', 'active'],
    queryFn: () => getActiveSale(),
  });

  return (
    <BackgroundWrapper className='min-h-[80dvh] flex flex-col items-center justify-center'>
      <main
        className={cn('p-4 relative mx-auto max-w-7xl space-y-8 z-10 py-10')}
      >
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
                <div className='rounded-lg border border-zinc-800 bg-zinc-900 p-3'>
                  <div className='text-sm font-medium text-zinc-400'>
                    Your tokens
                  </div>
                  <div className='text-xl font-bold'>0</div>
                </div>
                <div className='rounded-lg border border-zinc-800 bg-zinc-900 p-3'>
                  <div className='text-sm font-medium text-zinc-400'>
                    Token Holders
                  </div>
                  <div className='text-xl font-bold'>6.5M</div>
                </div>
                <div className='rounded-lg border border-zinc-800 bg-zinc-900 p-3'>
                  <div className='text-sm font-medium text-zinc-400'>
                    Token Price
                  </div>
                  <div className='text-xl font-bold'>$0.012</div>
                </div>
                <div className='rounded-lg border border-zinc-800 bg-zinc-900 p-3'>
                  <div className='text-sm font-medium text-zinc-400'>
                    Remaining Tokens
                  </div>
                  <div className='text-xl font-bold'>3.5M</div>
                </div>
              </div>
            </FundraisingProgress>
          </Suspense>
        </ErrorBoundary>

        <FeatureCards />

        {/* <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <TokenStats address={'0x8699210141B710c46eC211cDD39D2C2edDA7A63c'} />
        </div>

        <div className='grid gap-6 lg:grid-cols-2'>
          <TokenMetrics />
          <IcoPhases />
        </div>

        <RecentTransactions /> */}
      </main>
    </BackgroundWrapper>
  );
}
