'use client';

import type React from 'react';

import { Badge } from '@mjs/ui/primitives/badge';
import { Button } from '@mjs/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@mjs/ui/primitives/dialog';
import { Separator } from '@mjs/ui/primitives/separator';
import { Copy, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { copyToClipboard } from '@mjs/utils/client';
import { useSale } from '@/lib/services/api';
import { Prisma } from '@prisma/client';
import { Skeleton } from '@mjs/ui/primitives/skeleton';

interface SaleDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
}

function getStatusBadge(status: string) {
  const statusConfig = {
    OPEN: {
      variant: 'default' as const,
      color: 'text-green-600 bg-green-50 border-green-200',
    },
    CREATED: {
      variant: 'secondary' as const,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    CLOSED: {
      variant: 'outline' as const,
      color: 'text-gray-600 bg-gray-50 border-gray-200',
    },
    PAUSED: {
      variant: 'destructive' as const,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.CREATED;

  return (
    <Badge variant={config.variant} className={`font-medium ${config.color}`}>
      {status}
    </Badge>
  );
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatNumber(num: number | string, locale: string = 'en-US') {
  if (!num) return 'N/A';
  const decimal = new Prisma.Decimal(num);
  const asNum = decimal.toNumber();
  if (isNaN(asNum)) return 'N/A';
  return new Intl.NumberFormat(locale).format(asNum);
}

function formatCurrency(amount: number, currency: string) {
  if (!amount || isNaN(amount)) return 'N/A';
  return `${amount} ${currency}`;
}

function formatAddress(address: string) {
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function DetailRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
}) {
  return (
    <div className='flex justify-between items-start py-2'>
      <span className='text-sm font-medium text-muted-foreground min-w-[140px]'>
        {label}:
      </span>
      <div className='flex items-center gap-2 flex-1 justify-end'>
        <span className='text-sm text-right'>{value}</span>
        {copyable && typeof value === 'string' && (
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0'
            onClick={() => copyToClipboard(value)}
          >
            <Copy className='h-3 w-3' />
          </Button>
        )}
      </div>
    </div>
  );
}

export function SaleDetailsModal({
  open,
  onOpenChange,
  id,
}: SaleDetailsModalProps) {
  const { data, isLoading, error } = useSale(id);

  if (!id) return null;
  const sale = data?.sale;
  // If error, Error boundary should handle
  if (error) {
    throw new Error(error);
  }
  // If we are not loading and sale is null, throw error
  if (!sale && !isLoading) {
    throw new Error('Sale not found');
  }

  if (!sale) return null;

  const progress =
    ((sale.initialTokenQuantity - sale.availableTokenQuantity) /
      sale.initialTokenQuantity) *
    100;

  const soldTokens = sale.initialTokenQuantity - sale.availableTokenQuantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-start justify-between'>
            <div>
              <DialogTitle className='text-xl font-semibold'>
                {isLoading ? <Skeleton className='w-40 h-6' /> : sale.name}
              </DialogTitle>
              <DialogDescription className='mt-1'>
                {isLoading ? (
                  <Skeleton className='w-52 h-4' />
                ) : (
                  'Detailed information about this token sale'
                )}
              </DialogDescription>
            </div>
            {!isLoading && getStatusBadge(sale.status)}
          </div>
        </DialogHeader>

        <div className='grid gap-6 py-4'>
          {/* Basic Information */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Basic Information</h3>
            <div className='space-y-1'>
              <DetailRow label='Sale ID' value={sale.id} copyable />
              <DetailRow label='Sale Name' value={sale.name} />
              <DetailRow label='Status' value={getStatusBadge(sale.status)} />
              <DetailRow label='Created By' value={sale.createdBy} />
              <DetailRow label='Currency' value={sale.currency} />
            </div>
          </div>

          <Separator />

          {/* Token Information */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Token Information</h3>
            <div className='space-y-1'>
              {sale.information &&
                Array.isArray(sale.information) &&
                sale.information.map((item) => {
                  const info = item as unknown as {
                    label: string;
                    value: string | number | boolean | null;
                    type: string;
                  };
                  return (
                    <DetailRow
                      key={info.label}
                      label={info.label}
                      value={info.value}
                    />
                  );
                })}
              <DetailRow label='Token Name' value={sale.tokenName} />
              <DetailRow label='Token Symbol' value={sale.tokenSymbol} />
              <DetailRow label='Token ID' value={sale.tokenId} />
              <DetailRow
                label='Total Supply'
                value={formatNumber(sale.tokenTotalSupply)}
              />
              <DetailRow
                label='Price per Unit'
                value={formatCurrency(sale.tokenPricePerUnit, sale.currency)}
              />
              <DetailRow
                label='Contract Address'
                value={
                  <div className='flex items-center gap-2'>
                    <span className='font-mono text-xs'>
                      {formatAddress(sale.tokenContractAddress)}
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-6 w-6 p-0'
                      onClick={() => copyToClipboard(sale.tokenContractAddress)}
                    >
                      <Copy className='h-3 w-3' />
                    </Button>
                    <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                      <ExternalLink className='h-3 w-3' />
                    </Button>
                  </div>
                }
              />
              <DetailRow label='Chain ID' value={sale.tokenContractChainId} />
            </div>
          </div>

          <Separator />

          {/* Sale Parameters */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Sale Parameters</h3>
            <div className='space-y-1'>
              <DetailRow
                label='Initial Quantity'
                value={formatNumber(sale.initialTokenQuantity)}
              />
              <DetailRow
                label='Available Quantity'
                value={formatNumber(sale.availableTokenQuantity)}
              />
              <DetailRow
                label='Sold Quantity'
                value={formatNumber(soldTokens)}
              />
              <DetailRow
                label='Progress'
                value={
                  <div className='flex items-center gap-2 min-w-[120px]'>
                    <div className='flex-1 bg-secondary rounded-full h-2'>
                      <div
                        className='bg-primary h-2 rounded-full transition-all'
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className='text-xs font-medium min-w-[3rem]'>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                }
              />
              <DetailRow
                label='Min Buy per User'
                value={formatNumber(sale.minimumTokenBuyPerUser)}
              />
              <DetailRow
                label='Max Buy per User'
                value={formatNumber(sale.maximumTokenBuyPerUser)}
              />
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Timeline</h3>
            <div className='space-y-1'>
              <DetailRow
                label='Start Date'
                value={formatDate(sale.saleStartDate)}
              />
              <DetailRow
                label='End Date'
                value={formatDate(sale.saleClosingDate)}
              />
              <DetailRow
                label='Duration'
                value={`${Math.ceil(
                  (new Date(sale.saleClosingDate).getTime() -
                    new Date(sale.saleStartDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )} days`}
              />
            </div>
          </div>

          <Separator />

          {/* Wallet & Contract Information */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>
              Wallet & Contract Information
            </h3>
            <div className='space-y-1'>
              <DetailRow
                label='Wallet Address'
                value={
                  <div className='flex items-center gap-2'>
                    <span className='font-mono text-xs'>
                      {formatAddress(sale.toWalletsAddress)}
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-6 w-6 p-0'
                      onClick={() => copyToClipboard(sale.toWalletsAddress)}
                    >
                      <Copy className='h-3 w-3' />
                    </Button>
                    <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                      <ExternalLink className='h-3 w-3' />
                    </Button>
                  </div>
                }
              />
              <DetailRow
                label='SAFT Agreement'
                value={
                  <div className='flex items-center gap-2'>
                    {sale.saftCheckbox ? (
                      <CheckCircle className='h-4 w-4 text-green-500' />
                    ) : (
                      <XCircle className='h-4 w-4 text-red-500' />
                    )}
                    <span>{sale.saftCheckbox ? 'Enabled' : 'Disabled'}</span>
                  </div>
                }
              />
              {sale.saftContract && (
                <DetailRow
                  label='SAFT Contract'
                  value={
                    <div className='flex items-center gap-2'>
                      <span className='font-mono text-xs'>
                        {formatAddress(sale.saftContract)}
                      </span>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0'
                        onClick={() => copyToClipboard(sale.saftContract!)}
                      >
                        <Copy className='h-3 w-3' />
                      </Button>
                      <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                        <ExternalLink className='h-3 w-3' />
                      </Button>
                    </div>
                  }
                />
              )}
            </div>
          </div>

          <Separator />

          {/* Financial Summary */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Financial Summary</h3>
            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-muted/50 p-4 rounded-lg'>
                <div className='text-sm text-muted-foreground'>Total Value</div>
                <div className='text-2xl font-bold'>
                  {formatCurrency(
                    sale.initialTokenQuantity * sale.tokenPricePerUnit,
                    sale.currency
                  )}
                </div>
              </div>
              <div className='bg-muted/50 p-4 rounded-lg'>
                <div className='text-sm text-muted-foreground'>
                  Raised So Far
                </div>
                <div className='text-2xl font-bold'>
                  {formatCurrency(
                    soldTokens * sale.tokenPricePerUnit,
                    sale.currency
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='flex justify-end gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>Edit Sale</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
