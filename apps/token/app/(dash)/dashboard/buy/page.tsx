import { getActiveSale } from '@/lib/actions';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { QueryClient } from '@tanstack/react-query';
import { ComingSoon } from './coming-soon';
import { TokenSale } from './sale';
import { Suspense } from 'react';
import Loading from './loading';

export default async function BuyPage() {
  const queryClient = new QueryClient();

  // Needs a suspense wrapper (loading.tsx here)
  queryClient.prefetchQuery({
    queryKey: ['sales', 'active'],
    queryFn: () => getActiveSale(),
  });

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={<ComingSoon />}>
        <TokenSale />
      </ErrorBoundary>
    </Suspense>
  );
}
