'use client';

import { FOPSchema, Sale } from '@/common/schemas/generated';
import { TransactionModalTypes } from '@/common/types';
import { CardContainer } from '@mjs/ui/components/cards';
import { cn } from '@mjs/ui/lib/utils';
import { useState, useTransition } from 'react';
import { TokenInvestModals } from './modals';
import {
  UseAppForm,
  useAppForm,
  useFormContext,
} from '@mjs/ui/primitives/form';
import { FormInput } from '@mjs/ui/primitives/form-input';
import useActiveAccount from '@/components/hooks/use-active-account';
import { Account } from 'thirdweb/wallets';
import { useLocale, useTranslations } from 'next-intl';
import { Shield } from 'lucide-react';
import { Button } from '@mjs/ui/primitives/button';
import { useStore } from '@mjs/ui/primitives/form';
import { Separator } from '@mjs/ui/primitives/separator';
import { useInputOptions, useSaleInvestInfo } from '@/lib/services/api';
import { formatCurrency } from '@mjs/utils/client';
import calculator from '@/lib/services/pricefeeds/amount.service';

import { Prisma } from '@prisma/client';
import { toast } from '@mjs/ui/primitives/sonner';
import z from 'zod';
import { invariant } from '@epic-web/invariant';
import { SaleWithToken } from '@/common/types/sales';
const Decimal = Prisma.Decimal;

const getFormOfPaymentOptions = (t: (option: string) => string) => {
  return FOPSchema.options.map((option) => ({
    id: option,
    label: option,
    value: t(option),
    disabled: false,
  }));
};

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
        <InvestForm sale={sale} />
      </div>
      <TokenInvestModals open={open} handleModal={setOpen} sale={sale} />
    </CardContainer>
  );
}
const getDefaultValues = (
  sale: SaleWithToken,
  activeAccount: Account | undefined
) => {
  return {
    quantity: 1,
    tokenSymbol: sale.tokenSymbol,
    receivingWallet: activeAccount?.address || '',
    // String
    totalAmount: String(sale.tokenPricePerUnit),
    ppu: String(sale.tokenPricePerUnit),
    confirmationId: '',
    formOfPayment: FOPSchema.enum.CRYPTO,
    currency: sale.currency,
    comment: '',
    amountPaid: '',
    amountPaidCurrency: sale.currency,
    txHash: '',
    agreementId: '',
  };
};

const InvestForm = (props: { sale: SaleWithToken }) => {
  const { activeAccount } = useActiveAccount();
  const { data: options, isLoading: loadingOptions } = useInputOptions();
  const { data, isLoading } = useSaleInvestInfo(props.sale.id);
  const [isPending, startTransition] = useTransition();

  const sale = data?.sale;

  const t = useTranslations('Global');
  const locale = useLocale();
  const form = useAppForm({
    defaultValues: {
      totalAmount2: '',
      test: '',
      ...getDefaultValues(props.sale, activeAccount),
    },
  });

  // const [pricePerUnit, setPricePerUnit] = usePricePerUnit({
  //   from: state.currency,
  //   to: state.currency,
  //   base: state.ppu || '',
  //   onError: () => form.reset(),
  //   precision: 2,
  // });

  const MAX_BUY_ALLOWANCE =
    sale?.maximumTokenBuyPerUser || sale?.availableTokenQuantity || Infinity;

  const handleChangeQuantity = async (v: string) => {
    if (!sale) {
      return;
    }
    try {
      // const token = getNetworkToken(chain, values.paymentCurrency);

      const { amount } = await calculator.calculateAmountToPay({
        currency: form.state.values.amountPaidCurrency,
        quantity: v,
        sale: sale,
        pricePerUnit: form.state.values.ppu,
        tokenDecimals: sale?.token?.decimals || 18,
      });

      if (!amount) {
        throw new Error(
          'Error calculating amount, please refresh and try again'
        );
      }

      form.setFieldValue('totalAmount', amount);
      // setValue('quantity', quantity);
      // setValue(
      //   'paymentAmount',
      //   isCryptoFOP ? amount : currency(amount, { precision: 2 }).toString()
      // );
      // setValue('paymentAmountCrypto', bigNumber || '');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleChangeCurrency = async (v: string) => {
    // Change to original currency
    if (v === sale?.currency) {
      form.setFieldValue('totalAmount', form.state.values.totalAmount);
      form.setFieldValue('ppu', form.state.values.ppu);
      form.setFieldValue('amountPaidCurrency', v);
      form.setFieldValue('amountPaid', form.state.values.amountPaid);
      return;
    }

    startTransition(async () => {
      try {
        const quantity = String(form.state.values.quantity);
        const currency = v;
        const decimals = sale?.token?.decimals || 18;
        invariant(sale, 'Sale is required');
        invariant(quantity, 'Quantity is required');
        invariant(currency, 'Currency is required');
        invariant(decimals, 'Decimals are required');
        const { pricePerUnit, amount, bigNumber } =
          await calculator.calculateAmountToPay({
            quantity,
            sale: sale,
            currency,
            tokenDecimals: decimals,
          });

        form.setFieldValue('totalAmount', amount);
        form.setFieldValue('ppu', pricePerUnit);
        form.setFieldValue('amountPaidCurrency', currency);
        form.setFieldValue('amountPaid', amount);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Unknown error');
      }
    });
  };

  if (isLoading || loadingOptions) {
    return <div>Loading...</div>;
  }

  if (!sale) {
    return <div>No sale</div>;
  }

  const amountDescription = getAmountDescription(sale, t, locale);

  return (
    <form.AppForm>
      <form className='space-y-4'>
        {/* Wallet */}
        <FormInput
          name='receivingWallet'
          type='text'
          label='Receiving wallet address'
          inputProps={{
            placeholder: '0x1234567890',
          }}
        />

        {/* Quantity */}
        <div className='space-y-4'>
          <FormInput
            name='quantity'
            label={`${sale.token.symbol} Tokens`}
            type='text'
            listeners={{
              onChange: ({ value }) => {
                handleChangeQuantity(value as string);
              },
            }}
            validators={{
              onChange: z.coerce
                .number({
                  invalid_type_error: 'Invalid quantity',
                })
                .int({ message: 'Quantity must be a round number' })
                .gte(0, 'You must be 13 to make an account')
                .min(
                  sale.minimumTokenBuyPerUser,
                  'You must buy at least the minimum'
                )
                .max(
                  MAX_BUY_ALLOWANCE,
                  'You cannot buy more than the maximum allowed'
                ),
            }}
            inputProps={{
              autoCorrect: 'off',
              inputMode: 'numeric',
              pattern: '^[0-9]*[.,]?[0-9]*$',
              minLength: 1,
              maxLength: 79,
              spellCheck: false,
              placeholder: '0.00',
            }}
            description={amountDescription}
          />
          <div className='flex items-end w-full'>
            <FormInput
              className='flex-1'
              name='totalAmount'
              label='To pay'
              type='currency'
              inputProps={{
                loading: isPending,
                decimalScale: 3,
                decimalsLimit: 18,
                className: 'rounded-r-none pointer-events-none',
                disabled: true,
                intlConfig: {
                  locale,
                  currency: sale.currency,
                  maximumFractionDigits: 6,
                  minimumFractionDigits: 3,
                },
              }}
            />
            <FormInput
              className='shrink-0'
              name='amountPaidCurrency'
              label={''}
              type='select'
              listeners={{
                onChange: ({ value }) => {
                  handleChangeCurrency(value as string);
                },
              }}
              inputProps={{
                className: 'rounded-l-none shadow bg-secondary-900/50',
                defaultValue: sale.currency,
                options: [
                  ...(options?.data?.fiatCurrencies || []),
                  ...(options?.data?.cryptoCurrencies || []),
                ],
              }}
            />
          </div>
          {form.state.values.amountPaid && sale.token.symbol && (
            <DiscountBanner
              amount={form.state.values.amountPaid}
              symbol={sale.token.symbol}
            />
          )}
          {/* Payment Method */}
          {/* <FormInput
            name='formOfPayment'
            label='Payment Method'
            type='select'
            inputProps={{
              options: getFormOfPaymentOptions(t),
            }}
          /> */}

          {/* Purchase Summary */}
          <PurchaseButton />
          <SecurityNotice />

          {process.env.NODE_ENV === 'development' && (
            <>
              <Button onClick={() => console.debug(form.state.values)}>
                checkvalue
              </Button>
              <Button onClick={() => console.debug(form.getAllErrors())}>
                Check errors
              </Button>
            </>
          )}
        </div>
      </form>
    </form.AppForm>
  );
};

const DiscountBanner = ({
  amount,
  symbol,
}: {
  amount: string;
  symbol: string;
}) => {
  if (!amount) {
    return null;
  }
  return (
    <div className='p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg'>
      <div className='flex justify-between text-sm'>
        <span className='text-blue-400'>Early Bird Bonus (20%)</span>
        <span className='text-blue-400'>
          +{amount} {symbol}
        </span>
      </div>
    </div>
  );
};

const SecurityNotice = () => {
  return (
    <div className='p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg'>
      <div className='flex items-start gap-2'>
        <Shield className='w-4 h-4 text-yellow-400 mt-0.5' />
        <div className='text-xs text-yellow-400'>
          <p className='font-medium'>Security Notice</p>
          <p className='text-yellow-400/80'>
            Always verify the contract address and never share your private
            keys.
          </p>
        </div>
      </div>
    </div>
  );
};

const PurchaseButton = () => {
  const { activeAccount, isConnected } = useActiveAccount();

  return (
    <Button
      disabled={!isConnected}
      // || !amount || !paymentMethod}
      className='w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50'
    >
      <Shield className='w-4 h-4 mr-2' />
      {!isConnected ? 'Connect Wallet First' : 'Purchase Tokens'}
    </Button>
  );
};

const PurchaseSummary = () => {
  const form = useFormContext() as unknown as UseAppForm;
  // @ts-expect-error fixme
  const amount = useStore(form.store, (state) => state.values?.totalAmount);
  console.debug(
    '🚀 ~ invest-form-2.tsx:172 ~ PurchaseSummary ~ amount:',
    amount
  );

  return (
    <div className='space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600'>
      <h4 className='text-white font-medium'>Purchase Summary</h4>
      <div className='space-y-2 text-sm'>
        <div className='flex justify-between'>
          <span className='text-gray-400'>CVT Tokens</span>
          <span className='text-white'>{calculateTokens(amount)}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-400'>Bonus Tokens (20%)</span>
          <span className='text-green-400'>
            +
            {(
              Number.parseFloat(calculateTokens(amount).replace(/,/g, '')) * 0.2
            ).toLocaleString()}
          </span>
        </div>
        <Separator className='bg-slate-600' />
        <div className='flex justify-between font-medium'>
          <span className='text-white'>Total Tokens</span>
          <span className='text-white'>
            {(
              Number.parseFloat(calculateTokens(amount).replace(/,/g, '')) * 1.2
            ).toLocaleString()}{' '}
            CVT
          </span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-400'>Total Cost</span>
          <span className='text-white'>${amount}</span>
        </div>
      </div>
    </div>
  );
};

const calculateTokens = (usdAmount: string) => {
  const usd = Number.parseFloat(usdAmount) || 0;
  return (usd / 0.05).toLocaleString(); // $0.05 per token
};

const getAmountDescription = (
  sale: Pick<Sale, 'minimumTokenBuyPerUser' | 'maximumTokenBuyPerUser'>,
  t: (option: string) => string,
  locale: string
) => {
  let base = `Min: ${formatCurrency(sale.minimumTokenBuyPerUser, {
    locale,
  })}`;
  if (sale.maximumTokenBuyPerUser) {
    base += ` / Max: ${formatCurrency(sale.maximumTokenBuyPerUser, {
      locale,
    })}`;
  }
  return base;
};
