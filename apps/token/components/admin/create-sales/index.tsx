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
  updateSale,
  upsertSale,
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
import { useSale } from '@/lib/services/api';
import { getQueryClient } from '@/app/providers';
import { InformationSchemaAsStrings } from '@/common/schemas/dtos/sales/information';

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
  const { data } = useSale(saleId);

  const sale = data?.sale;

  const saleAction = useAction(upsertSale);
  const saftAction = useAction(createSaftContract);
  const informationAction = useAction(updateSale);

  const form = useAppForm({
    validators: {
      onSubmit: SaleSchemas[step as keyof typeof SaleSchemas] || SaleFormSchema,
    },
    defaultValues: {},

    onSubmitInvalid: ({ formApi }) => {
      const { fields } = formApi.getAllErrors();
      const allErrors: string[] = [];

      if (fields) {
        Object.entries(fields).forEach(([fieldName, fieldValue]) => {
          fieldValue.errors.forEach((error) => {
            // @ts-expect-error wontfix
            allErrors.push(`${fieldName}: ${error.message}`);
          });
        });
      }

      toast.error(allErrors.join('\n'));
    },

    onSubmit: async ({ value, formApi }) => {
      console.debug('SUBMITTING', value);
      const queryClient = getQueryClient();

      try {
        if (step === 1) {
          const vals = SaleSchemas[1].parse(value);
          //Create sale and update query params to reflect the current saleId
          const res = await saleAction.executeAsync(vals);
          if (res?.data) {
            setSaleId(res.data.sale.id);
            // Go to next step
            setStep((pv) => pv + 1);
            queryClient.invalidateQueries({ queryKey: ['sales'] });
          } else {
            throw new Error(
              res?.serverError ||
                res?.validationErrors?._errors?.join(', ') ||
                'Error creating sale'
            );
          }
        }
        if (step === 2) {
          const vals = SaleSchemas[2].parse(value);
          const f = formApi.getFieldMeta('content');

          if (sale?.saftCheckbox === true && f?.isPristine) {
            toast.error('Please fill in the Saft contract');
            return;
          }
          if (f?.isPristine) {
            setStep((pv) => pv + 1);
            return;
          }

          // Create Saft in DB and move no the next step
          const res = await saftAction.executeAsync({
            content: vals.content,
            name: vals.name,
            description: vals.description,
            saleId,
          });
          if (res?.data) {
            setStep((pv) => pv + 1);
            queryClient.invalidateQueries({
              queryKey: ['sales', saleId, 'saft'],
            });
          } else {
            throw new Error(
              res?.serverError ||
                res?.validationErrors?._errors?.join(', ') ||
                'Error creating saft'
            );
          }
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
                const fileName = `${saleId}/${(value as File).name}`;
                return getFileUploadPresignedUrl({ key: fileName }).then(
                  async (url) => {
                    if (url?.data) {
                      return uploadFile(
                        { file: value as File, name: fileName },
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
              props: file.props,
            }));
          }

          const result = await informationAction.executeAsync({
            data: InformationSchemaAsStrings.parse({
              information: [...nonFileValues, ...uploadedFiles],
            }),
            id: saleId,
          });
          if (result?.data) {
            queryClient.invalidateQueries({
              queryKey: ['sales', saleId],
            });
            toast.success('Information submitted successfully');
            router.push(`/admin/sales`);
          } else {
            throw new Error(
              result?.serverError ||
                result?.validationErrors?._errors?.join(', ') ||
                'Error submitting information'
            );
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
        {process.env.NODE_ENV === 'development' && (
          <>
            <Button
              onClick={() => console.debug(form.getFieldValue('information'))}
            >
              checkvalue
            </Button>
            <Button onClick={() => console.debug(form.getAllErrors())}>
              Check errors
            </Button>
          </>
        )}
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
