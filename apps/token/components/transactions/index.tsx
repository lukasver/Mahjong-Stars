'use client';

import { useUserTransactions } from '@/lib/services/api';
import { Transactions } from './transactions';
import { Placeholder } from '../placeholder';
import { BanknoteArrowUp } from 'lucide-react';

export function UserTransactions() {
  const { data } = useUserTransactions();

  if (!data?.transactions) {
    return (
      <Placeholder
        icon={BanknoteArrowUp}
        title='No transactions found'
        description='You have not made any transactions yet'
      />
    );
  }

  return <Transactions transactions={data?.transactions} />;
}
export const AdminTransactions = () => {
  return <Transactions />;
};
