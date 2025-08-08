'use client';

import { useUserTransactions } from '@/lib/services/api';
import { Transactions } from './transactions';
import { Placeholder } from '../placeholder';
import { BanknoteArrowUp } from 'lucide-react';
import { PulseLoader } from '../pulse-loader';

export function UserTransactions() {
  const { data, isLoading } = useUserTransactions();

  if (isLoading) {
    return <PulseLoader />;
  }

  if (!data?.transactions) {
    return (
      <div className='flex flex-col items-center justify-center h-full min-h-screen md:min-h-[60dvh]'>
        <Placeholder
          icon={BanknoteArrowUp}
          title='No transactions found'
          description='You have not made any transactions yet'
        />
      </div>
    );
  }

  return <Transactions transactions={data?.transactions} />;
}
