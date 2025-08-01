import { ListSales } from '@/components/admin/list-sales';
import { getSales } from '@/lib/actions';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

export default async function AdminPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['sales'],
    queryFn: () => getSales(undefined),
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListSales
        title='Sales List'
        description='View and manage all token sales'
      />
    </HydrationBoundary>
  );
}
