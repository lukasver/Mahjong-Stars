'use client';

import { Button } from '@mjs/ui/primitives/button';
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
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { z } from 'zod';
import useActiveAccount from './hooks/use-active-account';

export function VerifyEmail() {
  const searchParams = useSearchParams();

  const { signout, isLoading } = useActiveAccount();
  const token = searchParams.get('token');
  // const router = useRouter();
  const onSubmit = async ({ token }: { token: string }) => {
    // startTransition(async () => {
    //   const error = {};
    //   // const { data, error } = await authClient.verifyEmail({
    //   //   query: {
    //   //     token,
    //   //   },
    //   // });
    //   console.debug('verify-email.tsx:33 ~ error:', error);
    //   if (error) {
    //     const message =
    //       error?.code === 'INVALID_TOKEN'
    //         ? 'Invalid token'
    //         : 'Something went wrong';
    //     toast.error(message);
    //     return;
    //   }
    //   router.refresh();
    // });
  };

  // const action = useActionListener(useAction(verifyEmail));
  const form = useAppForm({
    validators: { onSubmit: z.object({ token: z.string().min(1).trim() }) },
    defaultValues: {
      token: token ?? '',
    },
    onSubmit: ({ value }) => onSubmit(value),
  });

  const handleCancel = async () => {
    await signout();
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  return (
    <form.AppForm>
      <form onSubmit={handleSubmit}>
        <Card className='bg-transparent'>
          <CardHeader>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              Please enter the code sent to your email if asked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormInput
              name='token'
              type='text'
              label='Enter code'
              inputProps={{
                autoComplete: 'off',
              }}
            />
          </CardContent>
          <CardFooter className='flex gap-2 justify-between'>
            <Button
              variant='outline'
              className='flex-1'
              disabled={isLoading}
              type='button'
              onClick={handleCancel}
            >
              Cancel
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
        </Card>
      </form>
    </form.AppForm>
  );
}
