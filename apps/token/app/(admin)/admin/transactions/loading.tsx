import { Button } from '@mjs/ui/primitives/button';
import { Card, CardContent, CardHeader } from '@mjs/ui/primitives/card';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mjs/ui/primitives/table';
import { Badge } from '@mjs/ui/primitives/badge';
import { ChevronDown } from 'lucide-react';
import { getGlassyCardClassName } from '@mjs/ui/components/cards';

export default function TransactionsLoading() {
  return (
    <div className='w-full max-w-7xl mx-auto p-4 space-y-4'>
      {/* Header Card */}
      <Card className={getGlassyCardClassName()}>
        <CardHeader className='pb-4'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <Skeleton className='h-8 w-32' />
              <Skeleton className='h-4 w-80' />
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-green-500'></div>
              <Badge variant='secondary' className='bg-muted/50'>
                <Skeleton className='h-4 w-48' />
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Table Card */}
      <Card className={getGlassyCardClassName()}>
        <CardContent className='p-0'>
          {/* Columns dropdown */}
          <div className='flex justify-end p-4 pb-0'>
            <Button variant='outline' disabled className='bg-muted/50'>
              <Skeleton className='h-4 w-16 mr-2' />
              <ChevronDown className='h-4 w-4 opacity-50' />
            </Button>
          </div>

          {/* Table */}
          <div className='p-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className='h-4 w-12' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-8' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-12' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-20' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-20' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-12' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-16' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-16' />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Loading rows */}
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className='h-4 w-20' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-16' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-12' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-28' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-6 w-16 rounded-full' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-20' />
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-1'>
                        <Skeleton className='h-6 w-6 rounded' />
                        <Skeleton className='h-6 w-6 rounded' />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-between px-4 py-3 border-t'>
            <Skeleton className='h-4 w-32' />
            <div className='flex gap-2'>
              <Button variant='outline' disabled className='bg-muted/50'>
                <Skeleton className='h-4 w-16' />
              </Button>
              <Button variant='outline' disabled className='bg-muted/50'>
                <Skeleton className='h-4 w-8' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
