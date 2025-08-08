import { Skeleton } from '@mjs/ui/primitives/skeleton';

export function MetricCardsLoading({ length = 4 }: { length?: number }) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6'>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className='bg-card rounded-lg p-2 sm:p-3 md:p-4 space-y-2 border border-border'
        >
          <Skeleton className='h-3 sm:h-4 w-16 sm:w-20' />
          <Skeleton className='h-6 sm:h-8 w-12 sm:w-16' />
        </div>
      ))}
    </div>
  );
}
