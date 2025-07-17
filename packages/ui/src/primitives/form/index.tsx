import { createFormHook, type AnyFieldApi } from '@tanstack/react-form';
import {
  FormLabel,
  fieldContext,
  formContext,
  FormControl,
  FormDescription,
  FormMessage,
  FormItem,
  useFormContext,
  useFieldContext,
} from './tanstack-form';
import { mergeForm, useTransform, useStore } from '@tanstack/react-form';

import { SubmitButton } from './buttons';
import { formOptions } from '@tanstack/react-form/nextjs';
import { initialFormState } from '@tanstack/react-form/nextjs';

const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    FormItem,
  },
  formComponents: {
    SubmitButton,
  },
});

type UseAppForm = ReturnType<typeof useAppForm>;

export {
  useAppForm,
  useFormContext,
  useFieldContext,
  withForm,
  formOptions,
  initialFormState,
  useTransform,
  mergeForm,
  useStore,
  type UseAppForm,
  type AnyFieldApi,
};
