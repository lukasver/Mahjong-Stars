'use client';

import { TransactionModalTypes } from '@/common/types';
import { CardContainer } from '@mjs/ui/components/cards';
import { cn } from '@mjs/ui/lib/utils';
import { useEffect, useState } from 'react';
import { TokenInvestModals } from './modals';

import { SaleWithToken } from '@/common/types/sales';
import { InvestForm } from './form';
import { DiscountBanner } from './summary';
import { usePendingTransactionsForSale, useUser } from '@/lib/services/api';
import { VerifyMandatoryEmail } from '@/components/buy/verify-mandatory-email';

export function Invest({ sale }: { sale: SaleWithToken }) {
  const [open, setOpen] = useState<TransactionModalTypes | null>(null);
  const { data: user } = useUser();

  const { data } = usePendingTransactionsForSale(sale.id);

  useEffect(() => {
    if (data?.transactions.length && !open) {
      setOpen(TransactionModalTypes.PendingTx);
    }
  }, [data]);

  return (
    <CardContainer title='Invest'>
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
      {open && open === TransactionModalTypes.VerifyEmail && (
        <VerifyMandatoryEmail email={user?.email || ''} />
      )}
    </CardContainer>
  );
}
