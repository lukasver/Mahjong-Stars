'use client';
import { Button } from '@mjs/ui/primitives/button';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { metadata } from '@/common/config/site';
import { useTransactionById } from '@/lib/services/api';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import { cn } from '@mjs/ui/lib/utils';
import { ExternalLink } from 'lucide-react';
import ErrorImage from '@/public/static/images/error-char.webp';
import Image from 'next/image';
import { motion } from '@mjs/ui/components/motion';

export const FailureContent = ({ className }: { className?: string }) => {
  const router = useRouter();
  const { tx } = useParams();
  const { data, isLoading } = useTransactionById(tx as string);
  const t = useTranslations('status.failure');
  const projectName = data?.transaction?.sale?.name;
  const explorerUrl = data?.explorerUrl;

  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || metadata.supportEmail;

  const handleClick = () => {
    router.push('/dashboard');
  };

  return (
    <div className={cn(className)}>
      <div className='flex flex-col sm:flex-row gap-6 sm:gap-10 items-center justify-center h-full w-full p-8 rounded-xl'>
        <motion.div
          className='max-w-[200px] flex justify-center'
          initial={{ opacity: 0, scale: 0.8, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{
            delay: 0.1,
            duration: 0.6,
            scale: { type: 'spring', visualDuration: 0.6, bounce: 0.2 },
          }}
        >
          {isLoading ? (
            <Skeleton
              className={`w-[${ErrorImage.width}px] h-[${ErrorImage.height}px]`}
            />
          ) : (
            <Image alt='Error' className='object-contain' {...ErrorImage} />
          )}
        </motion.div>
        <div className='flex flex-col gap-2 items-center'>
          <motion.div
            className='flex flex-col gap-2'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.6,
            }}
          >
            <h2 className='text-3xl font-semibold text-center leading-tight max-w-[70%] sm:max-w-full'>
              {t('title')}
            </h2>
            <p className='text-sm text-center'>
              {data?.transaction?.rejectionReason ||
                data?.transaction?.comment ||
                data?.transaction?.status}
            </p>
          </motion.div>

          {explorerUrl && (
            <motion.div
              className='flex items-center mt-2 mb-2'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.5,
                duration: 0.5,
              }}
            >
              <a
                href={explorerUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-1 text-sm text-primary underline hover:text-primary/80 transition-colors'
              >
                {t('transactionLink', {
                  defaultValue: 'If you want to see the transaction click here',
                })}
                <ExternalLink size={16} className='ml-1' />
              </a>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.7,
              duration: 0.5,
            }}
          >
            <Button
              variant='primary'
              onClick={handleClick}
              className='w-full max-w-xs'
            >
              {t('button')}
            </Button>
          </motion.div>
          {projectName && (
            <motion.div
              className='text-center text-base font-medium text-foreground max-w-[85%] sm:max-w-[60%] leading-7'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.9,
                duration: 0.5,
              }}
            >
              {isLoading ? (
                <div className='flex flex-col items-center gap-3 w-full'>
                  <Skeleton className='w-[200px] h-4' />
                  <Skeleton className='w-[375px] h-4' />
                </div>
              ) : (
                <>
                  <div className='text-secondary mt-2'>
                    <a href={`mailto:${supportEmail}`} className='underline'>
                      {supportEmail}
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
