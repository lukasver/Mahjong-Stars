import {
  getCurrentUser,
  getUserTransactions,
} from '@/lib/services/fetchers-server';
import { DashboardCard } from './dashboard-card';
import { DashboardCardError } from './dashboard-card-error';
import { TransactionStatus } from '@prisma/client';

/**
 * Server component that fetches and displays the user's token balance
 */
export async function UserTokensCard() {
  try {
    const { data: user, error } = await getCurrentUser();

    if (error || !user) {
      return <DashboardCardError title='Your tokens' />;
    }

    // Get user's transactions to calculate token balance
    const { data: transactions, error: transactionsError } =
      await getUserTransactions();

    if (transactionsError || !transactions) {
      return <DashboardCardError title='Your tokens' />;
    }

    // Calculate total tokens purchased from confirmed transactions
    const userTokens = transactions.transactions.reduce(
      (total, transaction) => {
        if (
          [
            TransactionStatus.COMPLETED,
            TransactionStatus.PAYMENT_VERIFIED,
            TransactionStatus.TOKENS_DISTRIBUTED,
          ].includes(transaction.status)
        ) {
          return total + parseFloat(transaction.quantity.toString() || '0');
        }
        return total;
      },
      0
    );

    return (
      <DashboardCard title='Your tokens' value={userTokens.toLocaleString()} />
    );
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return <DashboardCardError title='Your tokens' />;
  }
}
