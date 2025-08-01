'use client';
import { useState } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { DataTable } from '@mjs/ui/primitives/data-table';
import { getGlassyCardClassName } from '@mjs/ui/components/cards';
import { getColumns } from './columns';
import { NetworkStatus } from '../network-status';
import {
  AdminTransactionsWithRelations,
  TransactionWithRelations,
} from '@/common/types/transactions';

interface TransactionsProps {
  transactions?: TransactionWithRelations[] | AdminTransactionsWithRelations[];
  isAdmin?: boolean;
}

export const Transactions = ({
  transactions,
  isAdmin = false,
}: TransactionsProps) => {
  const [loadingAction, setLoadingAction] = useState(false);

  // Set initial column visibility to hide the ID column
  const initialColumnVisibility = {
    id: false, // Hide the ID column by default
  };

  return (
    <div className='pt-4 md:pt-0'>
      <Card
        className={getGlassyCardClassName(
          'mb-4 border border-gray-300/30 shadow-sm'
        )}
      >
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle className='text-foreground'>Transactions</CardTitle>
              <CardDescription>
                Pending transactions will be automatically cancelled after 6
                hours.
              </CardDescription>
            </div>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
              <div className='flex items-center gap-2'>
                <NetworkStatus showChainId />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className='min-h-[30rem] h-[75vh] mb-8'>
        <DataTable
          columns={getColumns(isAdmin)}
          data={transactions || []}
          loading={loadingAction}
          pageSize={10}
          showPagination={true}
          showColumnVisibility={true}
          initialColumnVisibility={initialColumnVisibility}
        />
      </div>
    </div>
  );
};
