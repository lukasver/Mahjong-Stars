'use client';
import { useDebouncedValue } from '@mjs/ui/hooks/use-debounced-value';
import { cn } from '@mjs/ui/lib/utils';
import { Icons } from '@mjs/ui/components/icons';
import {
  SelectItem,
  SelectContent,
  Select,
  SelectTrigger,
  SelectValue,
  ChevronSelectIcon,
} from '@mjs/ui/primitives/select';
import { useQueryState } from 'nuqs';
import React, { useTransition } from 'react';

export interface SearchSelectProps {
  placeholder: string;
  onSearch?: (value: string) => void;
  className?: string;
  options: { label: string; value: string }[];
  queryKey?: string;
}

const SearchSelect = ({
  placeholder,
  onSearch,
  className,
  options,
  queryKey = 'q',
}: SearchSelectProps) => {
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = React.useState<string | null>(null);
  const [loading, value] = useDebouncedValue(searchValue, 500);
  const [, setDebouncedValue] = useQueryState(queryKey, {
    startTransition,
  });

  const handleClear = () => {
    setSearchValue(null);
  };

  const handleChange = (value: string) => {
    if (value === 'clear') {
      handleClear();
    } else {
      setSearchValue(value);
      onSearch?.(value);
    }
  };

  React.useEffect(() => {
    if ((value && !loading) || !searchValue) {
      setDebouncedValue(!searchValue ? null : value);
    }
  }, [value, searchValue]);

  const CustomIcon = searchValue ? (
    isPending ? (
      <Icons.loader className='text-primary ml-2 size-4 animate-spin' />
    ) : (
      <ChevronSelectIcon />
    )
  ) : null;

  return (
    <Select value={searchValue || ''} onValueChange={handleChange}>
      <SelectTrigger className={cn(className)} icon={CustomIcon}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='clear'>All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
SearchSelect.displayName = 'SearchSelect';

export { SearchSelect };
