import AdminTransactions from '@/components/admin/transactions';
import { QueryClient } from '@tanstack/react-query';
import { getAllTransactions } from '@/lib/services/fetchers-server';

export default async function AdminTransactionsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['transactions', 'admin'],
    queryFn: () => getAllTransactions(),
  });

  return <AdminTransactions />;
}
