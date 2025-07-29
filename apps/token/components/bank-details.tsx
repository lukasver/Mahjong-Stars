'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { cn } from '@mjs/ui/lib/utils';
import { Label } from '@mjs/ui/primitives/label';
import { Building2, Copy, CopyIcon, FileText, XIcon } from 'lucide-react';
import { Badge } from '@mjs/ui/primitives/badge';
import { type BankDetailsForm } from './admin/create-sales/utils';
import { Tooltip } from '@mjs/ui/primitives/tooltip';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import { getGlassyCardClassName } from '@mjs/ui/components/cards';

export const BankDetailsCard = ({
  data = {
    bankName: '',
    accountName: '',
    iban: '',
    swift: '',
    address: '',
    memo: '',
    currency: '',
  },
  onRemove,
  onSelect,
  selected,
  noSelectable,
  onCopy,
  ...rest
}: {
  data: BankDetailsForm;
  index?: number;
  onRemove?: (id: string) => void;
  onSelect?: (data: BankDetailsForm) => void;
  selected?: boolean;
  noSelectable?: boolean;
  onCopy?: (data: BankDetailsForm) => void;
}) => {
  const id = rest.index || data?.id || data?.iban;
  return (
    <div key={id} className='relative group'>
      {onCopy && (
        <Tooltip content='Click to copy details to clipboard'>
          <div className='absolute top-4 right-4'>
            <button
              onClick={() => onCopy(data)}
              type='button'
              className='focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]'
            >
              <CopyIcon className='size-4' aria-hidden='true' />
            </button>
          </div>
        </Tooltip>
      )}
      {onRemove && (
        <div className='absolute top-4 right-4'>
          <button
            type='button'
            className={cn(
              'focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]',
              'group-hover:bg-destructive'
            )}
            onClick={() => onRemove(String(id))}
            aria-label='Remove file'
          >
            <XIcon className='size-4' aria-hidden='true' />
          </button>
        </div>
      )}
      <Label htmlFor={data.iban} className='flex'>
        <Card
          {...(onSelect && {
            onClick: () => onSelect(data),
          })}
          className={cn(
            'w-full transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent/50',
            !onRemove && !noSelectable && 'hover:bg-accent cursor-pointer',
            selected && 'bg-accent hover:bg-accent/50 cursor-pointer'
          )}
        >
          <CardHeader className='pb-3 flex justify-between flex-row'>
            <div className='flex items-center gap-3 flex-1'>
              <Building2 className='h-5 w-5 text-muted-foreground' />
              <div className='flex-1'>
                <div className='flex items-baseline gap-2'>
                  <CardTitle className='text-base'>{data.bankName}</CardTitle>
                  <Badge
                    className={cn('shrink-0', 'font-bold')}
                    variant='accent'
                  >
                    {data.currency}
                  </Badge>
                </div>
                {data.accountName && (
                  <CardDescription className='text-sm'>
                    {data.accountName}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='grid grid-cols-1 gap-2 text-sm text-foreground'>
              {data.iban && (
                <div>
                  <span className='font-medium'>IBAN:</span> {data.iban}
                </div>
              )}
              {data.swift && (
                <div>
                  <span className='font-medium'>SWIFT:</span> {data.swift}
                </div>
              )}
              {data.address && (
                <div>
                  <span className='font-medium'>Address:</span> {data.address}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Label>
    </div>
  );
};

export const BankDetailsSkeleton = () => {
  return (
    <div className='w-full max-w-4xl mx-auto p-4'>
      <div className={getGlassyCardClassName('rounded-2xl border p-6')}>
        <div className='flex items-start justify-between'>
          {/* Left side with icon and content */}
          <div className='flex items-start gap-4'>
            {/* Document Icon */}
            <div className='flex-shrink-0'>
              <FileText className='h-6 w-6 text-muted-foreground' />
            </div>

            {/* Main Content */}
            <div className='space-y-4'>
              {/* Name and Currency Badge */}
              <div className='flex items-center gap-3'>
                <Skeleton className='h-6 w-32' />
                <div className='rounded-full bg-destructive px-3 py-1'>
                  <Skeleton className='h-3 w-8' />
                </div>
              </div>

              {/* Subtitle */}
              <Skeleton className='h-4 w-24' />

              {/* Bank Details */}
              <div className='space-y-3'>
                {/* IBAN */}
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-12' />
                  <Skeleton className='h-4 w-40' />
                </div>

                {/* SWIFT */}
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-14' />
                  <Skeleton className='h-4 w-36' />
                </div>

                {/* Address */}
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-44' />
                </div>
              </div>
            </div>
          </div>

          {/* Copy Icon */}
          <div className='flex-shrink-0'>
            <Copy className='h-5 w-5 text-muted-foreground' />
          </div>
        </div>
      </div>
    </div>
  );
};
