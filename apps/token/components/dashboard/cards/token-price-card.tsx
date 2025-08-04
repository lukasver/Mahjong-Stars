import { getActiveSale } from '@/lib/services/fetchers-server';
import { DashboardCard } from './dashboard-card';
import { DashboardCardError } from './dashboard-card-error';

/**
 * Server component that fetches and displays the current token price
 */
export async function TokenPriceCard() {
  try {
    const { data: activeSale, error } = await getActiveSale();

    if (error || !activeSale?.sales?.[0]) {
      return <DashboardCardError title='Token Price' fallbackValue='$0.00' />;
    }

    const currentSale = activeSale.sales[0];
    const tokenPrice = currentSale.tokenPricePerUnit;

    // Format price with 3 decimal places
    const formattedPrice = `$${parseFloat(tokenPrice.toString()).toFixed(3)}`;

    return <DashboardCard title='Token Price' value={formattedPrice} />;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return <DashboardCardError title='Token Price' fallbackValue='$0.00' />;
  }
}
