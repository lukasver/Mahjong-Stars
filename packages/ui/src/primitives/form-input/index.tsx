'use client';

import { ComponentProps } from 'react';
import { getInputClass, Input } from '../input';
import { useFormContext } from '../form/tanstack-form';
import { Textarea } from '../textarea';
import { PasswordInput } from './password';
import { InputTypes, SelectOption } from './types';
import { Checkbox } from '../checkbox';
import { cn } from '@mjs/ui/lib/utils';
import { SelectInput } from './select-input';
import { isObject } from 'motion/react';
import { DateInput, DateInputProps } from './date-input';
import { UseAppForm } from '../form';

interface DefaultInputProps extends ComponentProps<typeof Input> {
  options?: never;
  type: 'text';
}
interface SelectorInputProps extends ComponentProps<typeof SelectInput> {
  type: 'select';
  options: SelectOption[];
}

type InputUnionProps = DefaultInputProps | SelectorInputProps | DateInputProps;

export type FormInputProps = {
  id?: string;
  name: string;
  placeholder?: string;
  label?: string;
  description?: string;
  message?: true | null;
  className?: string;
  type: InputTypes | 'hidden';
  inputProps?: Partial<InputUnionProps> & {
    required?: boolean;
  };
};

// // Base interface with common properties
// type InputWrapperBaseProps = ControllerRenderProps<FieldValues, string> &
//   Pick<FormInputProps, 'placeholder' | 'type'>

// interface AutocompleteInputProps extends Omit<AutocompleteProps, 'type'> {
//   type: 'autocomplete' | 'multiselect'
//   options: SelectOption[]
//   onChange?: (value: SelectOption[]) => void
// }

// interface DefaultInputProps extends ComponentProps<typeof Input> {
//   options?: never
//   type: Exclude<InputTypeType, 'autocomplete' | 'multiselect'> | 'hidden'
// }
// interface TextAreaInputProps extends ComponentProps<typeof Textarea> {
//   type: 'textarea'
//   options?: never
// }
// interface AddressInputProps extends ComponentProps<typeof AddressInput> {
//   type: 'address'
//   options?: never
// }

// type DynamicInputProps =
//   | SelectorInputProps
//   | DefaultInputProps
//   | TextAreaInputProps
//   | CheckboxInputProps
//   | FileInputProps
//   | AutocompleteInputProps
//   | NumberInputProps
//   | SwitchInputProps
//   | PhoneInputProps
//   | SelectableCurrencyInputProps
//   | PasswordInputProps
//   | CountrySelectInputProps
//   | CalendarInputProps
//   | DateInputProps
//   | AddressInputProps
//   | AudioVideoLinkInputProps

type InputWrapperProps = Omit<FormInputProps['inputProps'], 'type'> & {
  type: FormInputProps['type'];
};

/**
 * Dynamic input component to be used under a RHF Form
 */
export function FormInput({
  name,
  type,
  label,
  message = true,
  description,
  className,
  ...props
}: FormInputProps) {
  const form = useFormContext() as unknown as UseAppForm;
  if (!form) {
    throw new Error('FormInput must be used within a Form');
  }

  return (
    <form.AppField name={name}>
      {(field) => (
        <field.FormItem className={cn(className)}>
          <div
            className={cn(
              type === 'checkbox' &&
                'flex flex-1 justify-between items-center gap-2',
              type === 'checkbox' && getInputClass(),
              type !== 'checkbox' && 'contents'
            )}
          >
            {label && (
              <field.FormLabel
                className={cn(
                  type === 'checkbox' && 'flex-1',
                  'text-foreground'
                )}
              >
                {label}
              </field.FormLabel>
            )}

            <field.FormControl>
              <InputWrapper
                type={type}
                {...props.inputProps}
                // @ts-expect-error fixme
                value={field.state.value}
                // @ts-expect-error fixme
                onChange={(e) => {
                  if (e instanceof Date) {
                    field.handleChange(e);
                    return;
                  }
                  if (isObject(e) && 'target' in e) {
                    if (e.target instanceof HTMLInputElement) {
                      field.handleChange(
                        type === 'checkbox' ? e.target.checked : e.target.value
                      );
                    }
                    return;
                  }
                  field.handleChange(e);
                }}
                onBlur={field.handleBlur}
              />
            </field.FormControl>
          </div>
          {description && (
            <field.FormDescription className={'overflow-x-auto truncate'}>
              {description}
            </field.FormDescription>
          )}
          {message && <field.FormMessage className='text-secondary-100' />}
        </field.FormItem>
      )}
    </form.AppField>
  );
}

function InputWrapper({ type, ...props }: InputWrapperProps) {
  switch (type) {
    case 'text':
      return <Input type='text' {...props} />;
    case 'number':
      return <Input type='number' {...props} />;
    case 'email':
      return <Input type='email' {...props} />;
    case 'password':
      return <PasswordInput type='password' {...props} />;
    case 'textarea':
      return <Textarea {...props} />;
    case 'checkbox':
      return <Checkbox {...props} />;
    case 'select':
      return <SelectInput {...(props as SelectorInputProps)} />;
    case 'date':
      return <DateInput {...(props as DateInputProps)} />;
    default:
      return <Input {...props} />;
  }
}
//   if (props.type === 'address') {
//     return <AddressInput {...(props as AddressInputProps)} />;
//   }

//   if (props.type === 'country') {
//     return <CountrySelectInput {...(props as CountrySelectInputProps)} />;
//   }

//   if (props.type === 'textarea') {
//     return <Textarea {...(props as TextAreaInputProps)} />;
//   }

//   if (props.type === 'file') {
//     return <FileInput {...(props as FileInputProps)} />;
//   }
//   if (props.type === 'checkbox') {
//     return <CheckboxInput {...(props as CheckboxInputProps)} />;
//   }

//   if (props.type === 'autocomplete' || props.type === 'multiselect') {
//     if (props.type === 'multiselect') {
//       throw new Error('Multiselect is not supported yet');
//     }
//     return <Autocomplete {...(props as AutocompleteInputProps)} />;
//   }

//   if (props.type === 'number') {
//     return <NumberInput {...(props as NumberInputProps)} />;
//   }

//   if (props.type === 'date') {
//     return <DateInput {...(props as DateInputProps)} />;
//   }

//   if (props.type === 'calendar') {
//     return <CalendarInput {...(props as CalendarInputProps)} />;
//   }

//   if (props.type === 'phone') {
//     return <PhoneInput {...(props as PhoneInputProps)} />;
//   }

//   if (props.type === 'switch') {
//     return <SwitchInput {...(props as SwitchInputProps)} />;
//   }

//   if (props.type === 'currency') {
//     return (
//       <ControlledCurrencyInput {...(props as SelectableCurrencyInputProps)} />
//     );
//   }

//   if (props.type === 'password') {
//     return <PasswordInput {...(props as PasswordInputProps)} />;
//   }

//   if (props.type === 'signable') {
//     return <SignableInput {...(props as SignableInputProps)} />;
//   }

//   if (props.type === 'video_link' || props.type === 'audio_link') {
//     return <AudioVideoLinkInput {...(props as AudioVideoLinkInputProps)} />;
//   }

//   return <Input {...(props as DefaultInputProps)} />;
// });
