'use client';

import { useTransition } from 'react';
import { useAppForm } from '@mjs/ui/primitives/form';
import { FormInput } from '@mjs/ui/primitives/form-input';
import useActiveAccount from '@/components/hooks/use-active-account';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@mjs/ui/primitives/button';
import { useInputOptions, useSaleInvestInfo } from '@/lib/services/api';
import calculator from '@/lib/services/pricefeeds/amount.service';

import { Prisma } from '@prisma/client';
import { toast } from '@mjs/ui/primitives/sonner';
import z from 'zod';
import { invariant } from '@epic-web/invariant';
import { SaleWithToken } from '@/common/types/sales';
import { Account } from 'thirdweb/wallets';
import { formatCurrency } from '@mjs/utils/client';
import { Shield } from 'lucide-react';
const Decimal = Prisma.Decimal;

// amount paid
// currency
// quantity // quantity of tokens being bought
// tokenSymbol // symbol of the token being bought
// saleId

const FormSchema = z.object({
  paid: z.object({
    amount: z.string().min(1, 'Amount is required'),
    currency: z.string().min(1, 'Currency is required'),
    quantity: z.string(),
    ppu: z.string(),
  }),
  base: z.object({
    ppu: z.string(),
    currency: z.string(),
  }),
  tokenSymbol: z.string(),
  saleId: z.string(),
  receivingWallet: z.string().min(1, 'Wallet address is required'),
});

export const InvestForm = ({
  children,
  ...props
}: {
  sale: SaleWithToken;
  children?: React.ReactNode;
}) => {
  const { activeAccount } = useActiveAccount();
  const { data: options, isLoading: loadingOptions } = useInputOptions();
  const { data, isLoading } = useSaleInvestInfo(props.sale.id);
  const [isPending, startTransition] = useTransition();

  const sale = data?.sale;

  const t = useTranslations('Global');
  const locale = useLocale();
  const form = useAppForm({
    validators: { onSubmit: FormSchema },
    defaultValues: getDefaultValues(props.sale, activeAccount),
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
        currency: form.state.values.paid.currency,
        quantity: v,
        sale: sale,
        pricePerUnit: form.state.values.paid.ppu,
        tokenDecimals: sale?.token?.decimals || 18,
      });

      if (!amount) {
        throw new Error(
          'Error calculating amount, please refresh and try again'
        );
      }

      form.setFieldValue('paid.amount', amount);
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
      form.setFieldValue('paid.amount', form.state.values.paid.amount);
      form.setFieldValue('paid.ppu', form.state.values.paid.ppu);
      form.setFieldValue('paid.currency', v);
      form.setFieldValue('paid.quantity', form.state.values.paid.quantity);
      return;
    }

    startTransition(async () => {
      try {
        const quantity = String(form.state.values.paid.quantity);
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

        form.setFieldValue('paid.amount', amount);
        form.setFieldValue('paid.ppu', pricePerUnit);
        form.setFieldValue('paid.currency', currency);
        form.setFieldValue('paid.quantity', quantity);
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
          {children}
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

// const getFormOfPaymentOptions = (t: (option: string) => string) => {
//   return FOPSchema.options.map((option) => ({
//     id: option,
//     label: option,
//     value: t(option),
//     disabled: false,
//   }));
// };

const getDefaultValues = (
  sale: SaleWithToken,
  activeAccount: Account | undefined
) => {
  return {
    paid: {
      amount: '',
      currency: '',
      quantity: '',
      ppu: '',
    },
    base: {
      ppu: '',
      currency: '',
    },
    tokenSymbol: sale?.token?.symbol || '',
    saleId: sale?.id || '',
    receivingWallet: activeAccount?.address || '',
    // confirmationId: '',
    // formOfPayment: FOPSchema.enum.CRYPTO,
    // currency: sale.currency,
    // comment: '',
    // amountPaid: '',
    // amountPaidCurrency: sale.currency,
    // txHash: '',
    // agreementId: '',
  };
};

const getAmountDescription = (
  sale: Pick<
    SaleWithToken,
    'minimumTokenBuyPerUser' | 'maximumTokenBuyPerUser'
  >,
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
