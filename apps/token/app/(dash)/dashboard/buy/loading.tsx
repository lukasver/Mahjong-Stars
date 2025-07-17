import { CardContent, CardHeader, Card } from '@mjs/ui/primitives/card';
import { Skeleton } from '@mjs/ui/primitives/skeleton';

export default function Loading() {
  return (
    <div className='min-h-screen'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header Loading */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center gap-2 mb-4'>
            <Skeleton className='h-8 w-8 rounded-full bg-slate-700' />
            <Skeleton className='h-10 w-64 bg-slate-700' />
          </div>
          <Skeleton className='h-6 w-96 mx-auto bg-slate-700' />
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Content - Main Image and Information */}
          <div className='lg:col-span-2'>
            <Card className='bg-slate-800/50 border-slate-700'>
              <CardContent className='p-0'>
                {/* Main Image Loading */}
                <div className='relative'>
                  <Skeleton className='w-full h-64 bg-slate-700' />
                </div>

                {/* Tabs Loading */}
                <div className='p-6'>
                  <div className='flex space-x-1 mb-6'>
                    <Skeleton className='h-10 w-32 bg-slate-600' />
                    <Skeleton className='h-10 w-36 bg-slate-700' />
                    <Skeleton className='h-10 w-28 bg-slate-700' />
                  </div>

                  {/* Expandable Sections Loading */}
                  <div className='space-y-4'>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className='border-b border-slate-600 pb-4'
                      >
                        <div className='flex items-center justify-between mb-3'>
                          <Skeleton className='h-6 w-48 bg-slate-600' />
                          <Skeleton className='h-4 w-4 bg-slate-600' />
                        </div>
                        {index === 0 && (
                          <div className='space-y-2'>
                            <Skeleton className='h-4 w-full bg-slate-700' />
                            <Skeleton className='h-4 w-full bg-slate-700' />
                            <Skeleton className='h-4 w-3/4 bg-slate-700' />
                            <div className='mt-4 space-y-2'>
                              <Skeleton className='h-4 w-full bg-slate-700' />
                              <Skeleton className='h-4 w-full bg-slate-700' />
                              <Skeleton className='h-4 w-5/6 bg-slate-700' />
                            </div>
                            <div className='mt-4 space-y-2'>
                              <Skeleton className='h-4 w-full bg-slate-700' />
                              <Skeleton className='h-4 w-2/3 bg-slate-700' />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Overview Section Loading */}
            <Card className='bg-slate-800/50 border-slate-700'>
              <CardHeader>
                <Skeleton className='h-7 w-24 bg-slate-600' />
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Tokens Available */}
                <div className='flex justify-between items-center'>
                  <Skeleton className='h-4 w-32 bg-slate-700' />
                  <Skeleton className='h-4 w-20 bg-slate-600' />
                </div>

                {/* Progress Bar */}
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <Skeleton className='h-3 w-16 bg-slate-700' />
                  </div>
                  <Skeleton className='h-2 w-full bg-slate-700' />
                  <div className='flex justify-between'>
                    <Skeleton className='h-3 w-20 bg-slate-700' />
                    <Skeleton className='h-3 w-16 bg-slate-700' />
                  </div>
                </div>

                {/* Token Details */}
                <div className='space-y-3 pt-4'>
                  {[
                    { label: 'Name', width: 'w-32' },
                    { label: 'Symbol', width: 'w-12' },
                    { label: 'Total supply', width: 'w-20' },
                    { label: 'Sale starts', width: 'w-24' },
                    { label: 'Sale ends', width: 'w-24' },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className='flex justify-between items-center'
                    >
                      <Skeleton className='h-4 w-24 bg-slate-700' />
                      <Skeleton className={`h-4 ${item.width} bg-slate-600`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Invest Section Loading */}
            <Card className='bg-slate-800/50 border-slate-700'>
              <CardHeader>
                <Skeleton className='h-7 w-16 bg-slate-600' />
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Wallet Address */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-28 bg-slate-700' />
                  <Skeleton className='h-10 w-full bg-slate-700' />
                </div>

                {/* Token Amount */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24 bg-slate-700' />
                  <Skeleton className='h-10 w-full bg-slate-700' />
                </div>

                {/* Amount */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-16 bg-slate-700' />
                  <Skeleton className='h-10 w-full bg-slate-700' />
                </div>

                {/* Payment Method */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-32 bg-slate-700' />
                  <Skeleton className='h-10 w-full bg-slate-700' />
                </div>

                {/* Purchase Button */}
                <Skeleton className='h-12 w-full bg-slate-600 mt-6' />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
