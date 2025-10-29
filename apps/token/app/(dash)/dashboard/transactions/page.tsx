import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { UserTransactions } from "@/components/transactions";
import { getUserTransactions } from "@/lib/services/fetchers.server";

export default async function TransactionsPage(_props: PageProps) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["transactions", "user", "me", {}],
    queryFn: () => getUserTransactions(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserTransactions />
    </HydrationBoundary>
  );
}

export const dynamic = "force-dynamic";
