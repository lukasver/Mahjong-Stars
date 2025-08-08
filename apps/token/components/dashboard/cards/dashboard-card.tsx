import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: ReactNode;
  className?: string;
}

/**
 * Reusable dashboard card component for displaying metrics
 */
export function DashboardCard({
  title,
  value,
  className = '',
}: DashboardCardProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-900 p-2 sm:p-3 ${className}`}
    >
      <div className='text-xs sm:text-sm font-medium text-zinc-400'>
        {title}
      </div>
      <div className='text-lg sm:text-xl font-bold'>{value}</div>
    </div>
  );
}
