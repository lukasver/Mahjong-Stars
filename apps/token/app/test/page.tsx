'use client';

import { Button } from '@mjs/ui/primitives/button';
import {
  UseAppForm,
  useAppForm,
  useFormContext,
} from '@mjs/ui/primitives/form/index';
import { useCallback } from 'react';
import { useAction } from 'next-safe-action/hooks';
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
import { createSaftContract } from '@/lib/actions/admin';

const FormSchema = z.object({
  // content: z.coerce.string(),
  // name: z.string().trim(),
  // description: z.string().trim(),
  // saleId: z.string().trim(),
  information: z.record(z.string(), z.string()).array(),
});

export default function Page() {
  const { execute, result, isExecuting } = useAction(createSaftContract);

  console.debug('🚀 ~ page.tsx:21 ~ result:', result);

  // const [state, action] = useActionState(createSaftContract, initialFormState);
  const saleId = 'cmcyrf1kt000r8o72ess9y14u';

  const form = useAppForm({
    validators: { onSubmit: FormSchema },
    defaultValues: {
      // content: '',
      // name: '',
      // description: '',
      // saleId,
      information: [
        {
          label: 'Summary',
          type: 'textarea',
          value: '',
        },
      ],
    },
    onSubmit: ({ value }) => {
      console.log('VALL', value);
      execute(value);
    },
    // transform: useTransform((baseForm) => mergeForm(baseForm, state!), [state]),
  });

  const initialText = 'Type your notification message here...';

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  return (
    <div className='container mx-auto'>
      <form.AppForm>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* <div className='max-w-lg'>
            <SaftEditor saleId={saleId} placeholder={initialText} />
            <div className='flex justify-end'>
              <Button
                className='w-full'
                loading={isExecuting}
                type='submit'
                onClick={() => {
                  const content = form.getFieldValue('content');
                  console.log(content);
                }}
              >
                Save
              </Button>
            </div>
          </div> */}

          <ProjectInformation saleId={saleId} />
        </form>
      </form.AppForm>
    </div>
  );
}
{
  /* <div className='w-full max-w-md'>
          <FormInput name='test' type='date' />
        </div> */
}

const ProjectInformation = ({
  saleId,
  className,
}: {
  saleId?: string;
  className?: string;
}) => {
  const form = useFormContext() as unknown as UseAppForm;

  if (!saleId) {
    //TODO! improve
    return <div>No saleId</div>;
  }

  // Helper to add a new field to the information array
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

  const handleCheck = () => {
    console.log('form', form.getFieldValue('information'));
  };

  return (
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
                  {(field.state.value as unknown[]).map((_, index) => (
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
        <Button type='button' onClick={handleCheck} className='w-full'>
          check
        </Button>
      </div>
    </CardContainer>
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
