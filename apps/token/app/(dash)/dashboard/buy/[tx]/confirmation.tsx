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
import { useState } from 'react';
import { getFileUploadPresignedUrl } from '@/lib/actions';
import { uploadFile } from '@/lib/utils/files';
import { useSaleSaft, useTransactionById } from '@/lib/services/api';
import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

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
 * Extracts Handlebars-style variables from a template string.
 * E.g., "Hello {{name}}" => ["name"]
 */
function extractTemplateVariables(template: string): string[] {
  const regex = /{{\s*(\w+)\s*}}/g;
  const variables = new Set<string>();
  let match;
  while ((match = regex.exec(template))) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}

/**
 * Renders a preview of the contract with variables replaced by user input.
 */
function renderTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(
    /{{\s*(\w+)\s*}}/g,
    (_, key) => values[key] || `<${key}>`
  );
}

/**
 * KYC Document Upload Step
 * Allows user to upload up to 3 files for KYC verification.
 * Uses FileUpload component for file selection and removal.
 * On submit, uploads files using presigned URLs.
 */
const KycUploadDocument = () => {
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
   * Removes a file from the list by index.
   * @param index - Index of the file to remove
   */
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
      const validFiles = files
        .map((f) => (isFileWithPreview(f) ? f.file : null))
        .filter((f): f is File => !!f);
      await Promise.all(
        validFiles.map(async (file) => {
          const key = `kyc/${file.name}`;
          const urlRes = await getFileUploadPresignedUrl({ key });
          if (!urlRes?.data?.url) throw new Error('Failed to get upload URL');
          await uploadFile(file, urlRes.data.url);
        })
      );
      setSuccess(true);
      setFiles([]);
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
      {/* List of selected files with remove buttons */}
      {files.length > 0 && (
        <div className='mt-4 space-y-2'>
          {files.map((f, i) =>
            isFileWithPreview(f) ? (
              <div
                key={i}
                className='flex items-center justify-between border rounded px-3 py-2'
              >
                <span className='truncate'>{f.file.name}</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleRemoveFile(i)}
                >
                  Remove
                </Button>
              </div>
            ) : null
          )}
        </div>
      )}
      {error && <div className='text-destructive mt-2'>{error}</div>}
      {success && (
        <div className='text-success mt-2'>Files uploaded successfully!</div>
      )}
      <Button
        className='mt-4 w-full'
        onClick={handleSubmit}
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
const SaftReviewStep = () => {
  const { tx: txId } = useParams();
  const { data: tx, isLoading } = useTransactionById(txId as string);

  let saleId: string = '';
  if (
    !isLoading &&
    tx &&
    tx.transaction &&
    'sale' in tx.transaction &&
    tx.transaction.sale &&
    'id' in tx.transaction.sale
  ) {
    saleId = String(tx.transaction.sale.id);
  }
  const { data, error } = useSaleSaft(saleId);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Use .template if available, otherwise .content
  const saft: Record<string, unknown> | undefined =
    data?.saft && typeof data.saft === 'object' && data.saft !== null
      ? (data.saft as Record<string, unknown>)
      : undefined;
  const template =
    (saft &&
      (typeof saft.template === 'string'
        ? saft.template
        : typeof saft.content === 'string'
        ? saft.content
        : '')) ||
    '';
  const variables = useMemo(
    () => extractTemplateVariables(template),
    [template]
  );

  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      variables.forEach((v) => {
        if (!(v in next)) next[v] = '';
      });
      return next;
    });
  }, [variables]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = variables.every((v) => values[v]?.trim());

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
    <CardContent>
      <CardHeader>
        <CardTitle>SAFT Review</CardTitle>
        <CardDescription>
          Please review the contract and fill in the required information below.
          This is a preview; signature will be handled separately.
        </CardDescription>
      </CardHeader>
      <form
        className='space-y-4'
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        {variables.map((v) => (
          <div key={v} className='flex flex-col gap-1'>
            <label htmlFor={`saft-var-${v}`} className='font-medium'>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </label>
            <input
              id={`saft-var-${v}`}
              className='input input-bordered px-3 py-2 rounded border'
              value={values[v] || ''}
              onChange={(e) => handleChange(v, e.target.value)}
              required
            />
            {submitted && !values[v]?.trim() && (
              <span className='text-xs text-destructive'>
                This field is required.
              </span>
            )}
          </div>
        ))}

        <div className='mt-6'>
          <CardTitle className='text-base mb-2'>Contract Preview</CardTitle>
          <div
            className='whitespace-pre-wrap border rounded p-3 prose prose-invert'
            dangerouslySetInnerHTML={{
              __html: renderTemplate(template, values),
            }}
          />
        </div>
        <Button type='submit' className='w-full' disabled={!isValid}>
          Sign Contract
        </Button>
      </form>
    </CardContent>
  );
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
  const paymentMethod = (tx.transaction as { formOfPayment?: string })
    ?.formOfPayment;
  const currency = (tx.transaction as { paidCurrency?: string })?.paidCurrency;
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
    <CardContent>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>
          Please follow the instructions below to complete your payment.
        </CardDescription>
      </CardHeader>
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
            <label htmlFor='confirmation-id' className='font-medium'>
              Payment Reference / Confirmation Number
            </label>
            <input
              id='confirmation-id'
              className='input input-bordered px-3 py-2 rounded border w-full'
              value={confirmationId}
              onChange={(e) => setConfirmationId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className='font-medium'>Upload Bank Slip (optional)</label>
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
          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Payment Confirmation'}
          </Button>
        </form>
      ) : (
        <div className='py-8 text-center'>
          <div className='mb-2'>
            <span className='font-medium'>Crypto payment</span> (coming soon)
          </div>
          <div className='text-muted-foreground'>
            Please follow the instructions for crypto payment in the next step.
          </div>
        </div>
      )}
    </CardContent>
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
    <Card className='px-4'>
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
  initialStep = 1,
}: {
  steps: { id: number; name: string; description: string }[];
  initialStep: number;
}) {
  const [step, setStep] = useState(initialStep);
  return (
    <ErrorBoundary fallback={<div>Error with transaction confirmation</div>}>
      <div className='container mx-auto p-4 space-y-4 max-w-3xl'>
        <FormStepper steps={steps} step={step} setStep={setStep} />
        <Card>
          <AnimatePresence>
            {step === 1 && <KycUploadDocument />}
            {step === 2 && <SaftReviewStep />}
            {step === 3 && <PaymentStep />}
            {step === 4 && <div>Confirmation</div>}
          </AnimatePresence>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
