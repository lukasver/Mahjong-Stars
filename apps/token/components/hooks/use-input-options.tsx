'use client';

import { useInputOptions } from '@/lib/services/api';
import { SelectOption } from '@mjs/ui/primitives/form-input/types';
import { createContext, useContext } from 'react';

type InputOptionsContextType = Pick<
  ReturnType<typeof useInputOptions>,
  'isLoading' | 'error' | 'refetch'
> & {
  options: {
    fiatCurrencies: SelectOption[];
    blockchain: SelectOption[];
    token: SelectOption[];
  } | null;
};

const InputOptionsContext = createContext<InputOptionsContextType | null>(null);

export const InputOptionsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data, isLoading, error, refetch } = useInputOptions();
  return (
    <InputOptionsContext
      value={{ options: data?.data ?? null, isLoading, error, refetch }}
    >
      {children}
    </InputOptionsContext>
  );
};

export const useInputOptionsContext = () => {
  const context = useContext(InputOptionsContext);
  if (context === null) {
    throw new Error(
      'useInputOptionsContext must be used within a InputOptionsProvider'
    );
  }
  return context;
};
