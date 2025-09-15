'use client';

import { toast } from '@mjs/ui/primitives/sonner';
import { useEffect } from 'react';

type OptProps = {
  onSuccess?: (data: unknown) => void;
  onError?: (err: string) => void;
  successMessage?: string;
  errorMessage?: string;
};

/**
 * @description
 * This hook is used to listen to the result of an action and render a toast or call a function
 * @param action - The action to listen to
 * @param opts - The options for the hook
 * @returns null
 */
export function useActionListener<T>(
  action: T,
  opts: OptProps = {
    successMessage: '',
    errorMessage: 'Failed to execute',
  }
) {
  // biome-ignore lint/suspicious/noExplicitAny: Need to better type SafeActionFn<T>
  const { result, status } = action as any;
  const {
    successMessage = '',
    errorMessage = 'Failed to execute',
  } = opts;

  useEffect(() => {
    if (status === 'hasErrored') {
      let err: string = '';
      if (result.validationErrors) {
        Object.entries(result.validationErrors).forEach(([field, error]) => {
          // @ts-expect-error fixme
          if ('_errors' in error) {
            // @ts-expect-error fixme
            const errMsg = `${field}: ${error._errors?.join(', ') ?? ''}`;
            if (errorMessage) {
              toast.error(errMsg);
            }
            err += errMsg + '\n';
          }
        });
        opts.onError?.(err);
        return;
      }

      err = result?.serverError ?? errorMessage ?? 'Unknown error ocurred';

      if (errorMessage) {
        toast.error(err);
      }
      opts.onError?.(err);
      return;
    }

    if (status === 'hasSucceeded') {
      if (successMessage) {
        toast.success(successMessage);
      }
      opts.onSuccess?.(result?.data);
      return;
    }
  }, [!!result, status]);

  return action as T;
}
