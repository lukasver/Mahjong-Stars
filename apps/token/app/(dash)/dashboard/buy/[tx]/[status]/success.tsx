'use client';
import { Confetti, ConfettiRef } from '@/components/confetti';
import { Logo } from '@/components/logo';
import { Button } from '@mjs/ui/primitives/button';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { metadata } from '@/common/config/site';

/**
 * Success status page for dashboard actions.
 * Shows success message, project name, support email, and transaction link if available.
 */
const Success = () => {
  const router = useRouter();
  const query = useSearchParams();
  const t = useTranslations();
  const confettiRef = useRef<ConfettiRef>(null);
  const url = query.get('urlTxHash') as string | undefined;
  const projectName = query.get('projectName') as string | undefined;
  const email = query.get('email') as string | undefined;

  const handleClick = () => {
    router.push('/dashboard');
  };

  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || metadata.supportEmail;

  return (
    <div className='bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center min-h-[100dvh] w-full h-full'>
      <div className='grid place-content-center bg-gradient-to-b from-primary to-5% to-transparent h-full'>
        <div className='flex flex-col items-center justify-center h-full w-full p-8 rounded-xl gap-6 -mt-10'>
          <div className='w-24 flex justify-center'>
            <Logo variant='iconXl' />
          </div>
          <h2 className='text-3xl font-semibold text-center leading-tight max-w-[70%] sm:max-w-full'>
            {t('transactions.success.title')}
          </h2>
          {projectName && (
            <div className='text-center text-base font-medium text-foreground max-w-[80%] sm:max-w-[50%] leading-7'>
              {t('transactions.success.description', { projectName })}
              <div className='text-primary mt-2'>
                {t('transactions.success.supportText')}{' '}
                <a href={`mailto:${supportEmail}`} className='underline'>
                  {supportEmail}
                </a>
              </div>
            </div>
          )}
          {url && (
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
          )}
          <Button
            type='button'
            variant='primary'
            onClick={handleClick}
            className='w-full max-w-xs'
          >
            {t('transactions.success.button')}
          </Button>
        </div>
      </div>
      <Confetti
        ref={confettiRef}
        className='absolute left-50% top-50% z-0 size-full'
        onMouseEnter={() => {
          confettiRef.current?.fire({});
        }}
      />
    </div>
  );
};

export default Success;
