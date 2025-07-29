'use client';
import { cn } from '@mjs/ui/lib/utils';
import { Button } from '@mjs/ui/primitives/button';
import { FormInput } from '@mjs/ui/primitives/form-input';
import { Label } from '@mjs/ui/primitives/label';
import { PopoverContent } from '@mjs/ui/primitives/popover';
import { Popover, PopoverTrigger } from '@mjs/ui/primitives/popover';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import { toast } from '@mjs/ui/primitives/sonner';
import { useAppForm } from '@mjs/ui/primitives/form';
import { useLocale, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import type { FC } from 'react';
import { useState, useTransition } from 'react';
import { useCallback, useRef } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { z } from 'zod';

const DynamicAltcha = dynamic(() => import('@/components/Altcha'), {
  ssr: false,
  loading: () => <Skeleton className='w-64 h-20' />,
});

const getFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    email: z
      .string()
      .email({ message: t('Newsletter.errors.email') })
      .min(1, { message: t('Newsletter.errors.email') })
      .trim(),
    token: z.string(),
  });

/**
 * Newsletter subscription form with email input and submit button.
 * @param className - Optional className for the form container.
 */
const NewsletterForm: FC<{
  className?: string;
  inputLabel?: string;
  placeholderLabel?: string;
  disabled?: boolean;
}> = ({ className, inputLabel, placeholderLabel, disabled }) => {
  const locale = useLocale();
  const t = useTranslations();
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
          if (response.status === 409) {
            throw new Error(t('Newsletter.alreadySubscribed'));
          }
          throw new Error('Failed to subscribe to newsletter');
        }
        setLSCanSubmit(false);
        form.reset();
        toast.success('Subscribed to newsletter');
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : 'Error subscribing to newsletter'
        );
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
      toast.info(t('Newsletter.alreadySubscribed'));
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

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handlePopoverOpen();
    },
    [handlePopoverOpen]
  );

  return (
    <Popover open={popoverOpen}>
      <form.AppForm>
        <form
          onSubmit={handleFormSubmit}
          className={cn(
            'flex bg-white rounded-lg font-common flex-col sm:flex-row',
            `shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.25)]`,
            className
          )}
        >
          <div className='grow w-full md:w-auto mb-0'>
            <Label htmlFor='email' className='sr-only'>
              {inputLabel}
            </Label>
            <FormInput
              name='email'
              type='email'
              inputProps={{
                id: 'email',
                placeholder: !LSCanSubmit
                  ? t('Newsletter.alreadySubscribedShort')
                  : placeholderLabel || t('Global.subscribePlaceholder'),
                required: true,
                autoComplete: 'email',
                disabled: disabled || isPending || !LSCanSubmit,
                className: cn(
                  'flex-1 bg-white/90 border-0 text-black placeholder:text-gray-600 rounded-tl-lg rounded-bl-lg sm:rounded-tr-none rounded-br-none',
                  `shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.25)]`
                ),
              }}
              className='w-full min-w-[200px]'
            />
          </div>
          <PopoverTrigger asChild onClick={handlePopoverOpen}>
            <Button
              type='button'
              className={cn(
                'text-white px-8 font-semibold border-1 border-solid border-white mb-0',
                'uppercase font-semibold font-common'
              )}
              loading={isPending}
              disabled={!LSCanSubmit}
            >
              {t('Newsletter.button')}
            </Button>
          </PopoverTrigger>
          <button
            type='submit'
            className='invisible size-0 opacity-0'
            ref={buttonRef}
          />
        </form>
      </form.AppForm>
      <PopoverContent>
        <DynamicAltcha
          ref={altchaRef}
          language={locale}
          onStateChange={handleAltchaStateChange}
        />
      </PopoverContent>
    </Popover>

    //  <Button
    //    type='button'
    //    loading={isPending}
    //    disabled={!LSCanSubmit}
    //  >
    //    {buttonLabel}
    //  </Button>
  );
};

export default NewsletterForm;
