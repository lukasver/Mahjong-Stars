'use client';

import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '../button';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { cn } from '@mjs/ui/lib/utils';
import { Calendar } from '../calendar';
import { DateTime } from 'luxon';

export interface DateInputProps {
  value?: string | Date;
  className?: string;
  onChange?: (date: Date) => void;
  type: 'date';
  placeholder?: string;
  disabled?: (date: Date) => boolean;
}

const getValue = (value: Date | string | undefined): Date | undefined => {
  let date: DateTime | undefined = undefined;
  if (!value) {
    date = undefined;
  }
  if (DateTime.isDateTime(value)) {
    date = value;
  }
  if (value instanceof Date) {
    date = DateTime.fromJSDate(value);
  }
  if (typeof value === 'string') {
    date = DateTime.fromISO(value);
  }

  return date?.isValid ? date.toJSDate() : undefined;
};

export function DateInput({ ...props }: DateInputProps) {
  const {
    onChange,
    value,
    placeholder = 'Pick a date',
    className,
    disabled,
  } = props;

  const date = getValue(value);

  const handleChange = (date: Date) => {
    onChange?.(date);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-empty={!value}
          className={cn(
            'data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal w-full',
            '[&>span]:flex [&>span]:flex-1 [&>span]:items-center [&>span]:justify-center [&>span]:gap-4',
            className
          )}
        >
          <CalendarIcon />
          {date ? date.toLocaleDateString() : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={handleChange}
          required
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
