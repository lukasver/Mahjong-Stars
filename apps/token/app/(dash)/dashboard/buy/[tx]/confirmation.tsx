'use client';

import { Stepper } from '@/components/stepper';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { AnimatePresence } from '@mjs/ui/components/motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { FileUpload } from '@mjs/ui/components/file-upload';
import { Button } from '@mjs/ui/primitives/button';
import { useCallback, useState } from 'react';
import {
  associateDocumentsToUser,
  generateContractForTransaction,
  getFileUploadPrivatePresignedUrl,
} from '@/lib/actions';
import { uploadFile } from '@/lib/utils/files';
import {
  useSaftForTransactionDetails,
  useSaleSaftForTransaction,
  useTransactionById,
  useUser,
} from '@/lib/services/api';
import { useParams } from 'next/navigation';
import { useAppForm } from '@mjs/ui/primitives/form';
import { z } from 'zod';
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
import { SuccessContent } from './[status]/success';
import { getGlassyCardClassName } from '@mjs/ui/components/cards';

/**
 * Type guard for FileWithPreview
 */
function isFileWithPreview(obj: unknown): obj is { file: File } {
  return (
    !!obj &&
    typeof obj === 'object' &&
    'file' in obj &&
    obj.file instanceof File
  );
}

/**
 * KYC Document Upload Step
 * Allows user to upload up to 3 files for KYC verification.
 * Uses FileUpload component for file selection and removal.
 * On submit, uploads files using presigned URLs.
 */
const KycUploadDocument = ({ onSuccess }: { onSuccess: () => void }) => {
  const { data: user } = useUser();
  const [files, setFiles] = useState<unknown[]>([]); // Array of FileWithPreview
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handles file selection for the input (multiple files)
   * @param fileList - Array of FileWithPreview
   */
  const handleFilesChange = (fileList: unknown[]) => {
    setFiles(fileList.slice(0, 3));
    setError(null);
    setSuccess(false);
  };

  /**
   * Handles the upload of all selected files.
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      invariant(user, 'User id could not be found');
      const validFiles = files
        .map((f) => (isFileWithPreview(f) ? f.file : null))
        .filter((f): f is File => !!f);
      const response = await Promise.all(
        validFiles.map(async (file) => {
          const key = `user/${user.id}/kyc/${file.name}`;
          const urlRes = await getFileUploadPrivatePresignedUrl({ key });
          if (!urlRes?.data?.url) throw new Error('Failed to get upload URL');
          await uploadFile(file, urlRes.data.url).then();
          // Here i need to update our backend with refernece to the file
          return key;
        })
      );

      const keys = response.flatMap((key) => ({ key }));
      console.debug('🚀 ~ confirmation.tsx:119 ~ keys:', keys);
      const result = await associateDocumentsToUser({
        documents: keys,
      });

      console.debug('🚀 ~ confirmation.tsx:123 ~ result:', result);

      setSuccess(true);
      setFiles([]);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardContent>
      <CardHeader>
        <CardTitle>KYC Document Upload</CardTitle>
        <CardDescription>
          Please upload your documents for your KYC verification (id / passport
          / proof of tax residence).
        </CardDescription>
      </CardHeader>
      <FileUpload
        type='all'
        maxSizeMB={5}
        className='w-full'
        multiple
        onFilesChange={handleFilesChange}
      />

      {error && <div className='text-destructive mt-2'>{error}</div>}
      {success && (
        <div className='text-success mt-2'>Files uploaded successfully!</div>
      )}
      <Button
        className='mt-4 w-full'
        onClick={handleSubmit}
        variant='accent'
        disabled={isSubmitting || files.length === 0}
      >
        {isSubmitting ? 'Uploading...' : 'Submit KYC Documents'}
      </Button>
    </CardContent>
  );
};

/**
 * Step 2: SAFT Review and Variable Input
 * Fetches the SAFT contract, renders input fields for variables, and shows a live preview.
 */
const SaftReviewStep = ({ onSuccess }: { onSuccess: () => void }) => {
  const { tx: txId } = useParams();
  // const { data: tx, isLoading } = useTransactionById(txId as string);
  const { data, error, isLoading } = useSaleSaftForTransaction(txId as string);
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
      // @ts-expect-error wontfix
      onSubmit: z.object({
        transactionId: z.string().min(1),
        contractId: z.string().min(1),
        variables: z
          .record(z.string(), z.string().or(z.record(z.string(), z.string())))
          .optional(),
      }),
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
      // @ts-expect-error fixme
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

  if (isLoading) return <CardContent>Loading SAFT...</CardContent>;

  if (error)
    return (
      <CardContent className='text-destructive'>
        Error loading SAFT: {error}
      </CardContent>
    );
  if (!template)
    return <CardContent>No SAFT template found for this sale.</CardContent>;

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
};

const ConfirmationStep = () => {
  return (
    <div>
      <SuccessContent />
    </div>
  );
};

const SaftGenerationDialog = ({
  id,
  enabled,
  onClose,
  onConfirmSignature,
}: {
  enabled: boolean;
  id: string | null;
  onClose: () => void;
  onConfirmSignature: () => void;
}) => {
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

  return <ContractDialogFailed onClose={handleCancelGeneration} />;
};

const labelMapping = {
  'recipient.firstName': 'Your First Name',
  'recipient.lastName': 'Your Last Name',
  'recipient.address': 'Your Address',
  'recipient.city': 'Your City',
  'recipient.zipcode': 'Your Zipcode',
  'recipient.country': 'Your Country',
  'recipient.taxId': 'Your Tax ID',
  'recipient.state': 'Your State',
  'recipient.email': 'Recipient Email',
  'recipient.phone': 'Recipient Phone',
};

const getLabel = (v: string) => {
  const label = labelMapping[v as keyof typeof labelMapping];
  if (!label) {
    return v.charAt(0).toUpperCase() + v.slice(1);
  }
  return label;
};

/**
 * Step 3: Payment Step
 * Shows payment instructions and collects payment confirmation info.
 */
const PaymentStep = () => {
  const { tx: txId } = useParams();
  const { data: tx, isLoading } = useTransactionById(txId as string);
  const [confirmationId, setConfirmationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (isLoading) return <CardContent>Loading payment details...</CardContent>;
  if (!tx) return <CardContent>Transaction not found.</CardContent>;

  // TODO: Confirm the correct path for payment fields and type properly
  const paymentMethod = tx?.transaction?.formOfPayment;

  // WE need to get the transfer details

  const currency = tx?.transaction?.paidCurrency;
  // Example bank details (replace with real data as needed)
  const bankDetails = {
    accountName: 'Example Corp',
    iban: 'DE89 3704 0044 0532 0130 00',
    swift: 'COBADEFFXXX',
    bankName: 'Commerzbank',
    address: 'Kaiserplatz, 60311 Frankfurt am Main, Germany',
  };

  /**
   * Handles the upload of the bank slip file.
   */
  const handleBankSlipChange = () => {
    // No-op for now
  };

  /**
   * Handles the payment confirmation submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    // TODO: Implement actual submission logic (call server action)
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1000);
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>
          Please follow the instructions below to complete your payment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentMethod === 'TRANSFER' ? (
          <form className='space-y-4' onSubmit={handleSubmit}>
            <div>
              <div className='font-medium mb-1'>Bank Details</div>
              <div className='text-sm'>
                <div>Bank Name: {bankDetails.bankName}</div>
                <div>Account Name: {bankDetails.accountName}</div>
                <div>IBAN: {bankDetails.iban}</div>
                <div>SWIFT: {bankDetails.swift}</div>
                <div>Bank Address: {bankDetails.address}</div>
                <div>Currency: {currency}</div>
              </div>
            </div>
            <div>
              <label className='font-medium'>
                Upload Bank Transfer Receipt
              </label>
              <FileUpload
                type='all'
                maxSizeMB={5}
                className='w-full'
                multiple={false}
                onFilesChange={handleBankSlipChange}
              />
            </div>
            {error && <div className='text-destructive mt-2'>{error}</div>}
            {success && (
              <div className='text-success mt-2'>
                Payment confirmation submitted!
              </div>
            )}
            <Button
              type='submit'
              className='w-full'
              disabled={isSubmitting}
              variant='accent'
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payment Confirmation'}
            </Button>
          </form>
        ) : (
          <div className='py-8 text-center'>
            <div className='mb-2'>
              <span className='font-medium'>Crypto payment</span> (coming soon)
            </div>
            <div className='text-muted-foreground'>
              Please follow the instructions for crypto payment in the next
              step.
            </div>
          </div>
        )}
      </CardContent>
    </>
  );
};

const FormStepper = ({
  className,
  steps,
  step,
  setStep,
}: {
  className?: string;
  steps: { id: number; name: string; description: string }[];
  step: number;
  setStep: (step: number) => void;
}) => {
  return (
    <Card className={getGlassyCardClassName('px-4')}>
      <Stepper
        currentStep={step}
        steps={steps}
        className={className}
        onStepClick={setStep}
      />
    </Card>
  );
};

export function TransactionConfirmation({
  steps,
  initialStep,
}: {
  steps: { id: number; name: string; description: string }[];
  initialStep: { id: number; name: string; description: string };
}) {
  const [step, setStep] = useState<(typeof steps)[number]>(
    initialStep || steps[0]
  );
  const handleStepChange = (step: number) => {
    const foundStep = steps.find((s) => s.id === step);
    if (foundStep) {
      setStep(foundStep);
    }
  };

  return (
    <ErrorBoundary fallback={<div>Error with transaction confirmation</div>}>
      <div className='container mx-auto p-4 space-y-4 max-w-3xl'>
        <FormStepper steps={steps} step={step.id} setStep={handleStepChange} />
        <Card className={getGlassyCardClassName()}>
          <AnimatePresence>
            {step.name === 'KYC' && (
              <KycUploadDocument
                onSuccess={() => setStep(steps.find((s) => s.name === 'SAFT'))}
              />
            )}
            {step.name === 'SAFT' && (
              <SaftReviewStep
                onSuccess={() =>
                  setStep(steps.find((s) => s.name === 'Payment'))
                }
              />
            )}
            {step.name === 'Payment' && (
              <PaymentStep
                onSuccess={() =>
                  setStep(steps.find((s) => s.name === 'Confirmation'))
                }
              />
            )}
            {step.name === 'Confirmation' && <ConfirmationStep />}
          </AnimatePresence>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

const getVariablesAsNestedObjects = (variables: string[]) => {
  variables.reduce(
    (acc, v) => {
      const keys = v.split('.');
      let curr = acc;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (i === keys.length - 1) {
          // @ts-expect-error wontfix
          curr[key] = '';
        } else {
          // @ts-expect-error wontfix
          if (!curr[key] || typeof curr[key] !== 'object') {
            // @ts-expect-error wontfix
            curr[key] = {};
          }
          // @ts-expect-error wontfix
          curr = curr[key] as Record<string, string>;
        }
      }
      return acc;
    },
    {} as Record<string, string | Record<string, string>>
  );
};
