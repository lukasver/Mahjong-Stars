import { getActiveSale } from '@/lib/services/fetchers-server';
import { DashboardCard } from './dashboard-card';
import { DashboardCardError } from './dashboard-card-error';

/**
 * Server component that fetches and displays the remaining tokens available for sale
 */
export async function RemainingTokensCard() {
  try {
    const { data: activeSale, error } = await getActiveSale();

    if (error || !activeSale?.sales?.[0]) {
      return <DashboardCardError title='Remaining Tokens' />;
    }

    const currentSale = activeSale.sales[0];
    const remainingTokens = parseFloat(
      currentSale.availableTokenQuantity?.toString() || '0'
    );

    // Format the number with K/M suffix for large numbers
    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      }
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
      return num.toLocaleString();
    };

    return (
      <DashboardCard
        title='Remaining Tokens'
        value={formatNumber(remainingTokens)}
      />
    );
  } catch (error) {
    console.error('Error fetching remaining tokens:', error);
    return <DashboardCardError title='Remaining Tokens' />;
  }
}
