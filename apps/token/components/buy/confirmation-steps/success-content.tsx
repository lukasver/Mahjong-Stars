'use client';
import { Confetti, ConfettiRef } from '@/components/confetti';
import { Logo } from '@/components/logo';
import { Button } from '@mjs/ui/primitives/button';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { metadata } from '@/common/config/site';
import { useTransactionById } from '@/lib/services/api';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import { cn } from '@mjs/ui/lib/utils';

export const SuccessContent = ({ className }: { className?: string }) => {
  const router = useRouter();
  const { tx } = useParams();
  const { data, isLoading } = useTransactionById(tx as string);
  const t = useTranslations();
  const confettiRef = useRef<ConfettiRef>(null);
  const _url = `/dashboard/transactions?id=${tx}`;
  const _saleName = data?.transaction.sale.name;
  const tokenSymbol = data?.transaction.sale.tokenSymbol;

  const handleClick = () => {
    router.push(`/dashboard/transactions?id=${tx}`);
  };

  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || metadata.supportEmail;
  return (
    <div className={cn(className)}>
      <div className='flex flex-col items-center justify-center h-full w-full p-8 rounded-xl gap-6 -mt-10'>
        <div className='w-24 flex justify-center'>
          <Logo variant='iconXl' />
        </div>
        <h2 className='text-3xl font-semibold text-center leading-tight max-w-[70%] sm:max-w-full'>
          {t('transactions.success.title')}
        </h2>

        <div className='text-center text-base font-medium text-foreground max-w-[85%] sm:max-w-[60%] leading-7'>
          {isLoading ? (
            <div className='flex flex-col items-center gap-3 w-full'>
              <Skeleton className='w-[200px] h-4' />
              <Skeleton className='w-[375px] h-4' />
            </div>
          ) : tokenSymbol ? (
            t('transactions.success.description', { tokenSymbol })
          ) : null}
        </div>

        {/* //TODO! should render if crypto tx and we have reference of blockchain scanner. */}
        {/* {url && (
        <div className='flex items-center mt-2 mb-2'>
          <a
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-1 text-sm text-primary underline hover:text-primary/80 transition-colors'
          >
            {t('transactions.success.transactionLink', {
              defaultValue: 'View transaction details',
            })}
            <ExternalLink size={16} className='ml-1' />
          </a>
        </div>
      )} */}
        <Button
          type='button'
          variant='primary'
          onClick={handleClick}
          className='w-full max-w-xs'
        >
          {t('transactions.success.button')}
        </Button>
        <div className='text-secondary mt-2'>
          {t('transactions.success.supportText')}{' '}
          <a href={`mailto:${supportEmail}`} className='underline'>
            {supportEmail}
          </a>
        </div>
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
