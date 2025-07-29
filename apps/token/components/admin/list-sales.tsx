'use client';

import { useSales } from '@/lib/services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { Input } from '@mjs/ui/primitives/input';
import {
  AlertCircle,
  Edit,
  Eye,
  MoreHorizontal,
  Search,
  Trash2,
} from 'lucide-react';
import { ReactNode, useState } from 'react';
import { SearchSelect } from '../searchBar/search-select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mjs/ui/primitives/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@mjs/ui/primitives/dropdown-menu';
import { Button } from '@mjs/ui/primitives/button';
import { cn } from '@mjs/ui/lib/utils';
import { Badge } from '@mjs/ui/primitives/badge';
import { SaleDetailsModal } from './sale-details-modal';
import Link from 'next/link';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from '@mjs/ui/primitives/dialog';
import { formatCurrency, formatDate } from '@mjs/utils/client';
import { useLocale } from 'next-intl';
import { SaleWithToken } from '@/common/types/sales';
import { DateTime } from 'luxon';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@mjs/ui/primitives/alert-dialog';
import { useAction } from 'next-safe-action/hooks';
import { updateSaleStatus } from '@/lib/actions/admin';
import { toast } from '@mjs/ui/primitives/sonner';
import { getQueryClient } from '@/app/providers';
import { SaleStatusType } from '@/common/schemas/generated';
import { getGlassyCardClassName } from '@mjs/ui/components/cards';

export function ListSales({
  children,
  className,
  title,
  description,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
}) {
  const { data: salesData } = useSales();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState<SaleWithToken | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [pendingOpenSaleId, setPendingOpenSaleId] = useState<string | null>(
    null
  );

  const filteredSales =
    salesData?.sales.filter((sale) => {
      const matchesSearch =
        sale.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.tokenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || sale.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  const handleViewDetails = (sale: SaleWithToken) => {
    setSelectedSale(sale);
    setIsDetailsModalOpen(true);
  };

  const locale = useLocale();

  const { executeAsync, isExecuting, result, hasErrored } =
    useAction(updateSaleStatus);

  const handleUpdateStatus = async (saleId: string, status: SaleStatusType) => {
    console.log('handleUpdateStatus', saleId, status, isExecuting);
    if (!saleId || isExecuting || !status) return;
    const res = await executeAsync({
      id: saleId,
      status,
    });

    if (res?.data) {
      const queryClient = getQueryClient();
      await queryClient.invalidateQueries({
        queryKey: ['sales'],
      });
      setIsOpenDialogOpen(false);
      setPendingOpenSaleId(null);
      toast.success(`Sale status changed to ${status}`);
    } else {
      toast.error(
        result.serverError ||
          result.validationErrors?._errors?.join(',') ||
          'Unknown error ocurred'
      );
    }
  };

  return (
    <div className={cn('flex-1 space-y-4 p-4', className)}>
      {/* Stats Cards */}
      {/* <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Sales</CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{salesData.length}</div>
            <p className='text-xs text-muted-foreground'>
              Active sales campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Open Sales</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {salesData.filter((s) => s.status === 'OPEN').length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Currently accepting purchases
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Tokens</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(
                salesData.reduce(
                  (acc, sale) => acc + sale.initialTokenQuantity,
                  0
                )
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              Tokens across all sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Available</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(
                salesData.reduce(
                  (acc, sale) => acc + sale.availableTokenQuantity,
                  0
                )
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              Tokens still available
            </p>
          </CardContent>
        </Card>
      </div> */}
      {children}

      {/* Filters and Search */}
      <Card className={getGlassyCardClassName('shadow')}>
        <CardHeader className='flex flex-col sm:flex-row gap-2 justify-between'>
          <div className='flex flex-col'>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className='flex items-center justify-between space-x-2'>
            <div className='flex items-center space-x-2'>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search sales...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-8 w-[300px]'
                />
              </div>
              <SearchSelect
                placeholder='Search sales...'
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Open', value: 'OPEN' },
                  { label: 'Created', value: 'CREATED' },
                  { label: 'Closed', value: 'CLOSED' },
                  { label: 'Finished', value: 'FINISHED' },
                ]}
                onSearch={setSearchTerm}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className=''>
          {/* Data Table */}
          <div className='rounded-md border bg-primary'>
            <Table>
              <TableHeader>
                <TableRow className='text-secondary'>
                  <TableHead>Sale Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales?.map((sale) => {
                  const progress =
                    ((sale.initialTokenQuantity - sale.availableTokenQuantity) /
                      sale.initialTokenQuantity) *
                    100;

                  return (
                    <TableRow key={sale.id}>
                      <TableCell className='font-medium'>
                        <div>
                          <div className='font-medium'>{sale.name}</div>
                          <div className='text-sm text-muted-foreground'>
                            ID: {sale.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{sale.tokenName}</div>
                          <div className='text-sm text-muted-foreground'>
                            {sale.tokenSymbol}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(sale.tokenPricePerUnit, {
                          currency: sale.currency,
                          locale,
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            {formatCurrency(sale.availableTokenQuantity, {
                              locale,
                            })}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            of{' '}
                            {formatCurrency(sale.initialTokenQuantity, {
                              locale,
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-2'>
                          <div className='w-full bg-secondary rounded-full h-2'>
                            <div
                              className='bg-primary h-2 rounded-full'
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className='text-sm text-muted-foreground min-w-[3rem]'>
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(sale.saleStartDate, {
                          locale,
                          format: DateTime.DATE_MED,
                        })}
                      </TableCell>
                      <TableCell>
                        {formatDate(sale.saleClosingDate, {
                          locale,
                          format: DateTime.DATE_MED,
                        })}
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>Open menu</span>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(sale)}
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/sales/create?saleId=${sale.id}&step=1`}
                              >
                                <Edit className='mr-2 h-4 w-4' />
                                Edit Sale
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Change Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem
                                    disabled={sale.status === 'OPEN'}
                                    className='bg-green-500'
                                    onClick={() => {
                                      setPendingOpenSaleId(sale.id);
                                      setIsOpenDialogOpen(true);
                                    }}
                                  >
                                    Open
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(sale.id, 'CLOSED')
                                    }
                                    disabled={['CLOSED', 'FINISHED'].includes(
                                      sale.status
                                    )}
                                  >
                                    Close
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='mr-2 h-4 w-4' />
                              Delete Sale
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredSales.length === 0 && (
            <div className='text-center py-8'>
              <p className='text-muted-foreground'>
                No sales found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedSale && (
        <ErrorBoundary
          fallback={
            <Dialog defaultOpen>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Error loading sale details</DialogTitle>
                </DialogHeader>
                <AlertCircle className='h-16 w-16 text-destructive mx-auto mb-4' />
              </DialogContent>
            </Dialog>
          }
        >
          <SaleDetailsModal
            id={selectedSale.id}
            open={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
          />
        </ErrorBoundary>
      )}

      {/* AlertDialog for opening a sale */}
      <AlertDialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
        {pendingOpenSaleId && (
          <SaleStatusDialog
            saleId={pendingOpenSaleId}
            onConfirm={handleUpdateStatus}
          />
        )}
      </AlertDialog>
    </div>
  );
}

const SaleStatusDialog = ({
  saleId,
  onConfirm,
}: {
  saleId: string;
  onConfirm: (saleId: string, status: SaleStatusType) => Promise<void>;
}) => {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Open Sale Confirmation</AlertDialogTitle>
        <AlertDialogDescription className='text-foreground'>
          <ul className='list-disc pl-5 space-y-1'>
            <li>
              Only <b>one</b> sale can be open at a time. Opening this sale will
              close any currently open sale.
            </li>
            <li>
              Once open, this sale will be available for public investment.
            </li>
          </ul>
          Are you sure you want to open this sale?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => onConfirm(saleId, 'OPEN')}
          className='bg-accent'
        >
          Yes, Open Sale
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

function getStatusBadge(status: string) {
  const statusConfig = {
    OPEN: { variant: 'default' as const, color: 'bg-green-500' },
    CREATED: { variant: 'secondary' as const, color: 'bg-blue-500' },
    CLOSED: { variant: 'outline' as const, color: 'bg-gray-500' },
    PAUSED: { variant: 'destructive' as const, color: 'bg-yellow-500' },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.CREATED;

  return (
    <Badge variant={config.variant} className='font-medium'>
      {status}
    </Badge>
  );
}
