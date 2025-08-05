import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';

/**
 * Loading component for ICO phases
 */
export function IcoPhasesLoading() {
  return (
    <Card className='border-zinc-800 bg-zinc-900/50'>
      <CardHeader>
        <CardTitle>ICO Phases</CardTitle>
        <CardDescription>Token sale schedule and pricing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          <div className='relative space-y-5'>
            <div className='absolute left-3 top-0 h-full w-px bg-zinc-800' />
            {[1, 2, 3].map((i) => (
              <div key={i} className='relative pl-8'>
                <div className='absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900'>
                  <div className='h-2 w-2 rounded-full bg-zinc-700' />
                </div>
                <div className='space-y-2'>
                  <div className='h-4 w-32 animate-pulse rounded bg-zinc-700' />
                  <div className='h-3 w-48 animate-pulse rounded bg-zinc-700' />
                  <div className='h-3 w-40 animate-pulse rounded bg-zinc-700' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading component for recent transactions
 */
export function RecentTransactionsLoading() {
  return (
    <Card className='border-zinc-800 bg-zinc-900/50'>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest token purchases and sales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='rounded-md border border-zinc-800'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-zinc-800 bg-zinc-950/50'>
                    <th className='px-4 py-3 text-left font-medium'>Amount</th>
                    <th className='px-4 py-3 text-left font-medium'>Value</th>
                    <th className='px-4 py-3 text-left font-medium'>Wallet</th>
                    <th className='px-4 py-3 text-left font-medium'>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr
                      key={i}
                      className='border-b border-zinc-800 last:border-0'
                    >
                      <td className='px-4 py-3'>
                        <div className='h-4 w-20 animate-pulse rounded bg-zinc-700' />
                      </td>
                      <td className='px-4 py-3'>
                        <div className='h-4 w-16 animate-pulse rounded bg-zinc-700' />
                      </td>
                      <td className='px-4 py-3'>
                        <div className='h-4 w-24 animate-pulse rounded bg-zinc-700' />
                      </td>
                      <td className='px-4 py-3'>
                        <div className='h-4 w-20 animate-pulse rounded bg-zinc-700' />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
