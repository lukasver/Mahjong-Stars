import { FundraisingProgressLoading } from '@/components/skeletons/fundraising-progress-loading';
import { TokenDetails } from '@/components/token-details';
import { VisuallyHidden } from '@mjs/ui/primitives/visually-hidden';
import { QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { FundraisingProgress } from '../../../components/dashboard/fundraising-progress';
import { getActiveSale } from '@/lib/actions';
import { cn } from '@mjs/ui/lib/utils';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { ComingSoonContent } from './buy/coming-soon';

export default async function DashboardPage(_props: PageProps) {
  const queryClient = new QueryClient();
  queryClient.prefetchQuery({
    queryKey: ['sales', 'active'],
    queryFn: () => getActiveSale(),
  });

  return (
    <main className={cn('relative pb-6')}>
      <div className={cn('p-4 relative mx-auto max-w-7xl space-y-8 z-10')}>
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
            <div className='flex flex-col items-center justify-center min-h-[80dvh] h-full'>
              <ComingSoonContent to={undefined} />
            </div>
          }
        >
          <Suspense fallback={<FundraisingProgressLoading />}>
            <FundraisingProgress>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                <div className='rounded-lg border border-zinc-800 bg-zinc-900 p-3'>
                  <div className='text-sm font-medium text-zinc-400'>
                    Contributors
                  </div>
                  <div className='text-xl font-bold'>1,245</div>
                </div>
                <div className='rounded-lg border border-zinc-800 bg-zinc-900 p-3'>
                  <div className='text-sm font-medium text-zinc-400'>
                    Tokens Sold
                  </div>
                  <div className='text-xl font-bold'>6.5M</div>
                </div>
                <div className='rounded-lg border border-zinc-800 bg-zinc-900 p-3'>
                  <div className='text-sm font-medium text-zinc-400'>
                    Remaining
                  </div>
                  <div className='text-xl font-bold'>3.5M</div>
                </div>
                <div className='rounded-lg border border-zinc-800 bg-zinc-900 p-3'>
                  <div className='text-sm font-medium text-zinc-400'>
                    Token Price
                  </div>
                  <div className='text-xl font-bold'>$0.50</div>
                </div>
              </div>
            </FundraisingProgress>
          </Suspense>
        </ErrorBoundary>

        {/* <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <TokenStats address={'0x8699210141B710c46eC211cDD39D2C2edDA7A63c'} />
        </div>

        <div className='grid gap-6 lg:grid-cols-2'>
          <TokenMetrics />
          <IcoPhases />
        </div>

        <RecentTransactions /> */}
      </div>
      <div
        className={cn(
          'bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center w-full h-full -z-50!',
          'size-full absolute inset-0'
        )}
      >
        <div className='absolute inset-0 bg-gradient-to-b from-primary to-5% to-transparent' />
      </div>
    </main>
  );
}
