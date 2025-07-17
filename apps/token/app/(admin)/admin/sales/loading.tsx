import { Card } from '@mjs/ui/primitives/card';
import { CardContent, CardHeader } from '@mjs/ui/primitives/card';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mjs/ui/primitives/table';

export default function AdminLoading() {
  return <SalesPageLoader />;
}

function SalesPageLoader() {
  return (
    <div className='flex flex-1 flex-col'>
      <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
        <div className='flex flex-1 items-center justify-between'>
          <div className='space-y-1'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-4 w-48' />
          </div>
          <Skeleton className='h-10 w-28 rounded-md' />
        </div>
      </header>

      <main className='flex-1 space-y-4 p-4'>
        {/* Stats Cards Loader */}
        <StatsCardsLoader />

        {/* Main Content Card Loader */}
        <Card>
          <CardHeader>
            <div className='space-y-1'>
              <Skeleton className='h-6 w-24' />
              <Skeleton className='h-4 w-64' />
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters Loader */}
            <SearchAndFiltersLoader />

            {/* Data Table Loader */}
            <DataTableLoader />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatsCardsLoader() {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-4' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-8 w-16 mb-1' />
            <Skeleton className='h-3 w-32' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SearchAndFiltersLoader() {
  return (
    <div className='flex items-center justify-between space-x-2 py-4'>
      <div className='flex items-center space-x-2'>
        <div className='relative'>
          <Skeleton className='h-10 w-[300px] rounded-md' />
        </div>
        <Skeleton className='h-10 w-[180px] rounded-md' />
      </div>
    </div>
  );
}

function DataTableLoader() {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className='h-4 w-20' />
            </TableHead>
            <TableHead>
              <Skeleton className='h-4 w-16' />
            </TableHead>
            <TableHead>
              <Skeleton className='h-4 w-16' />
            </TableHead>
            <TableHead>
              <Skeleton className='h-4 w-12' />
            </TableHead>
            <TableHead>
              <Skeleton className='h-4 w-20' />
            </TableHead>
            <TableHead>
              <Skeleton className='h-4 w-16' />
            </TableHead>
            <TableHead>
              <Skeleton className='h-4 w-20' />
            </TableHead>
            <TableHead>
              <Skeleton className='h-4 w-16' />
            </TableHead>
            <TableHead className='text-right'>
              <Skeleton className='h-4 w-16 ml-auto' />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className='space-y-1'>
                  <Skeleton className='h-4 w-48' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className='h-6 w-16 rounded-full' />
              </TableCell>
              <TableCell>
                <div className='space-y-1'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-3 w-12' />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-20' />
              </TableCell>
              <TableCell>
                <div className='space-y-1'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-3 w-20' />
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center space-x-2'>
                  <Skeleton className='h-2 w-20 rounded-full' />
                  <Skeleton className='h-3 w-10' />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-20' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-20' />
              </TableCell>
              <TableCell className='text-right'>
                <Skeleton className='h-8 w-8 rounded-md ml-auto' />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
