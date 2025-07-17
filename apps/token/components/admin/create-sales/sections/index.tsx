'use client';

import { useInputOptionsContext } from '@/components/hooks/use-input-options';
import { motion } from '@mjs/ui/components/motion';
import { Button } from '@mjs/ui/primitives/button';
import { FormInput } from '@mjs/ui/primitives/form-input';
import { UseAppForm, useFormContext } from '@mjs/ui/primitives/form/index';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { formSchemaShape, InputProps } from '../utils';
import { SaftEditor } from '../saft-editor';
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { Icons } from '@mjs/ui/components/icons';
import { EditableFormField } from '@mjs/ui/primitives/form-input/editable-field';
import { CardContainer } from '@mjs/ui/components/cards';
import { cn } from '@mjs/ui/lib/utils';
import { useSale } from '@/lib/services/api';

type ProjectInfoField = {
  label: string;
  type: string;
  value: string;
  props?: Record<string, unknown>;
};

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

export const TokenInformation = ({
  saleId,
  className,
}: {
  saleId?: string;
  className?: string;
}) => {
  const t = useTranslations('admin.sales.create.basic');
  const { data, isLoading } = useSale(saleId);

  console.debug('🚀 ~ index.tsx:48 ~ data, isLoading:', data, isLoading);
  const form = useFormContext() as unknown as UseAppForm;
  const { options } = useInputOptionsContext();

  useEffect(() => {
    if (data && !isLoading) {
      const sale = data.sale;
      form.reset(sale);
    }
  }, [data, isLoading]);

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
              //@ts-expect-error - TODO: fix this
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

export const SaftInformation = ({
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

export const ProjectInformation = ({
  saleId,
  className,
}: {
  saleId?: string;
  className?: string;
}) => {
  const form = useFormContext() as unknown as UseAppForm;
  const stepValue = form.getFieldValue('information');

  const handleAddField = (
    field: ProjectInfoField | ProjectInfoField[] = {
      label: 'New Field',
      type: 'textarea',
      value: '',
    }
  ) => {
    const value = (form.getFieldValue('information') as unknown[]) || [];
    form.setFieldValue(
      'information',
      value.concat(Array.isArray(field) ? field : [field])
    );
  };

  useEffect(() => {
    if (!stepValue) {
      const value = form.getFieldValue('information') as unknown[];
      if (!value?.length) {
        handleAddField(initialFields);
      }
    }
  }, [stepValue]);

  if (!saleId) {
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
                onClick={() => handleAddField()}
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
                    {(field.state.value as unknown[])?.length === 0 && (
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

export const SectionContainer = ({
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

const animation = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};

const initialFields = [
  {
    label: 'Banner image',
    type: 'file',
    value: '',
    props: {
      required: true,
      type: 'image',
      maxSizeMB: 10,
      isBanner: true,
    },
  },
  {
    label: 'Token image',
    type: 'file',
    value: '',
    props: {
      required: true,
      type: 'image',
      maxSizeMB: 10,
      isTokenImage: true,
    },
  },
  {
    label: 'Summary',
    type: 'textarea',
    value: '',
  },
] satisfies ProjectInfoField[];
