'use client';
import { ComingSoonContent } from '@/components/coming-soon';
import { useActiveSale } from '@/lib/services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { Progress } from '@mjs/ui/primitives/progress';
import { motion } from '@mjs/ui/components/motion';
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

  // if (isLoading) {
  //   return (
  //     <div className='py-6'>
  //       <PulseLoader />
  //     </div>
  //   );
  // }

  if (!activeSale) {
    return (
      <div className='py-6'>
        <ComingSoonContent to={undefined} />
      </div>
    );
  }

  const daysRemaining = Math.floor(
    DateTime.fromISO(activeSale.saleClosingDate as unknown as string).diffNow(
      'days'
    ).days
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        scale: { type: 'spring', visualDuration: 0.6, bounce: 0.2 },
      }}
    >
      <Card className='border-zinc-800 bg-zinc-900/50'>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <CardHeader>
            <CardTitle>{activeSale.name}</CardTitle>
            {daysRemaining > 0 ? (
              <CardDescription>
                {t('description', { days: daysRemaining })}
              </CardDescription>
            ) : null}
          </CardHeader>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
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
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                style={{ transformOrigin: 'left' }}
              >
                <Progress
                  value={percentage}
                  className='h-2 bg-zinc-800'
                  indicatorClassName='bg-secondary-500'
                />
              </motion.div>
            </div>

            {children}
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
}
