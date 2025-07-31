import BackgroundWrapper from '@/components/bg-wrapper';
import { UserTransactions } from '@/components/transactions';
import { getUserTransactions } from '@/lib/services/fetchers-server';
import { cn } from '@mjs/ui/lib/utils';
import { QueryClient } from '@tanstack/react-query';

export default async function TransactionsPage(_props: PageProps) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['transactions', 'user', 'me', {}],
    // TODO! change for fetching of actual transactions of the current user
    queryFn: () => getUserTransactions(),
  });

  return (
    <BackgroundWrapper>
      <main className={cn('mx-auto p-6')}>
        <UserTransactions />
      </main>
    </BackgroundWrapper>
  );
}
