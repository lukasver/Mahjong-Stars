import { TransactionStatus } from '@prisma/client';
import { DashboardCard } from './dashboard-card';
import { DashboardCardError } from './dashboard-card-error';
import { getUserTransactions } from '@/lib/services/fetchers-server';

/**
 * Server component that fetches and displays the total number of token holders
 */
export async function UnconfirmedTokensCard() {
  try {
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
            TransactionStatus.AWAITING_PAYMENT,
            TransactionStatus.PAYMENT_SUBMITTED,
            TransactionStatus.PENDING,
          ].includes(transaction.status)
        ) {
          return total + parseFloat(transaction.quantity.toString() || '0');
        }
        return total;
      },
      0
    );

    return (
      <DashboardCard
        title='Your unconfirmed tokens'
        value={userTokens.toLocaleString()}
      />
    );
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return <DashboardCardError title='Your tokens' />;
  }
}
