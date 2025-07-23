'use client';
import { cn } from '@mjs/ui/lib/utils';
import { useQueryState } from 'nuqs';
import { useEffect, useState, useTransition } from 'react';
import { useDebouncedValue } from '@mjs/ui/hooks/use-debounced-value';
import { Icons } from '@mjs/ui/components/icons';
import { Input } from '@mjs/ui/primitives/input';

export const SearchBar = ({
  placeholder,
  onSearch,
  className,
}: {
  placeholder: string;
  onSearch?: (value: string) => void;
  className?: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState<string | null>(null);
  const [loading, value] = useDebouncedValue(searchValue, 500);
  const [, setDebouncedValue] = useQueryState('searchBy', {
    startTransition,
  });

  const handleClear = () => {
    setSearchValue(null);
  };

  const handleChange = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  useEffect(() => {
    if ((value && !loading) || !searchValue) {
      setDebouncedValue(!searchValue ? null : value);
    }
  }, [value, searchValue]);

  return (
    <div
      className={cn(
        className,
        'bg-background relative flex min-w-[150px] flex-row items-center justify-end py-[1.5px]'
      )}
    >
      <Input
        id='search-input'
        className='w-full'
        onChange={(e) => handleChange(e.target.value)}
        value={searchValue || ''}
        type='text'
        placeholder={placeholder}
      />
      <span className='absolute right-2'>
        {searchValue && searchValue.length > 0 && !isPending && (
          <Icons.x onClick={handleClear} className='ml-2 cursor-pointer' />
        )}
        {isPending && (searchValue || searchValue === '') && (
          <Icons.loader className='text-primary ml-2 size-6 animate-spin' />
        )}
      </span>
    </div>
  );
};
