'use client';

import { TransactionModalTypes } from '@/common/types';
import { CardContainer } from '@mjs/ui/components/cards';
import { cn } from '@mjs/ui/lib/utils';
import { useEffect, useState } from 'react';
import { TokenInvestModals } from './modals';

import { SaleWithToken } from '@/common/types/sales';
import { InvestForm } from './form';
import { DiscountBanner } from './summary';
import { usePendingTransactionsForSale } from '@/lib/services/api';

export function Invest({ sale }: { sale: SaleWithToken }) {
  const [open, setOpen] = useState<TransactionModalTypes | null>(null);

  const { data, isLoading } = usePendingTransactionsForSale(sale.id);

  console.debug(
    '🚀 ~ index.tsx:19 ~ Invest ~ isLoading:',
    isLoading,
    data?.transactions
  );

  useEffect(() => {
    if (data?.transactions.length && !open) {
      setOpen(TransactionModalTypes.PendingTx);
    }
  }, [data]);

  return (
    <CardContainer title='Invest'>
      {/* // Contract Viewer modal */}
      {/* // Wallet connect indicator?? maybe but already in navbar */}
      {/* // Token modal?? */}
      <div
        className={cn(
          'mb-6 font-medium grid grid-cols-1 items-center gap-x-4 gap-y-4 text-xs text-foreground'
        )}
      >
        <InvestForm sale={sale} openModal={setOpen}>
          <DiscountBanner />
        </InvestForm>
      </div>
      <TokenInvestModals open={open} handleModal={setOpen} sale={sale} />
    </CardContainer>
  );
}
