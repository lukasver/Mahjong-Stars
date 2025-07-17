'use client';

import { cn } from '@mjs/ui/lib/utils';
import React, { useRef, useState } from 'react';

import { Button } from '../button';
import { getInputClass, Input } from '../input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';
import { SelectOption } from './types';

export interface SelectInputProps extends React.ComponentProps<typeof Select> {
  options: SelectOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  create?: boolean;
  createLabel?: string;
}

export function SelectInput({ options, ...rest }: SelectInputProps) {
  const { onChange, value, placeholder, className, create, createLabel } = rest;

  const [shouldCreate, setShouldCreate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (shouldCreate) {
    return (
      <div className='relative'>
        <Input
          className={cn('w-full', className)}
          ref={inputRef}
          name={rest.name}
          placeholder='Type in a new option...'
        />
        <Button
          variant='ghost'
          // size='xs'
          className='absolute top-1 right-0 text-xs font-normal mb-1'
          onClick={() => setShouldCreate(false)}
          tabIndex={-1}
        >
          Cancel
        </Button>
      </div>
    );
  }

  const handleShouldCreate = () => {
    setShouldCreate(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const onValueChange = (v: SelectOption['value']) => {
    onChange?.(String(v));
  };

  return (
    <Select onValueChange={onValueChange} defaultValue={value} {...rest}>
      <SelectTrigger
        className={cn(
          'w-full relative cursor-pointer shadow-xs',
          getInputClass(),
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options?.map(({ value, id, label, disabled }) => {
          return (
            <SelectItem key={id} value={String(value)} disabled={disabled}>
              {label}
            </SelectItem>
          );
        })}
        {create && (
          <Button
            variant='ghost'
            size='sm'
            className='border-t border-t-input focus:bg-primary/10 focus:text-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
            onClick={handleShouldCreate}
          >
            <span>{createLabel || 'Create'}</span>
          </Button>
        )}
      </SelectContent>
    </Select>
  );
}
