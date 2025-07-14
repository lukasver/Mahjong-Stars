'use client';

import { Stepper } from '@/components/stepper';
import { AnimatePresence, FadeAnimation } from '@mjs/ui/components/motion';
import { Button } from '@mjs/ui/primitives/button';
import { useAppForm } from '@mjs/ui/primitives/form/index';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { FileType, getSteps, SaleFormSchema, SaleSchemas } from './utils';
import { useAction } from 'next-safe-action/hooks';
import {
  createSaftContract,
  createSale,
  updateSale,
} from '@/lib/actions/admin';
import { Card } from '@mjs/ui/primitives/card';
import { toast } from '@mjs/ui/primitives/sonner';
import { uploadFile } from '@/lib/utils/files';
import { getFileUploadPresignedUrl } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import ErrorBoundary from '@mjs/ui/components/error-boundary';
import { FormFooter } from './sections/footer';
import {
  ProjectInformation,
  SaftInformation,
  SectionContainer,
  TokenInformation,
} from './sections';
import { useTranslations } from 'next-intl';

export const CreateSaleForm = () => {
  const router = useRouter();
  const [step, setStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  );
  const [saleId, setSaleId] = useQueryState(
    'saleId',
    parseAsString.withDefault('')
  );
  const t = useTranslations('admin.sales.create');

  const saleAction = useAction(createSale);
  const saftAction = useAction(createSaftContract);
  const informationAction = useAction(updateSale);

  const form = useAppForm({
    validators: {
      onSubmit: SaleSchemas[step as keyof typeof SaleSchemas] || SaleFormSchema,
    },
    defaultValues: {},

    onSubmitInvalid: ({ formApi }) => {
      const { form, fields } = formApi.getAllErrors();
      const allErrors: string[] = [];
      Object.values(fields)?.forEach((field) => {
        field.errors.forEach(({ errors }: { errors: string[] }) => {
          allErrors.push(errors?.join(', '));
        });
      });
      toast.error(allErrors.join(', '));
    },
    onSubmit: async ({ value, formApi }) => {
      console.debug('SUBMITTING', value);
      try {
        if (step === 1) {
          const vals = SaleSchemas[1].parse(value);
          //Create sale and update query params to reflect the current saleId
          const res = await saleAction.executeAsync(vals);
          if (res?.data) {
            setSaleId(res.data.sale.id);
            // Go to next step
            setStep((pv) => pv + 1);
          }
        }
        if (step === 2) {
          const vals = SaleSchemas[2].parse(value);
          const f = formApi.getFieldMeta('content');

          console.debug('🚀 ~ index.tsx:80 ~ onSubmit: ~ f:', f);

          if (f?.isPristine) {
            toast.error('Please fill in the Saft contract');
            return;
          }

          return;
          // Create Saft in DB and move no the next step
          await saftAction.executeAsync({
            content: vals.content,
            name: vals.name,
            description: vals.description,
            saleId,
          });
          setStep((pv) => pv + 1);
        }
        if (step === 3) {
          const values = SaleSchemas[3].parse(value);
          const fileValues = values.information.filter(
            (item) => item.type === 'file'
          ) as unknown as FileType[];
          let uploadedFiles: {
            type: 'file';
            value: string;
            label: string;
          }[] = [];
          const nonFileValues = values.information.filter(
            (item) => item.type !== 'file'
          );
          if (fileValues.length > 0) {
            const uploads = await Promise.all(
              fileValues.map(async ({ value }) => {
                const fileName = `${saleId}/${value.name}`;
                return getFileUploadPresignedUrl({ key: fileName }).then(
                  async (url) => {
                    if (url?.data) {
                      return uploadFile(
                        { file: value, name: fileName },
                        url.data.url
                      );
                    } else {
                      throw new Error('Error getting presigned url');
                    }
                  }
                );
              })
            );

            uploadedFiles = fileValues.map((file, i) => ({
              type: 'file',
              label: file.label,
              value: uploads[i]?.fileName!,
            }));
          }

          const submitValues: {
            type: 'text' | 'textarea' | 'file';
            value: string;
            label: string;
          }[] = [...nonFileValues, ...uploadedFiles];

          const result = await informationAction.executeAsync({
            data: { information: submitValues },
            id: saleId,
          });
          if (result?.data) {
            toast.success('Information submitted successfully');
            router.push(`/admin/sales`);
          }
        }
      } catch (e) {
        toast.error(
          `Error submitting sale: ${
            e instanceof Error ? e.message : 'Unknown error'
          }`
        );
      }
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );
  const steps = getSteps(t);

  return (
    <form.AppForm>
      <form onSubmit={handleSubmit}>
        <FadeAnimation delay={0.1} duration={0.5}>
          <SectionContainer title='Create a new sale' className='col-span-2'>
            <FormStepper steps={steps} />
            <SectionForm />
            <FormFooter steps={steps} />
          </SectionContainer>
        </FadeAnimation>
        <Button
          onClick={() => console.debug(form.getFieldValue('information'))}
        >
          checkvalue
        </Button>
        <Button onClick={() => console.debug(form.getAllErrors())}>
          Check errors
        </Button>
      </form>
    </form.AppForm>
  );
};

const FormStepper = ({
  className,
  steps,
}: {
  className?: string;
  steps: { id: number; name: string; description: string }[];
}) => {
  const [step, setStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  );
  return (
    <Card>
      <Stepper
        currentStep={step}
        steps={steps}
        className={className}
        onStepClick={setStep}
      />
    </Card>
  );
};

const SectionForm = ({ children }: { children?: React.ReactNode }) => {
  const [step] = useQueryState(
    'step',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  );
  const [saleId] = useQueryState('saleId', parseAsString.withDefault(''));

  if (!step) return null;
  return (
    <ErrorBoundary fallback={<div>Error with creating sale section</div>}>
      <div className='flex flex-col gap-4 min-h-[300px] h-full'>
        <AnimatePresence>
          {step === 1 && <TokenInformation key={1} saleId={saleId} />}
          {step === 2 && <SaftInformation key={2} saleId={saleId} />}
          {step === 3 && <ProjectInformation key={3} saleId={saleId} />}
        </AnimatePresence>
        {children}
      </div>
    </ErrorBoundary>
  );
};
