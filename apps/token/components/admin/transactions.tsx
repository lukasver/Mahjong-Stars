'use client';

import { useAllTransactions } from '@/lib/services/api';
import { Transactions } from '../transactions/transactions';
import { Placeholder } from '../placeholder';
import { BanknoteArrowUp } from 'lucide-react';

export default function AdminTransactions() {
  const { data } = useAllTransactions();

  if (!data?.transactions) {
    return (
      <div className='flex flex-col items-center justify-center h-full min-h-[60dvh]'>
        <Placeholder
          icon={BanknoteArrowUp}
          title='No transactions found'
          description='There are no transactions in the system'
        />
      </div>
    );
  }

  return <Transactions transactions={data?.transactions} isAdmin={true} />;
}
