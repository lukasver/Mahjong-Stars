import { DashboardCard } from './dashboard-card';

interface DashboardCardErrorProps {
  title: string;
  fallbackValue?: string;
}

/**
 * Error component for dashboard cards when data fetching fails
 */
export function DashboardCardError({
  title,
  fallbackValue = '0',
}: DashboardCardErrorProps) {
  return <DashboardCard title={title} value={fallbackValue} />;
}
