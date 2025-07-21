import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { cn } from '@mjs/ui/lib/utils';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

export default async function TransactionConfiramationPage({
  params,
}: PageProps<{ tx: string }>) {
  const queryClient = new QueryClient();
  const p = await params;

  // Needs a suspense wrapper (loading.tsx here)
  queryClient.prefetchQuery({
    queryKey: ['transactions', p.tx],
    queryFn: () => getTransactionById(p.tx),
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<div>Error</div>}>
        <main
          className={cn(
            'bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center -z-50!'
          )}
        >
          <div className='relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-primary before:to-5% before:to-transparent before:pointer-events-none before:-z-40'>
            <div className='container mx-auto z-10'></div>
          </div>
        </main>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
