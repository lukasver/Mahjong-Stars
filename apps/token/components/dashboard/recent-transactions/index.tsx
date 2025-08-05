import { RecentTransactionsError } from './recent-transactions-error';
import { RecentTransactions } from './recent-transactions-client';
import { getRecentTransactions } from '@/lib/services/fetchers-server';

/**
 * Server component that fetches and displays recent transactions
 */
export async function RecentTransactionsSSR() {
  try {
    // Fetch recent transactions with completed status
    const { data } = await getRecentTransactions();

    if (!data || !data?.transactions?.length) {
      return <RecentTransactionsError />;
    }

    return <RecentTransactions transactions={data.transactions} />;
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return <RecentTransactionsError />;
  }
}
