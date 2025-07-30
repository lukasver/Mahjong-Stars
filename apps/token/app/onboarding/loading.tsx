import BackgroundWrapper from '@/components/bg-wrapper';
import { getGlassyCardClassName } from '@mjs/ui/components/cards';
import { Skeleton } from '@mjs/ui/primitives/skeleton';

function loading() {
  return (
    <BackgroundWrapper className={'size-full'}>
      <div className='grid min-h-[100dvh] grid-rows-[auto_1fr_auto]'>
        <header className='invisible'>a</header>
        <main className='container mx-auto grid place-items-center bg-cover bg-center relative z-20'>
          <div className='w-full max-w-md mx-auto sm:min-w-[385px]'>
            <div
              className={getGlassyCardClassName(
                'rounded-2xl border p-6 shadow'
              )}
            >
              {/* Card Header */}
              <div className='space-y-4 mb-6'>
                {/* Title */}
                <Skeleton className='h-8 w-32' />

                {/* Description */}
                <Skeleton className='h-4 w-full' />
              </div>

              {/* Form Section */}
              <div className='space-y-4 mb-6'>
                {/* Field Label */}
                <Skeleton className='h-4 w-28' />

                {/* Input Field */}
                <Skeleton className='h-12 w-full rounded-lg' />
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3'>
                {/* Cancel Button */}
                <Skeleton className='h-12 flex-1 rounded-lg' />

                {/* Continue Button */}
                <Skeleton className='h-12 flex-1 rounded-lg' />
              </div>
            </div>
          </div>
        </main>
        <footer className='invisible'>a</footer>
      </div>
    </BackgroundWrapper>
  );
}

export default loading;
