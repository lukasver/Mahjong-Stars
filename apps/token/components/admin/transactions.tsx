'use client';

import { useAllTransactions } from '@/lib/services/api';
import { Transactions } from '../transactions/transactions';
import { Placeholder } from '../placeholder';
import { BanknoteArrowUp } from 'lucide-react';
import { PulseLoader } from '../pulse-loader';

export default function AdminTransactions({ saleId }: { saleId?: string }) {
  const { data, isLoading } = useAllTransactions(saleId);

  if (isLoading) {
    return <PulseLoader />;
  }

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
