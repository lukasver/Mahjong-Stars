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

interface TransactionFiltersProps {
  transactions?: TransactionWithRelations[] | AdminTransactionsWithRelations[];
  isAdmin?: boolean;
  onFilteredDataChange?: (
    filteredData: (TransactionWithRelations | AdminTransactionsWithRelations)[]
  ) => void;
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

  return (
    <>
      {/* Filters and Search */}
      <div className='flex flex-col sm:flex-row gap-2 justify-between'>
        <div className='flex items-center space-x-2'>
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search transactions...'
              value={filters.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className='pl-8 w-[300px]'
            />
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

          {/* Clear filters button */}

          {(debouncedSearchTerm ||
            filters.statusFilter !== 'all' ||
            filters.paymentTypeFilter !== 'all') && (
            <Button variant='outline' onClick={handleClearFilters}>
              <BrushCleaningIcon className='size-4' />
              <span className='sr-only'>Clear filters</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Summary */}
      {/* {(debouncedSearchTerm ||
          filters.statusFilter !== 'all' ||
          filters.paymentTypeFilter !== 'all') && (
          <div className='mb-4 flex items-center gap-2 text-sm text-muted-foreground'>
            <span>
              Showing {filteredTransactions.length} of{' '}
              {transactions?.length || 0} transactions
            </span>
            <span>•</span>
            <span>
              {debouncedSearchTerm && `Search: "${debouncedSearchTerm}"`}
              {debouncedSearchTerm &&
                (filters.statusFilter !== 'all' || filters.paymentTypeFilter !== 'all') &&
                ' • '}
              {filters.statusFilter !== 'all' && `Status: ${filters.statusFilter}`}
              {filters.statusFilter !== 'all' && filters.paymentTypeFilter !== 'all' && ' • '}
              {filters.paymentTypeFilter !== 'all' && `Payment: ${filters.paymentTypeFilter}`}
            </span>
          </div>
        )} */}
    </>
  );
};

TransactionFilters.displayName = 'TransactionFilters';
