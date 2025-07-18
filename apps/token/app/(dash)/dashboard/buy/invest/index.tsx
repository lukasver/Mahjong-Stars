'use client';

import { TransactionModalTypes } from '@/common/types';
import { CardContainer } from '@mjs/ui/components/cards';
import { cn } from '@mjs/ui/lib/utils';
import { useState } from 'react';
import { TokenInvestModals } from './modals';
import { UseAppForm, useFormContext } from '@mjs/ui/primitives/form';
import { useStore } from '@mjs/ui/primitives/form';
import { Separator } from '@mjs/ui/primitives/separator';
import { formatCurrency } from '@mjs/utils/client';

import { SaleWithToken } from '@/common/types/sales';
import { InvestForm } from './form';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { useLocale } from 'next-intl';

export function Invest({ sale }: { sale: SaleWithToken }) {
  const [open, setOpen] = useState<TransactionModalTypes | null>(null);
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
        <InvestForm sale={sale}>
          <DiscountBanner />
          <PurchaseSummary sale={sale} />
        </InvestForm>
      </div>
      <TokenInvestModals open={open} handleModal={setOpen} sale={sale} />
    </CardContainer>
  );
}

const DiscountBanner = () => {
  const form = useFormContext() as unknown as UseAppForm;
  const { quantity, symbol } = useStore(form.store, (state) => {
    // @ts-expect-error wontfix
    const quantity = state.values?.paid?.quantity;
    // @ts-expect-error wontfix
    const symbol = state.values?.tokenSymbol;
    return { quantity, symbol };
  });

  if (!quantity || !symbol) {
    return null;
  }
  return (
    <div className='p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg'>
      <div className='flex justify-between text-sm'>
        <span className='text-blue-400'>Early Bird Bonus (20%)</span>
        <span className='text-blue-400'>
          +{quantity} {symbol}
        </span>
      </div>
    </div>
  );
};

const PurchaseSummary = ({
  sale,
}: {
  sale: Pick<SaleWithToken, 'tokenPricePerUnit'>;
}) => {
  const form = useFormContext() as unknown as UseAppForm;
  const paidAmount = useStore(form.store, (state) => {
    // @ts-expect-error wontfix
    const totalAmount = state.values?.totalAmount;
    // @ts-expect-error wontfix
    const currency = state.values?.currency;
    return { totalAmount, currency };
  });
  const tokenBought = useStore(form.store, (state) => {
    // @ts-expect-error wontfix
    const quantity = state.values?.quantity;
    // @ts-expect-error wontfix
    const tokenSymbol = state.values?.tokenSymbol;
    return { quantity, tokenSymbol };
  });

  const { base, bonus, total } = calculateTokens(
    tokenBought.quantity,
    sale.tokenPricePerUnit
  );
  const locale = useLocale();

  return (
    <div className='space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600'>
      <h4 className='text-white font-medium'>Purchase Summary</h4>
      <div className='space-y-2 text-sm'>
        <div className='flex justify-between'>
          <span className='text-gray-400'>CVT Tokens</span>
          <span className='text-white'>{base?.toLocaleString()}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-400'>Bonus Tokens (20%)</span>
          <span className='text-green-400'>+{bonus?.toLocaleString()}</span>
        </div>
        <Separator className='bg-slate-600' />
        <div className='flex justify-between font-medium'>
          <span className='text-white'>Total Tokens</span>
          <span className='text-white'>
            {total?.toLocaleString()}
            CVT
          </span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-400'>Total Cost</span>
          <span className='text-white'>
            {formatCurrency(paidAmount.totalAmount, {
              locale,
              currency: paidAmount.currency,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Calculates token breakdown showing base tokens, bonus tokens, and total tokens
 * @param quantity - Quantity of tokens bought as string
 * @param currentPrice - Current sale price per token as string or Decimal (default: '0.012')
 * @param publicPrice - Public price per token as string or Decimal (default: '0.3')
 * @returns Object containing base, bonus, and total token amounts
 */
const calculateTokens = (
  quantity: string,
  currentPrice: string | Decimal = '0.012',
  publicPrice: string | Decimal = '0.3'
) => {
  const PUBLIC_PRICE_PER_TOKEN = new Prisma.Decimal(publicPrice);
  const CURRENT_PRICE_PER_TOKEN = new Prisma.Decimal(currentPrice);

  const tokenQuantity = new Prisma.Decimal(quantity || '0');

  // Total tokens is what we actually bought
  const total = tokenQuantity;

  // Investment amount we actually paid
  const investmentAmount = tokenQuantity.mul(CURRENT_PRICE_PER_TOKEN);

  // Base tokens we would get at public price with the same investment
  const base = investmentAmount.div(PUBLIC_PRICE_PER_TOKEN);

  // Bonus is the difference between total and base
  const bonus = total.sub(base);

  return { base, bonus, total };
};
