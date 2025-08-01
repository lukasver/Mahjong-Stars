import BackgroundWrapper from '@/components/bg-wrapper';
import AdminTransactions from '@/components/admin/transactions';
import { cn } from '@mjs/ui/lib/utils';
import { QueryClient } from '@tanstack/react-query';
import { getAllTransactions } from '@/lib/services/fetchers-server';

export default async function AdminTransactionsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['transactions', 'admin'],
    queryFn: () => getAllTransactions(),
  });

  return (
    <BackgroundWrapper>
      <main className={cn('mx-auto p-6')}>
        <AdminTransactions />
      </main>
    </BackgroundWrapper>
  );
}
