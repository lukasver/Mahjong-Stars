'use client';
import { Button } from '@mjs/ui/primitives/button';
import { ExternalLink, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { metadata } from '@/common/config/site';

/**
 * Pending status page for dashboard actions.
 * Shows that transaction is confirmed but under review by Mahjong Stars team.
 * Displays txHash/transactionId for fiat payments and provides contact options.
 */
const Pending = () => {
  const router = useRouter();
  const query = useSearchParams();
  const t = useTranslations();
  const url = query.get('urlTxHash') as string | undefined;
  const projectName = query.get('projectName') as string | undefined;
  const txHash = query.get('txHash') as string | undefined;
  const transactionId = query.get('transactionId') as string | undefined;
  const supportEmail = metadata.supportEmail;

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  const handleContactClick = () => {
    window.location.href = `mailto:${supportEmail}?subject=Transaction%20Review%20Inquiry`;
  };

  return (
    <div className='flex flex-col items-center justify-center h-full w-full p-8 rounded-xl gap-6 -mt-10 min-h-[80dvh]'>
      <div className='w-24 flex justify-center'>
        <Image
          src='/static/images/features4.webp'
          alt='Mahjong Stars'
          width={96}
          height={96}
          className='rounded-lg'
        />
      </div>

      <h2 className='text-3xl font-semibold text-center leading-tight max-w-[70%] sm:max-w-full'>
        {t('status.pending.title')}
      </h2>

      <div className='text-center text-base font-medium text-foreground max-w-[85%] sm:max-w-[60%] leading-7'>
        {t('status.pending.text', {
          projectName: projectName || 'Mahjong Stars',
        })}
      </div>

      {(txHash || transactionId) && (
        <div className='w-full max-w-md'>
          <div className='bg-gray-50 rounded-lg p-4 border'>
            <div className='text-sm font-medium text-gray-700 mb-2'>
              {txHash ? 'Transaction Hash:' : 'Transaction ID:'}
            </div>
            <div className='text-sm font-mono text-gray-900 break-all'>
              {txHash || transactionId}
            </div>
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
            {t('status.pending.transactionLink')}
            <ExternalLink size={16} className='ml-1' />
          </a>
        </div>
      )}

      <div className='flex flex-col sm:flex-row gap-3 w-full max-w-xs'>
        <Button
          variant='outline'
          onClick={handleContactClick}
          className='flex-1 flex items-center gap-2'
        >
          <Mail size={16} />
          {t('status.pending.contactButton')}
        </Button>
        <Button
          variant='primary'
          onClick={handleDashboardClick}
          className='flex-1'
        >
          {t('status.pending.button')}
        </Button>
      </div>

      <div className='text-secondary mt-2'>
        {t('status.pending.supportText')}{' '}
        <a href={`mailto:${supportEmail}`} className='underline'>
          {supportEmail}
        </a>
      </div>
    </div>
  );
};

export default Pending;
