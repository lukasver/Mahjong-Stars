import { Skeleton } from '@mjs/ui/primitives/skeleton';

export function LargeCardsLoading({ length = 3 }: { length?: number }) {
  return (
    <div className='grid grid-cols-3 gap-6'>
      {Array.from({ length }).map((_, i) => (
        <TokenStatsLoading key={i} />
      ))}
    </div>
  );
}

export const TokenStatsLoading = () => (
  <div className='bg-card rounded-xl p-6 space-y-4 border border-border'>
    <div className='flex items-center justify-between'>
      <Skeleton className='h-6 w-24' />
      <Skeleton className='h-5 w-5' />
    </div>
    <div className='space-y-2'>
      <Skeleton className='h-10 w-20' />
      <Skeleton className='h-4 w-16' />
    </div>
    <div className='flex items-center gap-2'>
      <Skeleton className='h-4 w-4' />
      <Skeleton className='h-4 w-16' />
      <Skeleton className='h-4 w-20' />
    </div>
  </div>
);
