import { FundraisingProgressLoading } from '@/components/skeletons/fundraising-progress-loading';
import { TokenDetails } from '@/components/token-details';
import { VisuallyHidden } from '@mjs/ui/primitives/visually-hidden';
import { QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { FundraisingProgress } from '../../../components/dashboard/fundraising-progress';
import { IcoPhases } from '../../../components/dashboard/ico-phases';
import { RecentTransactions } from '../../../components/dashboard/recent-transactions';
import { TokenMetrics } from '../../../components/dashboard/token-metrics';
import { TokenStats } from '../../../components/dashboard/token-stats';
import { getActiveSale } from '@/lib/actions';
import { cn } from '@mjs/ui/lib/utils';

export default async function DashboardPage(_props: PageProps) {
  const queryClient = new QueryClient();
  queryClient.prefetchQuery({
    queryKey: ['sales', 'active'],
    queryFn: () => getActiveSale(),
  });

  // const t = await getTranslations();

  return (
    <main
      className={cn(
        'bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center w-full h-full'
      )}
    >
      <div
        className={cn(
          'p-4 relative mx-auto max-w-7xl space-y-8',
          'bg-gradient-to-b from-primary to-5% to-transparent'
        )}
      >
        <VisuallyHidden>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Dashboard
          </h1>
        </VisuallyHidden>
        <Suspense fallback={<div>Loading tdrsc...</div>}>
          <TokenDetails />
        </Suspense>

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

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <TokenStats address={'0x8699210141B710c46eC211cDD39D2C2edDA7A63c'} />
        </div>

        <div className='grid gap-6 lg:grid-cols-2'>
          <TokenMetrics />
          <IcoPhases />
        </div>

        <RecentTransactions />
      </div>
      {/* <Image
        src='/static/images/bg2.webp'
        alt=''
        priority
        fill
        sizes='100vw'
        style={{
          objectFit: 'cover',
          zIndex: -1,
        }}
      /> */}
    </main>
  );
}
