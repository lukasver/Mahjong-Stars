'use client';

import { useAppForm } from '@mjs/ui/primitives/form/index';
import { useCallback } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { z } from 'zod';
import { createSaftContract } from '@/lib/actions/admin';
import { getFileUploadPresignedUrl } from '@/lib/actions';
import { uploadFile } from '@/lib/utils/files';
import { useLocale } from 'next-intl';
import { Invest } from '../(dash)/dashboard/buy/invest';
import { useActiveSale } from '@/lib/services/api';
import { InputOptionsProvider } from '@/components/hooks/use-input-options';

const FormSchema = z.object({
  // content: z.coerce.string(),
  // name: z.string().trim(),
  // description: z.string().trim(),
  // saleId: z.string().trim(),
  information: z.record(z.string(), z.string()).array(),
});

const DiscriminatedUnion = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('textarea'),
    value: z.string(),
    label: z.string(),
  }),
  z.object({
    type: z.literal('text'),
    value: z.string(),
    label: z.string(),
  }),
  z.object({
    type: z.literal('file'),
    value: z.instanceof(File),
    label: z.string(),
  }),
]);

const schemas = {
  1: z.any(),
  2: z.object({
    content: z.string(),
    name: z.string(),
    description: z.string(),
  }),
  3: z.object({
    information: z.array(DiscriminatedUnion),
  }),
} as const;

type FileType = Extract<z.infer<typeof DiscriminatedUnion>, { type: 'file' }>;

export default function Page() {
  const { execute, result, isExecuting } = useAction(createSaftContract);

  // const [state, action] = useActionState(createSaftContract, initialFormState);

  const { data: sale } = useActiveSale();
  const form = useAppForm({
    // validators: { onSubmit: FormSchema },
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
    onSubmit: async ({ value }) => {
      const values = schemas[3].parse(value);
      const fileValues = values.information.filter(
        (item) => item.type === 'file'
      ) as unknown as FileType[];

      try {
        const res = await Promise.all(
          fileValues.map(async ({ value }) => {
            const fileName = `${sale?.id}/${value.name}`;
            return getFileUploadPresignedUrl({ key: fileName }).then(
              async (url) => {
                if (url?.data) {
                  return uploadFile(value, url.data.url);
                } else {
                  throw new Error('Error getting presigned url');
                }
              }
            );
          })
        );
        console.log('RES', res);
      } catch (e) {
        console.log('ERROR', e);
      }
      // execute(value);
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
  const locale = useLocale();

  if (!sale) {
    return <div>NO SALEEE</div>;
  }

  return (
    <InputOptionsProvider>
      <div className='container mx-auto'>
        {/* <form.AppForm>
          <form onSubmit={handleSubmit} className='space-y-4'> */}
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

        {/* <ProjectInformation saleId={saleId} /> */}

        {/* </form>
        </form.AppForm> */}
        <Invest sale={sale} />
      </div>
    </InputOptionsProvider>
  );
}
{
  /* <div className='w-full max-w-md'>
          <FormInput name='test' type='date' />
        </div> */
}
