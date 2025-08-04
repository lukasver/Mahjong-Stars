import { prisma } from '@/db';
import { DashboardCard } from './dashboard-card';
import { DashboardCardError } from './dashboard-card-error';

/**
 * Server component that fetches and displays the total number of token holders
 */
export async function TokenHoldersCard() {
  try {
    // Count unique users who have completed transactions
    const uniqueUsers = await prisma.saleTransactions.findMany({
      where: {
        status: 'COMPLETED', // Only count completed transactions
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const tokenHoldersCount = uniqueUsers.length;

    // Format the number with K/M suffix for large numbers
    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      }
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
      return num.toString();
    };

    return (
      <DashboardCard
        title='Token Holders'
        value={formatNumber(tokenHoldersCount)}
      />
    );
  } catch (error) {
    console.error('Error fetching token holders:', error);
    return <DashboardCardError title='Token Holders' />;
  }
}
