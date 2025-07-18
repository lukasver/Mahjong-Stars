'use client';

import { Logo } from '@/components/logo';
import { Button } from '@mjs/ui/primitives/button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

/**
 * ComingSoon page for the buy dashboard section.
 * Shows a coming soon message and a button to go to the dashboard.
 */
export const ComingSoon = ({ to = '/dashboard' }: { to?: string }) => {
  const t = useTranslations('Global');
  const router = useRouter();
  const handleClick = () => {
    router.push(to);
  };
  return (
    <div className='bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center min-h-[100dvh] w-full h-full'>
      <div className='grid place-content-center bg-gradient-to-b from-primary to-5% to-transparent h-full'>
        <div className='flex flex-col items-center justify-center h-full w-full p-8 rounded-xl gap-6 -mt-10'>
          <div className='w-24 flex justify-center'>
            <Logo variant='iconXl' />
          </div>
          <h2 className='text-3xl font-semibold text-center leading-tight max-w-[70%] sm:max-w-full'>
            {t('soon')}
          </h2>
          <Button
            type='button'
            variant='primary'
            onClick={handleClick}
            className='w-full max-w-xs'
          >
            {t('goDashboard')}
          </Button>
        </div>
      </div>
    </div>
  );
};
