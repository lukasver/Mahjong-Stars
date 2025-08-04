/**
 * Loading skeleton component for dashboard cards
 */
export function DashboardCardLoading() {
  return (
    <div className='rounded-lg border border-zinc-800 bg-zinc-900 p-3'>
      <div className='text-sm font-medium text-zinc-400'>
        <div className='h-4 w-20 animate-pulse rounded bg-zinc-700'></div>
      </div>
      <div className='text-xl font-bold'>
        <div className='h-6 w-16 animate-pulse rounded bg-zinc-700 mt-1'></div>
      </div>
    </div>
  );
}
