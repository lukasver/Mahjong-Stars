import { getGlassyCardClassName } from '@mjs/ui/components/cards';
import { Card } from '@mjs/ui/primitives/card';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import { Calendar, ChevronDown } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className='min-h-screen p-6'>
      <div className='mx-auto max-w-7xl space-y-6'>
        {/* Progress Steps */}
        <Card className={getGlassyCardClassName('rounded-2xl border p-6')}>
          <div className='w-full py-4 sm:py-6 max-w-[350px] scrollbar-hidden sm:max-w-none'>
            <div className='flex items-center justify-between px-2 sm:px-4 py-2'>
              {/* Step 1 - Create (Active) */}
              <div className='flex not-last:flex-1 items-center'>
                <div className='flex flex-col items-center'>
                  <div className='flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 border-primary bg-background'>
                    <span className='text-xs sm:text-sm font-semibold text-primary'>
                      1
                    </span>
                  </div>
                  <div className='mt-1 sm:mt-2 text-center'>
                    <Skeleton className='h-3 w-16 mb-1 sm:h-4 sm:w-16' />
                    <Skeleton className='h-2 w-20 sm:h-3 sm:w-20' />
                  </div>
                </div>
                {/* Progress Line 1 */}
                <div className='flex-1 mx-2 sm:mx-4 lg:mx-8 min-w-[20px] sm:min-w-[40px] lg:min-w-[60px]'>
                  <div className='h-0.5 w-full bg-muted'></div>
                </div>
              </div>

              {/* Step 2 - Contract */}
              <div className='flex not-last:flex-1 items-center'>
                <div className='flex flex-col items-center'>
                  <div className='flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-muted'>
                    <span className='text-xs sm:text-sm font-semibold text-muted-foreground'>
                      2
                    </span>
                  </div>
                  <div className='mt-1 sm:mt-2 text-center'>
                    <Skeleton className='h-3 w-16 mb-1 sm:h-4 sm:w-16' />
                    <Skeleton className='h-2 w-20 sm:h-3 sm:w-20' />
                  </div>
                </div>
                {/* Progress Line 2 */}
                <div className='flex-1 mx-2 sm:mx-4 lg:mx-8 min-w-[20px] sm:min-w-[40px] lg:min-w-[60px]'>
                  <div className='h-0.5 w-full bg-muted'></div>
                </div>
              </div>

              {/* Step 3 - Payment */}
              <div className='flex not-last:flex-1 items-center'>
                <div className='flex flex-col items-center'>
                  <div className='flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-muted'>
                    <span className='text-xs sm:text-sm font-semibold text-muted-foreground'>
                      3
                    </span>
                  </div>
                  <div className='mt-1 sm:mt-2 text-center'>
                    <Skeleton className='h-3 w-16 mb-1 sm:h-4 sm:w-16' />
                    <Skeleton className='h-2 w-20 sm:h-3 sm:w-20' />
                  </div>
                </div>
                {/* Progress Line 3 */}
                <div className='flex-1 mx-2 sm:mx-4 lg:mx-8 min-w-[20px] sm:min-w-[40px] lg:min-w-[60px]'>
                  <div className='h-0.5 w-full bg-muted'></div>
                </div>
              </div>

              {/* Step 4 - Additional Information */}
              <div className='flex items-center'>
                <div className='flex flex-col items-center'>
                  <div className='flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-muted'>
                    <span className='text-xs sm:text-sm font-semibold text-muted-foreground'>
                      4
                    </span>
                  </div>
                  <div className='mt-1 sm:mt-2 text-center'>
                    <Skeleton className='h-3 w-16 mb-1 sm:h-4 sm:w-24' />
                    <Skeleton className='h-2 w-20 sm:h-3 sm:w-16' />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Basic Information Form */}
        <Card className={getGlassyCardClassName('rounded-2xl border p-6')}>
          <div className='mb-6'>
            <Skeleton className='h-8 w-48 mb-2' />
            <Skeleton className='h-4 w-64' />
          </div>

          {/* Form Fields Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8'>
            {/* Left Column */}
            <div className='space-y-6'>
              {/* Name Field */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-12' />
                <div className='h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse'></div>
                <Skeleton className='h-3 w-48' />
              </div>

              {/* Token Symbol Field */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <div className='h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse'></div>
                <Skeleton className='h-3 w-52' />
              </div>

              {/* Blockchain Dropdown */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <div className='relative'>
                  <div className='h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse flex items-center justify-between px-3'>
                    <Skeleton className='h-4 w-24' />
                    <ChevronDown className='h-4 w-4 text-muted-foreground' />
                  </div>
                </div>
                <Skeleton className='h-3 w-56' />
              </div>

              {/* Currency Dropdown */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-16' />
                <div className='relative'>
                  <div className='h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse flex items-center justify-between px-3'>
                    <Skeleton className='h-4 w-20' />
                    <ChevronDown className='h-4 w-4 text-muted-foreground' />
                  </div>
                </div>
                <Skeleton className='h-3 w-64' />
              </div>

              {/* Sale Start Date */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-28' />
                <div className='relative'>
                  <div className='h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse flex items-center justify-between px-3'>
                    <Skeleton className='h-4 w-24' />
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                  </div>
                </div>
                <Skeleton className='h-3 w-36' />
              </div>
            </div>

            {/* Right Column */}
            <div className='space-y-6'>
              {/* Token Name Field */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <div className='h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse'></div>
                <Skeleton className='h-3 w-60' />
              </div>

              {/* Contract Address Field */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-32' />
                <div className='h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse'></div>
                <Skeleton className='h-3 w-44' />
              </div>

              {/* Price per Unit Field */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <div className='h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse'></div>
                <Skeleton className='h-3 w-68' />
              </div>

              {/* Wallet Address Field */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-28' />
                <div className='h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse'></div>
                <Skeleton className='h-3 w-72' />
              </div>

              {/* Sale Closing Date */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-32' />
                <div className='relative'>
                  <div className='h-12 w-full rounded-lg border bg-secondary-700/50 animate-pulse flex items-center justify-between px-3'>
                    <Skeleton className='h-4 w-24' />
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                  </div>
                </div>
                <Skeleton className='h-3 w-40' />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-between pt-8'>
            <Skeleton className='h-10 w-20' />
            <Skeleton className='h-10 w-20' />
          </div>
        </Card>
      </div>
    </div>
  );
}
