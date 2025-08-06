import ErrorBoundary from '@mjs/ui/components/error-boundary';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { ComingSoon } from '../../../../components/coming-soon';
import { TokenSale } from './sale';
import { getActiveSale } from '@/lib/services/fetchers.server';

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
        <TokenSale />
      </ErrorBoundary>
    </HydrationBoundary>
  );
}

export const dynamic = 'force-dynamic';
