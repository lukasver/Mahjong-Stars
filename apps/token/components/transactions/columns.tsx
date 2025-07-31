'use client';

import { type ColumnDef } from '@mjs/ui/primitives/data-table';
import { Decimal } from 'decimal.js';
import { FOP, TransactionStatus } from '@prisma/client';
import MahjongStarsIconXl from '@/public/static/favicons/android-chrome-512x512.png';

import { formatDate, safeFormatCurrency } from '@mjs/utils/client';
import { Badge } from '@mjs/ui/primitives/badge';
import {
  Eye,
  MoreHorizontal,
  ExternalLink,
  CheckIcon,
  XCircle,
} from 'lucide-react';
import { Button } from '@mjs/ui/primitives/button';
import { DateTime } from 'luxon';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuContent,
} from '@mjs/ui/primitives/dropdown-menu';
import { TransactionWithRelations } from '@/common/types/transactions';
import { FIAT_CURRENCIES } from '@/common/config/constants';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { TransactionDetailsModal } from './transaction-details-modal';
import {
  AlertDialog,
  AlertDialogContent,
} from '@mjs/ui/primitives/alert-dialog';
import Image from 'next/image';

const statusColors: Record<TransactionStatus, string> = {
  PENDING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  AWAITING_PAYMENT:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  PAYMENT_SUBMITTED:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  PAYMENT_VERIFIED:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  TOKENS_ALLOCATED:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  TOKENS_DISTRIBUTED:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  COMPLETED:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REFUNDED:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const fopLabels: Record<FOP, string> = {
  CRYPTO: 'Crypto',
  TRANSFER: 'Bank Transfer',
  CARD: 'Credit Card',
};

const formatChipMessage = (status: TransactionStatus) => {
  switch (status) {
    case TransactionStatus.COMPLETED:
      return 'Completed';
    case TransactionStatus.CANCELLED:
      return 'Cancelled';
    case TransactionStatus.PAYMENT_VERIFIED:
      return 'Payment Verified';
    case TransactionStatus.TOKENS_DISTRIBUTED:
      return 'Tokens Distributed';
    case TransactionStatus.PENDING:
      return 'Pending';
    case TransactionStatus.AWAITING_PAYMENT:
      return 'Awaiting Payment';
    case TransactionStatus.PAYMENT_SUBMITTED:
      return 'Payment Submitted';
    case TransactionStatus.TOKENS_ALLOCATED:
      return 'Tokens Allocated';
    case TransactionStatus.REJECTED:
      return 'Rejected';
    case TransactionStatus.REFUNDED:
      return 'Refunded';
    default:
      return status;
  }
};

export const getColumns = (): ColumnDef<TransactionWithRelations>[] => [
  {
    accessorKey: 'id',
    header: 'ID',
    enableHiding: true,
    cell: ({ row }) => {
      const id = row.getValue('id') as string;
      return <span className='font-mono text-xs'>{id.slice(-8)}</span>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const date = DateTime.fromISO(row.getValue('createdAt'));

      return (
        <div>
          <div className='text-sm'>{formatDate(date)}</div>
          <div className='text-xs text-muted-foreground'>
            {date.toLocaleString({
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'sale',
    header: 'Sale',
    cell: ({ row }) => {
      const sale = row.getValue('sale') as TransactionWithRelations['sale'];

      return <span className='text-sm font-medium'>{sale.name}</span>;
    },
  },
  {
    accessorKey: 'tokenSymbol',
    header: 'Token',
    cell: ({ row }) => {
      const symbol = row.original.tokenSymbol;
      return (
        <div>
          <b className='font-medium'>{symbol}</b>
          {/* <div className='text-xs text-muted-foreground'>
            {row.getValue('')}
          </div> */}
        </div>
      );
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Purchased',
    cell: ({ row }) => {
      const value = row.getValue('quantity') as string | number;
      return value
        ? new Intl.NumberFormat().format(new Decimal(value).toNumber())
        : null;
    },
  },
  // {
  //   accessorKey: 'totalAmount',
  //   header: 'Total',
  //   cell: ({ row }) => {
  //     const value = row.getValue('totalAmount') as string | number;
  //     const currency = row.original.paidCurrency as string;
  //     if (!value) return null;

  //     const amount = new Decimal(value).toNumber();
  //     return (
  //       <span>
  //         {new Intl.NumberFormat('en-US', {
  //           style: 'decimal',
  //           minimumFractionDigits: 2,
  //           maximumFractionDigits: 6,
  //         }).format(amount)}{' '}
  //         {tokenSymbol}
  //       </span>
  //     );
  //   },
  // },
  {
    accessorKey: 'amountPaid',
    header: 'Paid / To pay',
    cell: ({ row }) => {
      const amountPaid = row.original.amountPaid;
      const paidCurrency = row.original.paidCurrency;
      const locale = useLocale();

      if (Number.isNaN(Number(amountPaid))) return 'TBD';

      return (
        <span>
          {safeFormatCurrency(
            {
              totalAmount: amountPaid,
              currency: paidCurrency,
            },
            {
              locale,
              precision: FIAT_CURRENCIES.includes(paidCurrency)
                ? 'FIAT'
                : 'CRYPTO',
            }
          )}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as TransactionStatus;
      return (
        <Badge className={statusColors[status]}>
          {formatChipMessage(status)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'formOfPayment',
    header: 'Payment',
    cell: ({ row }) => {
      const fop = row.getValue('formOfPayment') as FOP;
      const txHash = row.original.txHash;

      return (
        <div>
          <div className='text-sm'>{fopLabels[fop]}</div>
          {txHash && (
            <div className='text-xs text-muted-foreground font-mono'>
              {txHash.slice(0, 10)}...
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ActionButtons row={row.original} />,
  },
];

const ActionButtons = ({ row }: { row: TransactionWithRelations }) => {
  const status = row.status;
  const hasTxHash = cryptoTxTypeGuard(row);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className='flex items-center gap-2'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm'>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setShowDetails(true)}>
            <Eye className='h-4 w-4 mr-2' />
            View Details
          </DropdownMenuItem>
          {status === TransactionStatus.PENDING && (
            <Link href={`/dashboard/buy/${row.id}`}>
              <DropdownMenuItem>
                <CheckIcon className='h-4 w-4 mr-2 text-secondary' />
                Continue
              </DropdownMenuItem>
            </Link>
          )}
          {(status === TransactionStatus.AWAITING_PAYMENT ||
            status === TransactionStatus.PENDING) && (
            <DropdownMenuItem>
              <XCircle className='h-4 w-4 mr-2 text-destructive' />
              Cancel
            </DropdownMenuItem>
          )}
          {status === TransactionStatus.AWAITING_PAYMENT && (
            <DropdownMenuItem>
              <Eye className='h-4 w-4 mr-2' />
              Confirm payment
            </DropdownMenuItem>
          )}

          {hasTxHash && (
            <DropdownMenuItem>
              <ExternalLink className='h-4 w-4 mr-2' />
              View on Explorer
            </DropdownMenuItem>
          )}
          {/* <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className='h-4 w-4 mr-2' />
                Export Transaction
              </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
      <Suspense
        key={row.id}
        fallback={
          <AlertDialog open={true}>
            <AlertDialogContent>
              <div className='flex items-center gap-2'>
                <span className='aspect-square animate-pulse'>
                  <Image
                    height={80}
                    width={80}
                    src={MahjongStarsIconXl}
                    alt='Mahjong Stars Logo'
                    className='animate-spin aspect-square'
                  />
                </span>
                <span className='text-xl font-bold font-head'>Loading...</span>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        }
      >
        <TransactionDetailsModal
          open={showDetails}
          onOpenChange={setShowDetails}
          id={row.id}
        />
      </Suspense>
    </div>
  );
};

const cryptoTxTypeGuard = (data: object): data is TransactionWithRelations => {
  return (
    Boolean(data) &&
    'formOfPayment' in data &&
    data.formOfPayment === FOP.CRYPTO &&
    'txHash' in data &&
    data.txHash !== null
  );
};
