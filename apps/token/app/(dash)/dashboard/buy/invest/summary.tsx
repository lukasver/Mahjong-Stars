'use client';
import { UseAppForm, useFormContext } from '@mjs/ui/primitives/form';
import { useStore } from '@mjs/ui/primitives/form';
import { Separator } from '@mjs/ui/primitives/separator';
import { formatCurrency } from '@mjs/utils/client';
import calculator from '@/lib/services/pricefeeds';

import { SaleWithToken } from '@/common/types/sales';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { useLocale } from 'next-intl';
import { FIAT_CURRENCIES } from '@/common/config/constants';

export const PurchaseSummary = ({
  sale,
}: {
  sale: Pick<SaleWithToken, 'tokenPricePerUnit'>;
}) => {
  const form = useFormContext() as unknown as UseAppForm;
  const paidAmount = useStore(form.store, (state) => {
    // @ts-expect-error wontfix
    const totalAmount = state.values?.paid.amount;
    // @ts-expect-error wontfix
    const currency = state.values?.paid.currency;
    return { totalAmount, currency };
  });
  const tokenBought = useStore(form.store, (state) => {
    // @ts-expect-error wontfix
    const quantity = state.values?.paid.quantity;
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
    <PurchaseSummaryCard
      purchased={tokenBought}
      base={base?.toLocaleString()}
      bonus={bonus?.toLocaleString()}
      total={total?.toLocaleString()}
      paid={paidAmount}
      locale={locale}
    />
  );
};

export const PurchaseSummaryCard = ({
  purchased,
  base,
  bonus,
  total,
  paid,
  locale,
}: {
  purchased: { quantity: string; tokenSymbol: string };
  base?: string;
  bonus?: string;
  total: string;
  paid: { totalAmount: string; currency: string };
  locale: string;
}) => {
  return (
    <div className='space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600'>
      <h4 className='text-white font-medium'>Summary</h4>
      <div className='space-y-2 text-sm'>
        {base && (
          <div className='flex justify-between'>
            <span className='text-gray-400'>
              {purchased.tokenSymbol} Tokens
            </span>
            <span className='text-white'>{base?.toLocaleString()}</span>
          </div>
        )}
        {bonus && (
          <div className='flex justify-between'>
            <span className='text-gray-400'>Bonus Tokens</span>
            <span className='text-green-400'>+{bonus?.toLocaleString()}</span>
          </div>
        )}
        <Separator className='bg-slate-600' />
        <div className='flex justify-between font-medium'>
          <span className='text-white'>Total Tokens</span>
          <span className='text-white'>
            {total?.toLocaleString()} {purchased.tokenSymbol}
          </span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-400'>Total amount to pay</span>
          <span className='text-white font-bold'>
            {safeFormatCurrency(paid, locale)}
          </span>
        </div>
      </div>
    </div>
  );
};

const safeFormatCurrency = (
  paidAmount: { totalAmount: string; currency: string },
  locale: string
) => {
  try {
    return formatCurrency(paidAmount.totalAmount, {
      locale,
      currency: paidAmount.currency,
      ...(FIAT_CURRENCIES.includes(paidAmount.currency)
        ? {}
        : {
            minimumFractionDigits: calculator.FIAT_PRECISION,
            maximumFractionDigits: calculator.CRYPTO_PRECISION,
          }),
    });
  } catch {
    return `${new Prisma.Decimal(paidAmount.totalAmount).toFixed(
      calculator.CRYPTO_PRECISION
    )} ${paidAmount.currency}`;
  }
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
  try {
    const PUBLIC_PRICE_PER_TOKEN = new Prisma.Decimal(publicPrice);
    const CURRENT_PRICE_PER_TOKEN = new Prisma.Decimal(currentPrice);

    const tokenQuantity = new Prisma.Decimal(
      Number.isInteger(Number(quantity)) ? quantity : '0'
    );

    // Total tokens is what we actually bought
    const total = tokenQuantity;

    // Investment amount we actually paid
    const investmentAmount = tokenQuantity.mul(CURRENT_PRICE_PER_TOKEN);

    // Base tokens we would get at public price with the same investment
    const base = investmentAmount.div(PUBLIC_PRICE_PER_TOKEN);

    // Bonus is the difference between total and base
    const bonus = total.sub(base);

    return { base, bonus, total };
  } catch (e) {
    console.error(e);
    return {
      base: new Prisma.Decimal(0),
      bonus: new Prisma.Decimal(0),
      total: new Prisma.Decimal(0),
    };
  }
};

export const DiscountBanner = () => {
  const form = useFormContext() as unknown as UseAppForm;
  const { quantity, symbol, basePPU } = useStore(form.store, (state) => {
    // @ts-expect-error wontfix
    const quantity = state.values?.paid?.quantity;
    // @ts-expect-error wontfix
    const symbol = state.values?.tokenSymbol;
    // @ts-expect-error wontfix
    const basePPU = state.values?.base.ppu;
    return { quantity, symbol, basePPU };
  });

  if (!quantity || !symbol) {
    return null;
  }

  const { base, bonus, total } = calculateTokens(quantity, basePPU);

  const percentage = calculateBonusPercentage(base, total);

  return (
    <div className='p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg'>
      <div className='flex justify-between text-sm'>
        <span className='text-blue-400'>Early Bird Bonus ({percentage}%)</span>
        <span className='text-blue-400'>
          +{bonus.toString()} {symbol}
        </span>
      </div>
    </div>
  );
};

const calculateBonusPercentage = (base: Decimal, total: Decimal) => {
  return total.div(base).minus(1).mul(100).toFixed(0);
};
