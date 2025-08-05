import { UserTransactions } from '@/components/transactions';
import { getUserTransactions } from '@/lib/services/fetchers-server';
import { QueryClient } from '@tanstack/react-query';

export default async function TransactionsPage(_props: PageProps) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['transactions', 'user', 'me', {}],
    queryFn: () => getUserTransactions(),
  });

  return <UserTransactions />;
}

export const dynamic = 'force-dynamic';
