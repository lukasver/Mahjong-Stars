import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import AdminTransactions from "@/components/admin/transactions";
import { getAllTransactions } from "@/lib/services/fetchers.server";


export default async function AdminTransactionsPage({
  searchParams,
}: PageProps<'/admin/transactions'>) {
  const queryClient = new QueryClient();
  const query = await searchParams;
  const saleId = query.saleId;
  const userId = query.userId;
  await queryClient.prefetchQuery({
    queryKey: ["transactions", "admin", saleId, userId],
    queryFn: () =>
      getAllTransactions({
        saleId: saleId as string | undefined,
        userId: userId as string | undefined,
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminTransactions
        saleId={saleId as string | undefined}
        userId={userId as string | undefined}
      />
    </HydrationBoundary>
  );
}

export const dynamic = "force-dynamic";
