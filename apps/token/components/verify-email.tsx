'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { FormInput } from '@mjs/ui/primitives/form-input';
import { useAppForm } from '@mjs/ui/primitives/form';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { z } from 'zod';
import { useAction } from 'next-safe-action/hooks';
import {
  createEmailVerification,
  validateMagicWord,
  verifyEmail,
} from '@/lib/actions';
import { AnimatePresence, motion } from '@mjs/ui/components/motion';
import { Button } from '@mjs/ui/primitives/button';
import { useActionListener } from '@mjs/ui/hooks/use-action-listener';
import useActiveAccount from './hooks/use-active-account';
import { useLocalStorage } from 'usehooks-ts';
import { cn } from '@mjs/ui/lib/utils';
import { getGlassyCardClassName } from '@mjs/ui/components/cards';

const titleMapping = {
  1: {
    title: 'Magic word',
    description: 'Please enter your invitation code if you have one',
  },
  2: {
    title: 'Enter your email',
    description: 'Please enter your email to continue.',
  },
  3: {
    title: 'Verify email',
    description: 'Please enter the code sent to your email.',
  },
};

const MW_KEY = 'mjs-mw';

export function VerifyEmail({ token }: { token: string }) {
  const [magicWord] = useLocalStorage(MW_KEY, '');
  const [step, setStep] = useState<1 | 2 | 3>(token ? 3 : magicWord ? 2 : 1);
  const router = useRouter();

  const handleCancel = async () => {
    router.push('/dashboard');
  };

  const handleNextStep = (step: 1 | 2 | 3) => {
    setStep(step);
  };

  return (
    <Card className={getGlassyCardClassName('shadow-2xl')}>
      <CardHeader>
        <CardTitle>{titleMapping[step]?.title}</CardTitle>
        <CardDescription>{titleMapping[step]?.description}</CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        <AnimatePresence>
          {step === 1 && (
            <MagicWordForm
              key={1}
              onCancel={handleCancel}
              onSuccess={() => handleNextStep(2)}
            />
          )}
          {step === 2 && (
            <VerifyEmailForm
              key={2}
              onCancel={handleCancel}
              onSuccess={() => handleNextStep(3)}
            />
          )}
          {step === 3 && (
            <VerifyTokenForm
              key={2}
              token={token}
              onCancel={() => setStep((pv) => (pv - 1) as 1 | 2 | 3)}
            />
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

const ValidateEmailSchema = z.object({
  email: z.string().min(1, { message: 'Email is required' }).trim(),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
});

/**
 * MagicWordForm component for entering the invitation code.
 * @param onCancel - Callback when the user cancels the form.
 * @param onSuccess - Callback when the form is successfully submitted.
 */
const MagicWordForm = ({
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const [_, setMagicWord] = useLocalStorage(MW_KEY, '');
  const { signout, isConnected } = useActiveAccount();

  const action = useActionListener(useAction(validateMagicWord), {
    onSuccess: () => {
      setMagicWord(MW_KEY);
      onSuccess?.();
    },
  });

  const [isLoading, startTransition] = useTransition();
  const form = useAppForm({
    validators: {
      onSubmit: z.object({
        invitationCode: z
          .string()
          .min(1, { message: 'Invitation code is required' })
          .trim(),
      }),
    },
    defaultValues: {
      invitationCode: '',
    },
    onSubmit: ({ value }) =>
      action.execute({ invitationCode: value.invitationCode }),
  });

  const handleCancel = useCallback(() => {
    startTransition(async () => {
      await signout();
    });
  }, [isConnected, signout, startTransition]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  return (
    <motion.div {...animation}>
      <form.AppForm>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <FormInput
            name='invitationCode'
            type='text'
            label='Invitation code'
            inputProps={{
              placeholder: 'Enter your invitation code',
              autoComplete: 'off',
              required: true,
            }}
          />
          <CardFooter className='flex gap-2 justify-between p-0'>
            <Button
              variant='outline'
              className='flex-1'
              type='button'
              onClick={handleCancel}
              loading={isLoading}
              disabled={action.isExecuting}
            >
              Cancel
            </Button>
            <Button
              variant='accent'
              className='flex-1'
              type='submit'
              disabled={isLoading}
              loading={action.isExecuting}
            >
              Continue
            </Button>
          </CardFooter>
        </form>
      </form.AppForm>
    </motion.div>
  );
};

export const VerifyEmailForm = ({
  onCancel,
  onSuccess,
  canSkip = true,
  defaultEmail,
}: {
  onCancel?: () => void;
  onSuccess: () => void;
  canSkip?: boolean;
  defaultEmail?: string;
}) => {
  const { execute, isExecuting } = useActionListener(
    useAction(createEmailVerification),
    {
      onSuccess,
      successMessage: 'Verification code sent to your email address',
    }
  );

  const onSubmit = (values: z.infer<typeof ValidateEmailSchema>) => {
    execute({
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
    });
  };
  const form = useAppForm({
    validators: {
      onSubmit: ValidateEmailSchema,
    },
    defaultValues: {
      email: defaultEmail ?? '',
      firstName: '',
      lastName: '',
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

  const isLoading = isExecuting;

  return (
    <motion.div {...animation}>
      <form.AppForm>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <FormInput
              name='firstName'
              type='text'
              label='First name (optional)'
              inputProps={{
                placeholder: 'Tony',
                required: false,
              }}
            />
            <FormInput
              name='lastName'
              type='text'
              label='Last name (optional)'
              inputProps={{
                placeholder: 'Kong',
                required: false,
              }}
            />
          </div>
          <FormInput
            name='email'
            type='email'
            label='Enter email'
            inputProps={{
              placeholder: 'tony@mahjongstars.com',
              autoComplete: 'off',
            }}
          />
          <CardFooter className='flex gap-2 justify-between p-0'>
            {canSkip && (
              <Button
                variant='outline'
                className='flex-1'
                disabled={isLoading}
                type='button'
                onClick={onCancel}
              >
                Skip
              </Button>
            )}
            <Button
              variant='accent'
              className={cn('flex-1')}
              type='submit'
              loading={isLoading}
            >
              {canSkip ? 'Continue' : 'Send code'}
            </Button>
          </CardFooter>
        </form>
      </form.AppForm>
    </motion.div>
  );
};

export const VerifyTokenForm = ({
  token,
  onCancel,
  onSuccess,
  noMessage = false,
}: {
  token: string;
  onCancel: () => void;
  onSuccess?: () => void;
  noMessage?: boolean;
}) => {
  const router = useRouter();
  const [disabled, setDisabled] = useState(false);
  const { execute, isExecuting } = useActionListener(useAction(verifyEmail), {
    successMessage: noMessage
      ? undefined
      : 'Email verified, redirecting to dashboard...',
    onSuccess: () => {
      if (onSuccess) {
        setDisabled(true);
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    },
  });
  const form = useAppForm({
    validators: {
      onSubmit: z.object({
        token: z.string().min(1, { message: 'Token is required' }).trim(),
        firstName: z.string().trim(),
        lastName: z.string().trim(),
      }),
    },
    defaultValues: {
      token: token ?? '',
      firstName: '',
      lastName: '',
    },
    onSubmit: ({ value }) => execute(value),
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  return (
    <motion.div {...animation}>
      <form.AppForm>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <FormInput
            name='token'
            type='text'
            label='Enter code'
            inputProps={{
              autoComplete: 'off',
            }}
          />
          <CardFooter className='flex gap-2 justify-between p-0'>
            <Button
              variant='outline'
              className='flex-1'
              disabled={isExecuting || disabled}
              type='button'
              onClick={onCancel}
            >
              back
            </Button>
            <Button
              variant='accent'
              className='flex-1'
              type='submit'
              loading={isExecuting}
              disabled={disabled}
            >
              Verify
            </Button>
          </CardFooter>
        </form>
      </form.AppForm>
    </motion.div>
  );
};

const animation = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};
