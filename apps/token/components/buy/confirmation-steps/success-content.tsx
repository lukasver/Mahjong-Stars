'use client';
import { Confetti, ConfettiRef } from '@/components/confetti';
import { Logo } from '@/components/logo';
import { Button } from '@mjs/ui/primitives/button';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRef } from 'react';
import { metadata } from '@/common/config/site';
import { useTransactionById } from '@/lib/services/api';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import { cn } from '@mjs/ui/lib/utils';
import AppLink from '@/components/link';
import { motion } from '@mjs/ui/components/motion';

export const SuccessContent = ({ className }: { className?: string }) => {
  const { tx } = useParams();
  const { data, isLoading } = useTransactionById(tx as string);
  const t = useTranslations();
  const confettiRef = useRef<ConfettiRef>(null);
  const explorerUrl = data?.explorerUrl;
  const tokenSymbol = data?.transaction.sale.tokenSymbol;

  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || metadata.supportEmail;

  return (
    <div className={cn(className)}>
      <div className='flex flex-col items-center justify-center h-full w-full p-8 rounded-xl gap-6 -mt-10'>
        <motion.div
          className='w-24 flex justify-center'
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: 0.1,
            duration: 0.6,
            scale: { type: 'spring', visualDuration: 0.6, bounce: 0.2 },
          }}
        >
          <Logo variant='iconXl' />
        </motion.div>
        <motion.h2
          className='text-3xl font-semibold text-center leading-tight max-w-[70%] sm:max-w-full'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.6,
          }}
        >
          {isLoading ? (
            <Skeleton className='w-[200px] h-4' />
          ) : (
            t('transactions.success.title')
          )}
        </motion.h2>

        <motion.div
          className='text-center text-base font-medium text-foreground max-w-[85%] sm:max-w-[60%] leading-7'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 0.5,
          }}
        >
          {isLoading ? (
            <div className='flex flex-col items-center gap-3 w-full'>
              <Skeleton className='w-[200px] h-4' />
              <Skeleton className='w-[375px] h-4' />
            </div>
          ) : tokenSymbol ? (
            t('transactions.success.description', { tokenSymbol })
          ) : null}
        </motion.div>

        <motion.div
          className='flex flex-row gap-4'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.7,
            duration: 0.5,
          }}
        >
          <AppLink href={`/dashboard/transactions?id=${tx}`}>
            <Button type='button' variant='primary' className='w-full max-w-xs'>
              {t('transactions.success.button')}
            </Button>
          </AppLink>
          {explorerUrl && (
            <a href={explorerUrl} target='_blank' rel='noopener noreferrer'>
              <Button
                type='button'
                variant='primary'
                className='w-full max-w-xs'
              >
                View on explorer
              </Button>
            </a>
          )}
        </motion.div>
        <motion.div
          className='text-secondary mt-2'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.9,
            duration: 0.5,
          }}
        >
          {t('transactions.success.supportText')}{' '}
          <a href={`mailto:${supportEmail}`} className='underline'>
            {supportEmail}
          </a>
        </motion.div>
        <Confetti
          ref={confettiRef}
          className='absolute left-50% top-50% size-full -z-10'
          onMouseEnter={() => {
            confettiRef.current?.fire({});
          }}
        />
      </div>
    </div>
  );
};
