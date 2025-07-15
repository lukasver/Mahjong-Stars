import { Sale } from '@/common/schemas/generated';
import { PercentBar } from '@/components/percent-bar';
import { formatNumToIntlString, thousandSeparator } from '@/utils/FormatNumber';
import { percentCalculator } from '@/utils/percentCalculator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { Separator } from '@mjs/ui/primitives/separator';
import { DateTime } from 'luxon';

export const OverviewProject = ({ sale }: { sale: Sale }) => {
  const {
    initialTokenQuantity,
    currency,
    tokenName,
    tokenSymbol,
    tokenPricePerUnit,
    saleClosingDate,
    saleStartDate,
  } = sale || {};
  const availableTokenQuantity = sale?.availableTokenQuantity || 0;
  return (
    <Card className='w-full shadow-lg rounded-xl p-6'>
      <CardHeader className='pb-2 gap-4 p-0 mb-4'>
        <CardTitle className='text-secondary'>Overview</CardTitle>
        <Separator className='bg-secondary' orientation='horizontal' />
      </CardHeader>
      <CardContent className='flex flex-col gap-4 p-0'>
        <Row
          title='Tokens available'
          value={thousandSeparator(String(availableTokenQuantity))}
        />
        <div className='mt-2'>
          <Row
            render={!!initialTokenQuantity}
            title={' '}
            value={`${formatNumToIntlString({
              value: sale && percentCalculator(sale),
            })} % Sold`}
          />
          <div className='w-full mt-1'>
            <PercentBar
              caption={'Total Tokens'}
              value={sale && percentCalculator(sale)}
              textValue={formatNumToIntlString({
                value: initialTokenQuantity,
              })}
            />
          </div>
        </div>
        <Separator className='my-4' />
        <Row title='Name' value={tokenName} render={!!tokenName} />
        <Row title='Symbol' value={tokenSymbol} render={!!tokenSymbol} />
        <Row
          title='Total supply'
          value={thousandSeparator(String(initialTokenQuantity))}
          render={!!initialTokenQuantity}
        />
        <Row
          title='Price'
          value={`${tokenPricePerUnit} ${currency}`}
          render={!!tokenPricePerUnit && !!currency}
        />
        <Row
          title='Sale starts'
          value={
            saleStartDate
              ? DateTime.fromISO(String(saleStartDate)).toLocaleString(
                  DateTime.DATE_MED
                )
              : ''
          }
          render={!!saleStartDate}
        />
        <Row
          title='Sale ends'
          value={
            saleClosingDate
              ? DateTime.fromISO(String(saleClosingDate)).toLocaleString(
                  DateTime.DATE_MED
                )
              : ''
          }
          render={!!saleClosingDate}
        />
      </CardContent>
    </Card>
  );
};

const Row = ({
  value = undefined,
  render = true,
  title,
}: {
  value?: string;
  title: string;
  render?: boolean;
}) =>
  render ? (
    <div className='flex justify-between items-center w-full'>
      <span className='text-base font-medium text-secondary'>{title}</span>
      {value && (
        <span className='text-sm text-foreground font-semibold'>{value}</span>
      )}
    </div>
  ) : null;
