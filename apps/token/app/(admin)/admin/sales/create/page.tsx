import { CreateSaleForm } from '@/components/admin/create-sales';
import { getSale } from '@/lib/actions';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

export default async function AdminPage({ params, searchParams }: PageProps) {
  const [_, { saleId }] = await Promise.all([params, searchParams]);

  const queryClient = new QueryClient();
  if (saleId) {
    // If we have info about the sale in the params, prefetch it
    await queryClient.prefetchQuery({
      queryKey: ['sales', saleId],
      queryFn: ({ queryKey }) => getSale({ id: queryKey[1] as string }),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CreateSaleForm />
    </HydrationBoundary>
  );
}
