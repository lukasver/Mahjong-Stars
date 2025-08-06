import AdminTransactions from '@/components/admin/transactions';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getAllTransactions } from '@/lib/services/fetchers.server';

export default async function AdminTransactionsPage({
  searchParams,
}: PageProps) {
  const queryClient = new QueryClient();
  const query = await searchParams;
  const saleId = query.saleId;
  await queryClient.prefetchQuery({
    queryKey: ['transactions', 'admin', saleId],
    queryFn: () => getAllTransactions({ saleId: saleId as string | undefined }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminTransactions saleId={saleId as string | undefined} />
    </HydrationBoundary>
  );
}

export const dynamic = 'force-dynamic';
