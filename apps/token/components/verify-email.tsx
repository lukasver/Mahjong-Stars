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
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { useAction } from 'next-safe-action/hooks';
import { createEmailVerification, verifyEmail } from '@/lib/actions';
import { AnimatePresence, motion } from '@mjs/ui/components/motion';
import { Button } from '@mjs/ui/primitives/button';
import { useActionListener } from '@mjs/ui/hooks/use-action-listener';

export function VerifyEmail({ token }: { token: string }) {
  const [step, setStep] = useState<1 | 2>(token ? 2 : 1);
  const router = useRouter();

  const handleCancel = async () => {
    router.push('/dashboard');
  };

  return (
    <Card className='shadow-2xl'>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Please enter the code sent to your email if asked.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        <AnimatePresence>
          {step === 1 && (
            <VerifyEmailForm
              key={1}
              onCancel={handleCancel}
              onSuccess={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <VerifyTokenForm key={2} token={token} onCancel={handleCancel} />
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

const VerifyEmailForm = ({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const { execute, isExecuting } = useActionListener(
    useAction(createEmailVerification),
    { onSuccess }
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
      email: '',
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
            <Button
              variant='outline'
              className='flex-1'
              disabled={isLoading}
              type='button'
              onClick={onCancel}
            >
              Skip
            </Button>
            <Button
              variant='accent'
              className='flex-1'
              type='submit'
              loading={isLoading}
            >
              Continue
            </Button>
          </CardFooter>
        </form>
      </form.AppForm>
    </motion.div>
  );
};

const VerifyTokenForm = ({
  token,
  onCancel,
}: {
  token: string;
  onCancel: () => void;
}) => {
  const router = useRouter();
  const { execute, isExecuting } = useActionListener(useAction(verifyEmail), {
    successMessage: 'Email verified, redirecting to dashboard...',
    onSuccess: () => {
      router.push('/dashboard');
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
              disabled={isExecuting}
              type='button'
              onClick={onCancel}
            >
              Skip
            </Button>
            <Button
              variant='accent'
              className='flex-1'
              type='submit'
              loading={isExecuting}
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
