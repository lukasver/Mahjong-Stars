'use client';

import { useInputOptionsContext } from '@/components/hooks/use-input-options';
import { Stepper } from '@/components/stepper';
import {
  AnimatePresence,
  FadeAnimation,
  motion,
} from '@mjs/ui/components/motion';
import { cn } from '@mjs/ui/lib/utils';
import { Button } from '@mjs/ui/primitives/button';
import { FormInput } from '@mjs/ui/primitives/form-input';
import {
  UseAppForm,
  useAppForm,
  useFormContext,
} from '@mjs/ui/primitives/form/index';
import { useTranslations } from 'next-intl';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useCallback, useEffect } from 'react';
import { formSchemaShape, InputProps, SaleFormSchema } from './utils';
import { SaftEditor } from '../saft-editor';
import { useAction } from 'next-safe-action/hooks';
import { createSaftContract, createSale } from '@/lib/actions/admin';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { Icons } from '@mjs/ui/components/icons';
import { EditableFormField } from '@mjs/ui/primitives/form-input/editable-field';

const getInputProps = (
  key: keyof typeof formSchemaShape,
  t: ReturnType<typeof useTranslations>
) => {
  const inputProps = InputProps[key];
  return {
    name: key,
    type: inputProps.type,
    label: t(`${key}.label`),
    description: t(`${key}.description`),
    optionKey: inputProps.optionKey,
    props: inputProps.inputProps || {},
  };
};

const steps = [
  { id: 1, name: 'Create', description: 'Basic information' },
  { id: 2, name: 'Contract', description: 'Contract details' },
  { id: 3, name: 'Additional Information', description: 'Final details' },
];

const schemas = {
  1: SaleFormSchema,
  2: z.object({}),
  3: z.record(z.string(), z.string()),
} as const;

export const CreateSaleForm = () => {
  const [step, setStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  );
  const [saleId, setSaleId] = useQueryState(
    'saleId',
    parseAsString.withDefault('')
  );

  const saleAction = useAction(createSale);
  const saftAction = useAction(createSaftContract);
  const informationAction = useAction(updateProjectInformation);

  const form = useAppForm({
    validators: {
      onSubmit: schemas[step as keyof typeof schemas] || SaleFormSchema,
    },
    defaultValues: {},
    onSubmit: async ({ value }) => {
      if (step === 1) {
        //Create sale and update query params to reflect the current saleId
        const res = await saleAction.executeAsync(value as (typeof schemas)[1]);

        console.debug('🚀 ~ index.tsx:77 ~ res:', res);

        if (res?.data) {
          setSaleId(res.data.sale.id);
          // Go to next step
          setStep((pv) => pv + 1);
        }
      }
      if (step === 2) {
        const stepValues = value as (typeof schemas)[2];
        // Create Saft in DB and move no the next step
        const res = await saftAction.executeAsync({
          content: stepValues.content,
          name: stepValues.name,
          description: stepValues.description,
          saleId,
        });

        console.debug('🚀 ~ index.tsx:104 ~ onSubmit: ~ res:', res);

        setStep((pv) => pv + 1);
      }
      if (step === 3) {
        console.debug('🚀 ~ index.tsx:108 ~ onSubmit: ~ step:', step);
        informationAction.executeAsync(value as (typeof schemas)[3]);
        //Update project information and finish
        // setStep((pv) => pv + 1);
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

  return (
    <form.AppForm>
      <form onSubmit={handleSubmit}>
        <FadeAnimation delay={0.1} duration={0.5}>
          <SectionContainer title='Create a new sale' className='col-span-2'>
            <FormStepper />
            <SectionForm />
            <FormFooter />
          </SectionContainer>
        </FadeAnimation>
      </form>
    </form.AppForm>
  );
};

const SectionContainer = ({
  children,
  title = 'Create a New Sale',
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) => {
  return (
    <div className={cn('flex flex-col gap-6 justify-center', className)}>
      <h3 className='text-2xl font-bold text-primary-foreground text-center md:text-left font-heading'>
        {title}
      </h3>
      {children}
    </div>
  );
};

const FormStepper = ({ className }: { className?: string }) => {
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
    <div className='flex flex-col gap-4 min-h-[500px] h-full'>
      <AnimatePresence>
        {step === 1 && <TokenInformation key={1} saleId={saleId} />}
        {step === 2 && <SaftInformation key={2} saleId={saleId} />}
        {step === 3 && <ProjectInformation key={3} saleId={saleId} />}
      </AnimatePresence>
      {children}
    </div>
  );
};

const animation = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};

const TokenInformation = ({
  saleId,
  className,
}: {
  saleId?: string;
  className?: string;
}) => {
  const t = useTranslations('admin.sales.create.basic');
  const { options } = useInputOptionsContext();

  return (
    <motion.div {...animation}>
      <CardContainer
        title='Basic Information'
        description='Manage basic information'
        className={className}
      >
        <ul className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {Object.keys(formSchemaShape).map((key) => {
            const { name, type, label, description, props, optionKey } =
              getInputProps(key as keyof typeof formSchemaShape, t);
            if (optionKey && options) {
              props.options = options[optionKey as keyof typeof options];
            }
            return (
              <li key={key} className=''>
                <FormInput
                  name={name}
                  type={type}
                  label={label}
                  description={description}
                  message={true}
                  inputProps={props}
                />
              </li>
            );
          })}
        </ul>
      </CardContainer>
    </motion.div>
  );
};

const CardContainer = ({
  children,
  title,
  description,
  className,
  header,
}: {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  header?: React.ReactNode;
}) => {
  return (
    <Card className={className}>
      {header ? (
        header
      ) : (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      )}
      <CardContent className='space-y-6'>{children}</CardContent>
    </Card>
  );
};

const SaftInformation = ({
  saleId,
  className,
}: {
  saleId?: string;
  className?: string;
}) => {
  if (!saleId) {
    //TODO! improve
    return <div>No saleId</div>;
  }
  return (
    <motion.div {...animation}>
      <CardContainer
        title='SAFT Configuration'
        description='Manage SAFT shown to your investors when signing up.'
        className={className}
      >
        <SaftEditor
          saleId={saleId}
          placeholder={
            'Create or paste the SAFT content to generate a signeable version'
          }
        />
      </CardContainer>
    </motion.div>
  );
};

const ProjectInformation = ({
  saleId,
  className,
}: {
  saleId?: string;
  className?: string;
}) => {
  const form = useFormContext() as unknown as UseAppForm;
  const stepValue = form.getFieldValue('information');

  const handleAddField = () => {
    const value = form.getFieldValue('information') as unknown[];
    form.setFieldValue(
      'information',
      value.concat([
        {
          label: 'New Field',
          type: 'textarea',
          value: '',
        },
      ])
    );
  };

  useEffect(() => {
    console.debug('🚀 ~ index.tsx:334 ~ useEffect ~ stepValue:', stepValue);
  }, [stepValue]);

  if (!saleId) {
    //TODO! improve
    return <div>No saleId</div>;
  }

  return (
    <motion.div {...animation}>
      <CardContainer
        className={className}
        header={
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex-1'>Project Information</CardTitle>
              <Button
                variant='outline'
                size='icon'
                className='shrink-0'
                onClick={handleAddField}
                type='button'
              >
                <Icons.plus className='w-4 h-4' />
                <span className='sr-only'>Add information field</span>
              </Button>
            </div>
            <CardDescription>Manage project information</CardDescription>
          </CardHeader>
        }
      >
        <div className='flex flex-col gap-4'>
          <ul className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <form.Field name='information' mode='array'>
              {(field) => {
                return (
                  <>
                    {(field.state.value as unknown[])?.map((_, index) => (
                      <form.Field key={index} name={`information[${index}]`}>
                        {(itemField) => (
                          <EditableFormField
                            field={itemField}
                            index={index}
                            onRemove={(idx) => field.removeValue(idx)}
                          />
                        )}
                      </form.Field>
                    ))}
                    {(field.state.value as unknown[]).length === 0 && (
                      <div className='text-center py-12 text-muted-foreground'>
                        No fields yet. Click the + sign to.
                      </div>
                    )}
                  </>
                );
              }}
            </form.Field>
          </ul>
        </div>
      </CardContainer>
    </motion.div>
  );
};

const FormFooter = () => {
  const [step, setStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  );
  // https://github.com/TanStack/form/discussions/1335#discussioncomment-12685109
  const form = useFormContext() as unknown as UseAppForm;

  return (
    <div className='flex justify-between w-full'>
      <Button
        className={cn(step === 1 && 'invisible pointer-events-none')}
        variant='outline'
        type={'button'}
        onClick={() => setStep(step - 1)}
      >
        Back
      </Button>
      <form.SubmitButton className='min-w-32'>
        {step === steps.length - 1 ? 'Finish' : 'Next'}
      </form.SubmitButton>
    </div>
  );
};
const recommendedInputs = [
  {
    type: 'textarea',
    label: 'Summary',
  },
  {
    type: 'textarea',
    label: 'Token Utility',
  },
  {
    type: 'textarea',
    label: 'Tokenomics',
  },
] as const;

const saleInfoInputs: SaleInfoInput[] = [...recommendedInputs];

type SaleInfoInput = {
  type: 'text' | 'textarea' | 'file';
  value?: string;
  label: string;
};
