'use client';
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
import { Button } from '@mjs/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@mjs/ui/primitives/dropdown-menu';
import { Download } from 'lucide-react';
import { exportTransactions } from '@/lib/actions/admin';
import { useAction } from 'next-safe-action/hooks';
import { toast } from '@mjs/ui/primitives/sonner';
import { useSearchParams } from 'next/navigation';
import { Tooltip } from '@mjs/ui/primitives/tooltip';
import { useState } from 'react';
import { TransactionFilters } from './transaction-filters';

interface TransactionsProps {
  transactions?: TransactionWithRelations[] | AdminTransactionsWithRelations[];
  isAdmin?: boolean;
}

export const Transactions = ({
  transactions,
  isAdmin = false,
}: TransactionsProps) => {
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionWithRelations[] | AdminTransactionsWithRelations[]
  >(transactions || []);
  const {
    executeAsync: executeExportAsync,
    isExecuting: isExporting,
    isPending,
  } = useAction(exportTransactions);

  const params = useSearchParams();
  const saleId = params.get('saleId');

  const handleExportTransactions = async (
    format: 'csv' | 'xlsx',
    saleId?: string | null
  ) => {
    if (isExporting) return;

    const res = await executeExportAsync({
      format,
      saleId: saleId || undefined,
    });

    if (res?.data) {
      const { data, filename, contentType } = res.data;

      // Create blob and download
      const blob = new Blob([data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Transactions exported successfully as ${format.toUpperCase()}`
      );
    } else {
      toast.error(
        res?.serverError ||
          res?.validationErrors?._errors?.join(',') ||
          'Failed to export transactions'
      );
    }
  };

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
          data={filteredTransactions}
          loading={isPending || isExporting}
          pageSize={10}
          showPagination={true}
          showColumnVisibility={true}
          initialColumnVisibility={initialColumnVisibility}
        >
          <div className='flex items-center space-x-2 h-full flex-1 mr-2'>
            <div className='flex-1'>
              <TransactionFilters
                transactions={transactions}
                isAdmin={isAdmin}
                onFilteredDataChange={setFilteredTransactions}
              />
            </div>
            <DropdownMenu>
              <Tooltip content='Export transactions'>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    disabled={isExporting}
                    className='shrink-0'
                  >
                    <Download className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
              </Tooltip>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleExportTransactions('csv', saleId)}
                  disabled={isExporting}
                >
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExportTransactions('xlsx', saleId)}
                  disabled={isExporting}
                >
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DataTable>
      </div>
    </div>
  );
};
