'use client';
import { useActiveSale } from '@/lib/services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { Progress } from '@mjs/ui/primitives/progress';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';

export function FundraisingProgress({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { data: activeSale } = useActiveSale();
  const t = useTranslations('dashboard.fundraisingProgress');

  // In a real app, these would come from your API or blockchain data
  const available = activeSale?.availableTokenQuantity || 0;
  const total = activeSale?.initialTokenQuantity || 0;
  const sold = total - available;
  const percentage = Math.round((sold / total) * 100);

  if (!activeSale) {
    throw new Error(t('noActiveSale'));
  }

  const daysRemaining = Math.floor(
    DateTime.fromISO(activeSale.saleClosingDate as unknown as string).diffNow(
      'days'
    ).days
  );

  return (
    <Card className='border-zinc-800 bg-zinc-900/50'>
      <CardHeader>
        <CardTitle>{activeSale.name}</CardTitle>
        {daysRemaining > 0 ? (
          <CardDescription>
            {t('description', { days: daysRemaining })}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <div>
              <span className='text-xl font-bold text-secondary-500'>
                {t('tokensSold', {
                  sold: sold.toLocaleString(),
                  total: total.toLocaleString(),
                  tokenSymbol: activeSale.tokenSymbol,
                })}
              </span>
            </div>
            <div className='text-right font-medium'>
              {t('percentage', { percentage })}
            </div>
          </div>
          <Progress
            value={percentage}
            className='h-2 bg-zinc-800'
            indicatorClassName='bg-secondary-500'
          />
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
