'use client';

import Image from '@/components/Image';
import { LandingNewsletterInput } from '@/components/landing/newsletter/LandingNewsletterInput';
import { useLocalStorage } from '@mjs/ui/hooks';
import { Button } from '@mjs/ui/primitives/button';
import { GlowBg } from '@mjs/ui/primitives/glow-bg';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@mjs/ui/primitives/popover';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import { toast } from '@mjs/ui/primitives/sonner';
import { useAppForm } from '@mjs/ui/primitives/form';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useCallback, useRef, useState, useTransition } from 'react';
import { z } from 'zod';

const DynamicAltcha = dynamic(() => import('@/components/Altcha'), {
  ssr: false,
  loading: () => <Skeleton className='w-64 h-20' />,
});

const getFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    email: z
      .string()
      .email({ message: t('errors.email') })
      .min(1, { message: t('errors.email') })
      .trim(),
    token: z.string(),
  });

/**
 * A component meant to be used in the landing page.
 * It shows a newsletter input form with a title, description.
 */
export const LandingNewsletterSection = ({
  children,
  className,
  innerClassName,
  title,
  titleComponent,
  description,
  descriptionComponent,
  buttonLabel = 'Subscribe',
  placeholderLabel = 'Enter your email',
  inputLabel = 'Email address',
  textPosition = 'center',
  minHeight = 350,
  withBackground = false,
  withBackgroundGlow = false,
  withAvatars = false,
  variant = 'primary',
  backgroundGlowVariant = 'primary',
}: {
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  title?: string | React.ReactNode;
  titleComponent?: React.ReactNode;
  description?: string | React.ReactNode;
  descriptionComponent?: React.ReactNode;
  buttonLabel?: string;
  placeholderLabel?: string;
  inputLabel?: string;
  textPosition?: 'center' | 'left';
  minHeight?: number;
  withBackground?: boolean;
  withBackgroundGlow?: boolean;
  withAvatars?: boolean;
  variant?: 'primary' | 'secondary';
  backgroundGlowVariant?: 'primary' | 'secondary';
}) => {
  const locale = useLocale();
  const t = useTranslations('Newsletter');
  const [LSCanSubmit, setLSCanSubmit] = useLocalStorage('mjs-newsletter', true);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useAppForm({
    validators: { onSubmit: getFormSchema(t) },
    defaultValues: {
      email: '',
      token: '',
    },
    onSubmit: ({ value }) => onSubmit(value),
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );
  const altchaRef = useRef<{ value: string | null; reset: () => void } | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  const onSubmit = async (
    values: z.infer<ReturnType<typeof getFormSchema>>
  ) => {
    startTransition(async () => {
      try {
        const result = await fetch('/api/captcha', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ captcha: values.token }),
        }).then(
          (res) => res.json() as unknown as { success: boolean; error?: string }
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to verify captcha');
        }

        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: values.email }),
        });

        if (!response.ok) {
          throw new Error('Failed to subscribe to newsletter');
        }
        setLSCanSubmit(false);
        form.reset();
        toast.success('Subscribed to newsletter');
      } catch (e: unknown) {
        toast.error('Error subscribing to newsletter');
      }
    });
  };

  const handleAltchaStateChange = (ev: Event | CustomEvent) => {
    const { detail } = (ev || {}) as {
      detail: {
        payload: string;
        state: 'verified' | 'unverified' | 'verifying';
      };
    };

    try {
      if (!detail.payload && detail.state !== 'verifying') {
        throw new Error('Captcha is not verified');
      }

      if (detail.payload && detail.state === 'verified') {
        form.setFieldValue('token', detail.payload);
        form.handleSubmit();
        setPopoverOpen(false);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Error subscribing to newsletter'
      );
    }
  };

  const handlePopoverOpen = () => {
    if (popoverOpen) {
      setPopoverOpen(false);
      return;
    }
    if (!LSCanSubmit) {
      toast.info(t('alreadySubscribed'));
      return;
    }
    const email = form.getFieldValue('email');
    const schema = getFormSchema(t);
    const result = schema.safeParse({ email, token: '' });
    if (!result.success) {
      toast.error(
        result.error.flatten().fieldErrors.email?.[0] || 'Error subscribing'
      );
      return;
    }

    setPopoverOpen((pv) => !pv);
  };

  return (
    <section
      className={clsx(
        'w-full flex flex-col justify-center items-center gap-8 py-12 lg:py-16',
        withBackground && variant === 'primary'
          ? 'bg-primary-100/20 dark:bg-primary-900/10'
          : '',
        withBackground && variant === 'secondary'
          ? 'bg-secondary-100/20 dark:bg-secondary-900/10'
          : '',
        withBackgroundGlow ? 'relative overflow-hidden' : '',
        className
      )}
    >
      {withBackgroundGlow ? (
        <div className='hidden lg:flex justify-center w-full h-full absolute -bottom-1/2 pointer-events-none'>
          <GlowBg
            className={clsx(
              'w-full lg:w-1/2 h-auto z-0 dark:opacity-50 opacity-100'
            )}
            variant={backgroundGlowVariant}
          />
        </div>
      ) : null}

      <div
        className={clsx(
          'container-wide w-full p-6 flex flex-col items-center justify-center relative',
          innerClassName
        )}
        style={{
          minHeight,
        }}
      >
        <div
          className={clsx(
            'flex flex-col gap-4',
            textPosition === 'center'
              ? 'md:max-w-lg items-center text-center'
              : 'items-start'
          )}
        >
          {withAvatars ? (
            <div className='flex mb-6'>
              <Image
                src='/static/images/people/1.webp'
                alt='Person 1'
                width={200}
                height={200}
                className='w-14 h-14 shrink-0 rounded-full'
              />

              <Image
                src='/static/images/people/2.webp'
                alt='Person 2'
                width={200}
                height={200}
                className={clsx(
                  'w-16 h-16 shrink-0 rounded-full rotate-12 -ml-6',
                  variant === 'primary' ? 'border-2 border-primary-500' : '',
                  variant === 'secondary' ? 'border-2 border-secondary-500' : ''
                )}
              />

              <Image
                src='/static/images/people/3.webp'
                alt='Person 3'
                width={200}
                height={200}
                className={clsx(
                  'w-20 h-20 shrink-0 rounded-full relative z-10 -ml-4',
                  variant === 'primary' ? 'border-2 border-primary-500' : '',
                  variant === 'secondary' ? 'border-2 border-secondary-500' : ''
                )}
              />

              <Image
                src='/static/images/people/4.webp'
                alt='Person 4'
                width={200}
                height={200}
                className={clsx(
                  'w-16 h-16 shrink-0 rounded-full -rotate-12 -ml-4',
                  variant === 'primary' ? 'border-2 border-primary-500' : '',
                  variant === 'secondary' ? 'border-2 border-secondary-500' : ''
                )}
              />

              <Image
                src='/static/images/people/5.webp'
                alt='Person 5'
                width={200}
                height={200}
                className='w-14 h-14 shrink-0 rounded-full -ml-4'
              />
            </div>
          ) : null}

          {title ? (
            <h2 className='text-3xl md:text-4xl font-semibold leading-tight'>
              {title}
            </h2>
          ) : (
            titleComponent
          )}

          {description ? (
            <p className='md:text-lg -mt-3'>{description}</p>
          ) : (
            descriptionComponent
          )}

          <form.AppForm>
            <form onSubmit={handleSubmit}>
              <LandingNewsletterInput
                className='mt-4 max-w-sm'
                placeholderLabel={
                  !LSCanSubmit ? t('alreadySubscribedShort') : placeholderLabel
                }
                inputLabel={inputLabel}
                buttonLabel={buttonLabel}
                disabled={!LSCanSubmit}
              >
                <Popover open={popoverOpen}>
                  <PopoverTrigger asChild onClick={handlePopoverOpen}>
                    <Button
                      type='button'
                      loading={isPending}
                      disabled={!LSCanSubmit}
                    >
                      {buttonLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <DynamicAltcha
                      ref={altchaRef}
                      language={locale}
                      onStateChange={handleAltchaStateChange}
                    />
                  </PopoverContent>
                </Popover>
              </LandingNewsletterInput>
              <button
                type='submit'
                className='invisible size-0 opacity-0'
                ref={buttonRef}
              />
            </form>
          </form.AppForm>
          {children}
        </div>
      </div>
    </section>
  );
};
