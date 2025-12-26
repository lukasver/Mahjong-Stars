import { Skeleton } from '@mjs/ui/primitives/skeleton';

export function LargeCardsLoading({ length = 3 }: { length?: number }) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
      {Array.from({ length }).map((_, i) => (
        <TokenStatsLoading key={i} />
      ))}
    </div>
  );
}

export const TokenStatsLoading = () => (
  <div className='bg-card rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4 border border-border'>
    <div className='flex items-center justify-between'>
      <Skeleton className='h-5 sm:h-6 w-20 sm:w-24' />
      <Skeleton className='h-4 sm:h-5 w-4 sm:w-5' />
    </div>
    <div className='space-y-2'>
      <Skeleton className='h-8 sm:h-10 w-16 sm:w-20' />
      <Skeleton className='h-3 sm:h-4 w-12 sm:w-16' />
    </div>
    <div className='flex items-center gap-2 flex-wrap'>
      <Skeleton className='h-3 sm:h-4 w-3 sm:w-4' />
      <Skeleton className='h-3 sm:h-4 w-12 sm:w-16' />
      <Skeleton className='h-3 sm:h-4 w-16 sm:w-20' />
    </div>
  </div>
);
