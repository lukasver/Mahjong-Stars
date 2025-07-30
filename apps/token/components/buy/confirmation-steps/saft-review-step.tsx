'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { Button } from '@mjs/ui/primitives/button';
import { generateContractForTransaction } from '@/lib/actions';
import {
  useSaleSaftForTransaction,
  useSaftForTransactionDetails,
  useRecipientForCurrentTransactionSaft,
} from '@/lib/services/api';
import { useParams } from 'next/navigation';
import { useAppForm } from '@mjs/ui/primitives/form';
import { FormInput } from '@mjs/ui/primitives/form-input';
import { useAction } from 'next-safe-action/hooks';
import { useActionListener } from '@mjs/ui/hooks/use-action-listener';
import { parseAsString, useQueryState } from 'nuqs';
import { invariant } from '@epic-web/invariant';
import { toast } from '@mjs/ui/primitives/sonner';
import { AlertDialog } from '@mjs/ui/primitives/alert-dialog';
import { useBeforeUnload } from '@/components/hooks/use-before-unload';
import { ContractDialogFailed } from '@/components/buy/contract/dialog-failed';
import { ContractDialogConfirmSignature } from '@/components/buy/contract/dialog-confirm-signature';
import { ContractDialogLoading } from '@/components/buy/contract/dialog-loading';
import { getLabel, getVariablesAsNestedObjects, saftFormSchema } from './utils';

interface SaftReviewStepProps {
  onSuccess: () => void;
}

/**
 * Step 2: SAFT Review and Variable Input
 * Fetches the SAFT contract, renders input fields for variables, and shows a live preview.
 */
export function SaftReviewStep({ onSuccess }: SaftReviewStepProps) {
  const { tx: txId } = useParams();
  const { data, error, isLoading } = useSaleSaftForTransaction(txId as string);
  const { data: recipient, isLoading: isRecipientLoading } =
    useRecipientForCurrentTransactionSaft(data?.id ? data.id : undefined);

  console.debug('🚀 ~ saft-review-step.tsx:46 ~ recipient:', recipient);

  const [cid, setCid] = useQueryState('cid', parseAsString);
  const [openDialog, setOpenDialog] = useState(!!cid);

  const action = useActionListener(useAction(generateContractForTransaction), {
    successMessage: 'Document generation in process, please stand by...',
    onSuccess: (_data) => {
      const data = _data as unknown as { id: string };
      if (data && data.id) {
        setCid(data.id);
        setOpenDialog(true);
      } else {
        toast.error('Error generating contract');
      }
    },
  });

  const form = useAppForm({
    validators: {
      // @ts-expect-error Complex form validation schema
      onSubmit: saftFormSchema,
    },
    defaultValues: {
      contractId: data?.id,
      transactionId: txId as string,
      variables: getVariablesAsNestedObjects(data?.missingVariables || []),
    },

    onSubmit: ({ value }) => {
      // Avoid executing multiple times
      if (action.isExecuting) return;
      invariant(data, 'Error retrieving sale saft data');
      const formData = {
        ...value,
        contractId: value.contractId || data.id,
        transactionId: value.transactionId || (txId as string),
      };
      action.execute(formData);
    },
  });

  const variables = data?.missingVariables || [];
  const template = data?.content as string;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  useEffect(() => {
    if (isRecipientLoading) return;
    // In case user has already a generated SAFT for this tx, open the modal so he can confirm signature
    if (recipient && recipient?.recipient?.status === 'SENT_FOR_SIGNATURE') {
      setCid(recipient.recipient.id);
      setOpenDialog(!!recipient.recipient.id);
    }
  }, [isRecipientLoading, recipient]);

  if (isLoading) return <CardContent>Loading SAFT...</CardContent>;

  if (error)
    return (
      <CardContent className='text-destructive'>
        Error loading SAFT: {error}
      </CardContent>
    );
  if (!template)
    return (
      <CardContent>
        <CardHeader>
          <CardTitle>No SAFT template found for this sale.</CardTitle>
          <CardDescription>You can proceed to next step</CardDescription>
          <Button variant='accent' onClick={() => onSuccess()} className='mt-4'>
            Next
          </Button>
        </CardHeader>
      </CardContent>
    );

  return (
    <>
      <CardHeader>
        <CardTitle>SAFT Review</CardTitle>
        <CardDescription>
          Please review the contract and fill in the required information below.
          This is a preview; signature will be handled separately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form className='space-y-4' onSubmit={handleSubmit}>
            <div className='grid grid-cols-2 gap-4'>
              {variables.map((v) => (
                <FormInput
                  key={v}
                  name={`variables.${v}`}
                  type='text'
                  label={getLabel(v)}
                />
              ))}
            </div>

            <div className='mt-6'>
              <CardTitle className='text-base mb-2'>Contract Preview</CardTitle>
              <div className='max-h-3xl overflow-y-auto'>
                <div
                  className='border rounded p-3 prose prose-invert w-full max-w-none! max-h-96 sm:max-h-svh overflow-y-auto'
                  dangerouslySetInnerHTML={{
                    __html: template,
                  }}
                />
              </div>
            </div>
            <Button
              type='submit'
              variant='accent'
              className='w-full'
              loading={action.isExecuting}
            >
              Sign Contract
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  console.log('ERRORS', form.getAllErrors());
                  console.log('VALS', form.state.values);
                }}
              >
                Reset
              </Button>
            )}
          </form>
        </form.AppForm>
      </CardContent>
      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <SaftGenerationDialog
          enabled={openDialog}
          id={cid}
          onClose={() => setOpenDialog(false)}
          onConfirmSignature={() => {
            setOpenDialog(false);
            toast.success('Document signed');
            // Remove the cid from the parameters once signature is done
            setCid(null);
            onSuccess();
          }}
        />
      </AlertDialog>
    </>
  );
}

interface SaftGenerationDialogProps {
  enabled: boolean;
  id: string | null;
  onClose: () => void;
  onConfirmSignature: () => void;
}

const SaftGenerationDialog = ({
  id,
  enabled,
  onClose,
  onConfirmSignature,
}: SaftGenerationDialogProps) => {
  useBeforeUnload(
    'Make sure to sign the contract before closing the page. You can always come back to it later.'
  );
  const [_, setCid] = useQueryState('cid', parseAsString);
  const { data, isLoading } = useSaftForTransactionDetails(
    id as string,
    enabled
  );

  if (!enabled || !id) return null;

  const status = data?.recipient.status;

  const handleCancelGeneration = () => {
    // Close the dialog and reset the state
    // This will be handled by the parent component through the AlertDialog onOpenChange
    console.log('Contract generation cancelled by user');
    setCid(null);
    onClose?.();
  };

  if (isLoading || status === 'CREATED') {
    return (
      <ContractDialogLoading
        onCancel={handleCancelGeneration}
        status={status || undefined}
      />
    );
  }

  if (data && status && ['SIGNED', 'SENT_FOR_SIGNATURE'].includes(status)) {
    return (
      <ContractDialogConfirmSignature id={id} onSuccess={onConfirmSignature} />
    );
  }

  return (
    <ContractDialogFailed
      onClose={handleCancelGeneration}
      recipient={data?.recipient}
    />
  );
};
