import ErrorBoundary from '@mjs/ui/components/error-boundary';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { ComingSoon } from '../../../../components/coming-soon';
import { TokenSale } from './sale';
import BackgroundWrapper from '@/components/bg-wrapper';
import { getActiveSale } from '@/lib/services/fetchers-server';

export default async function BuyPage() {
  const queryClient = new QueryClient();

  // Needs a suspense wrapper (loading.tsx here)
  await queryClient.prefetchQuery({
    queryKey: ['sales', 'active'],
    queryFn: () => getActiveSale(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<ComingSoon />}>
        <BackgroundWrapper>
          <div className='relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary before:to-5% before:to-transparent before:pointer-events-none before:-z-40'>
            <main className='container mx-auto z-10'>
              <TokenSale />
            </main>
          </div>
        </BackgroundWrapper>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
