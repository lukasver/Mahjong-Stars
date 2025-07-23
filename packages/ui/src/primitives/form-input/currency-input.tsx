'use client';

import { cn } from '@mjs/ui/lib/utils';
import * as React from 'react';
import CurrencyInputField, {
  CurrencyInputOnChangeValues,
} from 'react-currency-input-field';
import { z } from 'zod';
import { useFormContext } from '../form/tanstack-form';
import { UseAppForm } from '../form';
import { Label } from '../label';

import { getInputClass } from '../input';
import { Skeleton } from '../skeleton';

export interface CurrencyInputProps
  extends Omit<
    React.ComponentProps<typeof CurrencyInputField>,
    'value' | 'onChange'
  > {
  type: 'currency';
  value?: CurrencyInputOnChangeValues | string | undefined;
  options?: never;
  onChange?: (value: CurrencyInputOnChangeValues | undefined) => void;
  loading?: boolean;
}

const CurrencyInputValidator = z.coerce.string().max(21).trim();

const isCurrencyInputOnChangeValues = (
  value: unknown
): value is CurrencyInputOnChangeValues => {
  return Boolean(value && typeof value === 'object' && 'value' in value);
};

const CurrencyInput = ({
  className,
  onWheel,
  ref,
  value,
  onChange,
  loading,
  ...props
}: CurrencyInputProps) => {
  const parsedValue: string | undefined = isCurrencyInputOnChangeValues(value)
    ? value.value
    : value
    ? String(value)
    : undefined;

  if (loading) {
    return (
      <div className={cn(getInputClass(), className)}>
        <Skeleton className='w-1/6 h-6 bg-secondary-100' />
      </div>
    );
  }
  return (
    <CurrencyInputField
      className={cn(getInputClass(), className)}
      ref={ref}
      transformRawValue={CurrencyInputValidator.parse}
      value={parsedValue}
      onValueChange={(_value, _name, values) => {
        onChange?.(values);
      }}
      {...props}
    />
  );
};

CurrencyInput.displayName = 'CurrencyInput';

const CurrencyFormInput = ({
  name,
  label,
  defaultValue,
  onChange,
  ...props
}: {
  name: string;
  label: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  prefix?: string;
}) => {
  const form = useFormContext() as unknown as UseAppForm;
  const uniqueId = React.useId();
  return (
    <form.Field
      name={name}
      // biome-ignore lint/correctness/noChildrenProp: <explanation>
      children={(field) => (
        <>
          {label && (
            <Label htmlFor={`${name}-${uniqueId}`} className='mb-1'>
              {label}
            </Label>
          )}
          <CurrencyInput
            type='currency'
            id={`${name}-${uniqueId}`}
            defaultValue={defaultValue}
            onChange={(v) => {
              field.handleChange(v);
              onChange?.(v?.value ?? '');
            }}
            onBlur={field.handleBlur}
            {...props}
          />
        </>
      )}
    />
  );
};

export interface SelectableCurrencyInputProps
  extends Omit<
    React.ComponentProps<typeof CurrencyInput>,
    'onChange' | 'value'
  > {
  options?: never;
  type: 'currency';
  // intlConfig?: IntlConfig;
  onChange?: (value: CurrencyInputOnChangeValues | undefined) => void;
  value?: CurrencyInputOnChangeValues;
  onChangeCurrency?: (currency: string | null) => void;
}

export { CurrencyFormInput, CurrencyInput };
