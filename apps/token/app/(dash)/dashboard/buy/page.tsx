import { getActiveSale } from '@/lib/actions';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { ComingSoon } from './coming-soon';
import { TokenSale } from './sale';
import { cn } from '@mjs/ui/lib/utils';

export default async function BuyPage() {
  const queryClient = new QueryClient();

  // Needs a suspense wrapper (loading.tsx here)
  queryClient.prefetchQuery({
    queryKey: ['sales', 'active'],
    queryFn: () => getActiveSale(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<ComingSoon />}>
        <main
          className={cn(
            'bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center -z-50!'
          )}
        >
          <div className='relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary before:to-5% before:to-transparent before:pointer-events-none before:-z-40'>
            <div className='container mx-auto z-10'>
              <TokenSale />
            </div>
          </div>
        </main>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
