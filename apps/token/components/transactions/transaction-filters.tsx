'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@mjs/ui/hooks/use-debounced-value';
import { Input } from '@mjs/ui/primitives/input';
import { SearchSelect } from '../searchBar/search-select';
import { Button } from '@mjs/ui/primitives/button';
import { BrushCleaningIcon, Search } from 'lucide-react';
import {
  AdminTransactionsWithRelations,
  TransactionWithRelations,
} from '@/common/types/transactions';
import React from 'react';
import { cn } from '@mjs/ui/lib/utils';
import { motion, AnimatePresence } from '@mjs/ui/components/motion';

interface TransactionFiltersProps {
  transactions?: TransactionWithRelations[] | AdminTransactionsWithRelations[];
  isAdmin?: boolean;
  onFilteredDataChange?: (
    filteredData: (TransactionWithRelations | AdminTransactionsWithRelations)[]
  ) => void;
  className?: string;
}

interface FilterState {
  searchTerm: string;
  statusFilter: string;
  paymentTypeFilter: string;
}

export const TransactionFilters = ({
  transactions,
  isAdmin = false,
  onFilteredDataChange,
  className,
}: TransactionFiltersProps) => {
  const transactionsRef = useRef(JSON.stringify(transactions));

  // Single state object for all filters
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    statusFilter: 'all',
    paymentTypeFilter: 'all',
  });

  // Debounced search term for filtering
  const [, debouncedSearchTerm] = useDebouncedValue(filters.searchTerm, 300);

  /**
   * Computes filtered transactions based on current filters
   */
  const computeFilteredTransactions = (
    searchTerm: string,
    statusFilter: string,
    paymentTypeFilter: string
  ) => {
    return (
      transactions?.filter((transaction) => {
        // Search term filtering - search across multiple fields
        const searchLower = (searchTerm || '').toLowerCase();
        const matchesSearch =
          !searchTerm ||
          transaction.id.toLowerCase().includes(searchLower) ||
          (isAdmin &&
            'user' in transaction &&
            transaction.user?.profile?.firstName
              ?.toLowerCase()
              .includes(searchLower)) ||
          (isAdmin &&
            'user' in transaction &&
            transaction.user?.profile?.lastName
              ?.toLowerCase()
              .includes(searchLower)) ||
          transaction.sale.name.toLowerCase().includes(searchLower);

        // Status filtering
        const matchesStatus =
          statusFilter === 'all' || transaction.status === statusFilter;

        // Payment type filtering
        const matchesPaymentType =
          paymentTypeFilter === 'all' ||
          transaction.formOfPayment === paymentTypeFilter;

        return matchesSearch && matchesStatus && matchesPaymentType;
      }) || []
    );
  };

  /**
   * Updates filters and triggers filtered data change
   */
  const updateFiltersAndNotify = (newFilters: FilterState) => {
    setFilters(newFilters);
    const filteredTransactions = computeFilteredTransactions(
      debouncedSearchTerm || newFilters.searchTerm,
      newFilters.statusFilter,
      newFilters.paymentTypeFilter
    );
    onFilteredDataChange?.(filteredTransactions);
  };

  const handleStatusFilterChange = (value: string) => {
    const newFilters = {
      ...filters,
      statusFilter: value === 'clear' ? 'all' : value,
    };
    updateFiltersAndNotify(newFilters);
  };

  const handlePaymentTypeFilterChange = (value: string) => {
    const newFilters = {
      ...filters,
      paymentTypeFilter: value === 'clear' ? 'all' : value,
    };
    updateFiltersAndNotify(newFilters);
  };

  const handleClearFilters = () => {
    const newFilters = {
      searchTerm: '',
      statusFilter: 'all',
      paymentTypeFilter: 'all',
    };
    updateFiltersAndNotify(newFilters);
  };

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, searchTerm: value };
    setFilters(newFilters);
    // For search, we use the debounced value, so we'll compute in the debounced effect
  };

  // Handle debounced search changes
  const handleDebouncedSearchChange = () => {
    const filteredTransactions = computeFilteredTransactions(
      debouncedSearchTerm,
      filters.statusFilter,
      filters.paymentTypeFilter
    );
    onFilteredDataChange?.(filteredTransactions);
  };

  // Only use useEffect for debounced search term changes
  React.useEffect(() => {
    handleDebouncedSearchChange();
  }, [debouncedSearchTerm]);

  const isDifferent = transactionsRef.current !== JSON.stringify(transactions);

  useEffect(() => {
    // When the transactions change, we need to re-compute the filtered transactions to update the local state of the container
    if (isDifferent && transactions?.length) {
      const filteredTransactions = computeFilteredTransactions(
        debouncedSearchTerm,
        filters.statusFilter,
        filters.paymentTypeFilter
      );
      onFilteredDataChange?.(filteredTransactions);
    }
    transactionsRef.current = JSON.stringify(transactions);
  }, [isDifferent]);

  const renderClearFilters =
    debouncedSearchTerm ||
    filters.statusFilter !== 'all' ||
    filters.paymentTypeFilter !== 'all';

  return (
    <div
      className={cn(
        className,
        'flex flex-col sm:flex-row gap-2 justify-between'
      )}
    >
      <div className='flex items-center gap-2 flex-col sm:flex-row'>
        <div className='relative w-full sm:w-auto flex'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search transactions...'
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='pl-8 w-full sm:w-[300px]'
          />
          {/* Clear filters button for mobile viewport */}
          <div className='absolute -right-[58px] top-0 md:hidden!'>
            <ClearButton
              onClearFilters={handleClearFilters}
              render={!!renderClearFilters}
              className='md:hidden'
            />
          </div>
        </div>
        <SearchSelect
          showAll={false}
          placeholder='Status'
          options={[
            { label: 'All Status', value: 'all' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Awaiting Payment', value: 'AWAITING_PAYMENT' },
            { label: 'Payment Submitted', value: 'PAYMENT_SUBMITTED' },
            { label: 'Payment Verified', value: 'PAYMENT_VERIFIED' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'Cancelled', value: 'CANCELLED' },
            { label: 'Tokens Distributed', value: 'TOKENS_DISTRIBUTED' },
            { label: 'Completed', value: 'COMPLETED' },
            { label: 'Refunded', value: 'REFUNDED' },
          ]}
          onSearch={handleStatusFilterChange}
          isFilter={true}
        />
        <SearchSelect
          showAll={false}
          placeholder='Payment Type'
          options={[
            { label: 'All Payment Types', value: 'all' },
            { label: 'Crypto', value: 'CRYPTO' },
            { label: 'Transfer', value: 'TRANSFER' },
            // { label: 'Card', value: 'CARD' },
          ]}
          onSearch={handlePaymentTypeFilterChange}
          isFilter={true}
        />

        {/* Clear filters button for desktop viewport */}
        <ClearButton
          onClearFilters={handleClearFilters}
          render={!!renderClearFilters}
          className='hidden! md:block'
        />
      </div>
    </div>
  );
};

const ClearButton = ({
  render,
  onClearFilters,
  className,
}: {
  onClearFilters: () => void;
  className?: string;
  render: boolean;
}) => {
  return (
    <AnimatePresence>
      {render && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            duration: 0.2,
            scale: { type: 'spring', visualDuration: 0.2, bounce: 0.1 },
          }}
        >
          <Button
            variant='outline'
            onClick={onClearFilters}
            className={className}
          >
            <BrushCleaningIcon className='size-4' />
            <span className='sr-only'>Clear filters</span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

TransactionFilters.displayName = 'TransactionFilters';
