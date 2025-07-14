import { ActiveSale, ActiveSaleRes } from '@/common/types/sales';
import { createSaleInformation } from '@/lib/actions';
import { Button } from '@mjs/ui/primitives/button';
import { FormInput } from '@mjs/ui/primitives/form-input';
import { toast } from '@mjs/ui/primitives/sonner';
import { useAppForm } from '@mjs/ui/primitives/form';
import { Check, Pencil, X } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { z } from 'zod';

export const EditEmailContact = ({
  sale,
  mutate,
}: {
  sale: ActiveSale;
  mutate: (data?: ActiveSaleRes | Promise<ActiveSaleRes>) => void;
}) => {
  const [edit, setEdit] = useState(false);
  const contactEmail = sale?.saleInformation?.contactEmail || '';

  const onSubmit = async ({ contactEmail }: { contactEmail: string }) => {
    if (!contactEmail) {
      toast.error('Please enter a valid email');
      return;
    }
    const paramObj = { contactEmail, saleId: sale.id };
    try {
      const data = await createSaleInformation(paramObj);
      if (data?.data) {
        toast.success('Email updated');
        mutate();
        setEdit(false);
      } else {
        throw new Error(
          data?.serverError ||
            JSON.stringify(data?.validationErrors) ||
            'Unknown error'
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const form = useAppForm({
    validators: { onSubmit: z.object({ contactEmail: z.string().email() }) },
    defaultValues: {
      contactEmail: contactEmail,
    },
    onSubmit: ({ value }) => onSubmit(value),
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
      {contactEmail && !edit ? (
        <form className='flex gap-4 items-center w-full'>
          <FormInput
            name='contactEmail'
            type='email'
            label='Contact email'
            inputProps={{
              value: contactEmail,
              disabled: true,
              readOnly: true,
            }}
          />
          <span className='text-xs text-muted-foreground'>
            This is your contact email. ✅
          </span>
          <Button
            type='button'
            size='icon'
            variant='ghost'
            onClick={() => setEdit(true)}
            aria-label='Edit email'
          >
            <Pencil className='w-5 h-5' />
          </Button>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit}
          className='flex gap-4 items-center w-full'
        >
          <FormInput
            name='contactEmail'
            type='email'
            label='Contact email'
            inputProps={{
              placeholder: 'your@email.com',
              autoFocus: true,
            }}
          />
          <span className='text-xs text-muted-foreground'>
            Enter your contact email.
          </span>
          <Button
            type='submit'
            size='icon'
            variant='ghost'
            aria-label='Save email'
          >
            <Check className='w-5 h-5' />
          </Button>
          {contactEmail && (
            <Button
              type='button'
              size='icon'
              variant='ghost'
              onClick={() => setEdit(false)}
              aria-label='Cancel edit'
            >
              <X className='w-5 h-5' />
            </Button>
          )}
        </form>
      )}
    </form.AppForm>
  );
};
