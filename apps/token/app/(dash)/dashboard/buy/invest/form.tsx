'use client';

import { useCallback, useTransition } from 'react';
import {
  UseAppForm,
  useAppForm,
  useFormContext,
  useStore,
} from '@mjs/ui/primitives/form';
import { FormInput } from '@mjs/ui/primitives/form-input';
import useActiveAccount from '@/components/hooks/use-active-account';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@mjs/ui/primitives/button';
import {
  useInputOptions,
  usePendingTransactionsForSale,
  useSaleInvestInfo,
  useUser,
} from '@/lib/services/api';
import calculator from '@/lib/services/pricefeeds';

import { Prisma } from '@prisma/client';
import { toast } from '@mjs/ui/primitives/sonner';
import z from 'zod';
import { invariant } from '@epic-web/invariant';
import { SaleWithToken } from '@/common/types/sales';
import { Account } from 'thirdweb/wallets';
import { formatCurrency } from '@mjs/utils/client';
import { FileText, Shield } from 'lucide-react';
import { FIAT_CURRENCIES } from '@/common/config/constants';
import { useActionListener } from '@mjs/ui/hooks/use-action-listener';
import { useAction } from 'next-safe-action/hooks';
import { InvestFormSchema } from './schemas';
import { createTransaction } from '@/lib/actions';
import { InferSafeActionFnResult } from 'next-safe-action';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@mjs/ui/primitives/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mjs/ui/primitives/dialog';
import { PurchaseSummary } from './summary';
import { TransactionModalTypes } from '@/common/types';
import { getQueryClient } from '@/app/providers';
const Decimal = Prisma.Decimal;

export const InvestForm = ({
  children,
  openModal,
  ...props
}: {
  sale: SaleWithToken;
  openModal: (modal: TransactionModalTypes) => void;
  children?: React.ReactNode;
}) => {
  const { activeAccount } = useActiveAccount();
  const { data: user } = useUser();
  const router = useRouter();
  const { data: options, isLoading: loadingOptions } = useInputOptions();

  const { data: pendingTransactions } = usePendingTransactionsForSale(
    props.sale.id
  );

  const { data, isLoading } = useSaleInvestInfo(props.sale.id);
  const [isPending, startTransition] = useTransition();
  const action = useActionListener(useAction(createTransaction), {
    onSuccess: (d) => {
      const result = d as unknown as InferSafeActionFnResult<
        typeof createTransaction
      >['data'];
      getQueryClient().invalidateQueries({
        queryKey: ['transactions', props.sale.id, 'pending'],
      });
      if (result?.transaction) {
        router.push(`/dashboard/buy/${result.transaction.id}`);
      }
    },
  });

  const sale = data?.sale;

  const t = useTranslations('Global');
  const locale = useLocale();
  const form = useAppForm({
    // @ts-expect-error fixme
    validators: { onSubmit: InvestFormSchema },
    defaultValues: getDefaultValues(props.sale, activeAccount),
    onSubmit: ({ value }) => {
      // Create transaction in API, book amount of tokens etc etc...
      // has KYC, ask user to upload documents, etc etc...
      // if
      const hasPendingTransaction =
        pendingTransactions?.transactions?.length &&
        pendingTransactions.transactions.length > 0;

      if (hasPendingTransaction) {
        openModal(TransactionModalTypes.PendingTx);
        return;
      }

      if (!user?.email || !user?.emailVerified) {
        openModal(TransactionModalTypes.VerifyEmail);
        return;
      }

      // @ts-expect-error fixme
      action.execute(value);
    },
  });

  const paidCurrency =
    useStore(form.store, (state) => state.values.paid.currency) ||
    sale?.currency;

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

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      console.log('submit');
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  const handleChangeCurrency = async (v: string) => {
    startTransition(async () => {
      try {
        const q = form.getFieldValue('paid.quantity') || 1;
        invariant(q, 'Quantity is required');

        // Change to original currency
        if (v === sale?.currency) {
          form.setFieldValue('paid.ppu', sale.tokenPricePerUnit.toString());
          form.setFieldValue('paid.currency', sale.currency);
          form.setFieldValue(
            'paid.amount',
            new Decimal(q)
              .mul(sale.tokenPricePerUnit)
              .toFixed(calculator.FIAT_PRECISION)
          );
          return;
        }

        const currency = v;
        const decimals = sale?.token?.decimals || 18;
        invariant(sale, 'Sale is required');
        invariant(q, 'Quantity is required');
        invariant(currency, 'Currency is required');
        invariant(decimals, 'Decimals are required');
        const { pricePerUnit, amount } = await calculator.calculateAmountToPay({
          quantity: String(q),
          sale: sale,
          currency,
          // tokenDecimals: decimals,
        });

        console.debug('PPU', pricePerUnit, 'AMOUNT', amount);
        // form.reset({})
        form.setFieldValue('paid.amount', amount);
        form.setFieldValue('paid.ppu', pricePerUnit);
        form.setFieldValue('paid.currency', currency);
        form.setFieldValue('paid.quantity', q);
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

  const amountDescription = getAmountDescription(sale, locale);
  const hasPendingTransaction =
    pendingTransactions?.transactions?.length &&
    pendingTransactions.transactions.length > 0;

  return (
    <form.AppForm>
      <form className='space-y-4' onSubmit={handleSubmit}>
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
            name='paid.quantity'
            label={`${sale.tokenSymbol} Tokens`}
            type='number'
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
              name='paid.amount'
              label='To pay'
              type='currency'
              inputProps={{
                loading: isPending,
                decimalScale: getDecimalScale(paidCurrency),
                decimalsLimit: 18,
                className: 'rounded-r-none pointer-events-none',
                disabled: true,
                intlConfig: {
                  locale,
                  currency: sale.currency,
                  maximumFractionDigits: calculator.CRYPTO_PRECISION,
                  minimumFractionDigits: 3,
                },
              }}
            />
            <FormInput
              className='shrink-0'
              name='paid.currency'
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

          {children}
          {hasPendingTransaction ? (
            <Button
              onClick={() => openModal(TransactionModalTypes.PendingTx)}
              // || !amount || !paymentMethod}
              className='w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50'
              type='button'
            >
              <Shield className='w-4 h-4 mr-2' />
              Continue pending transaction
            </Button>
          ) : (
            <PurchaseButton loading={action.isExecuting} disabled={isPending}>
              <PurchaseSummary sale={sale} />
              {sale.requiresKYC && (
                <Alert className='bg-secondary-800/50 border-secondary'>
                  <Shield className='h-4 w-4 text-secondary' />
                  <AlertDescription className='text-white/90'>
                    <span className='font-bold'>KYC Required:</span> You will be
                    prompted to verify your account in the next step.
                  </AlertDescription>
                </Alert>
              )}
              {sale.saftCheckbox && (
                <Alert className='bg-secondary-800/50 border-secondary'>
                  <FileText className='h-4 w-4 text-secondary' />
                  <AlertDescription className='text-white/90'>
                    <span className='font-bold'>SAFT Agreement:</span> You will
                    be prompted to sign a contract in the next steps.
                  </AlertDescription>
                </Alert>
              )}
              {/* @ts-expect-error fixme */}
              <SubmitButton form={form} onSubmit={handleSubmit} />
            </PurchaseButton>
          )}
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

const SubmitButton = ({
  form,
  onSubmit,
}: {
  form: unknown;
  onSubmit: () => void;
}) => {
  return (
    // @ts-expect-error fixme
    <form.Subscribe
      // @ts-expect-error fixme
      selector={(state) => ({
        isValid: state.isValid,
        isSubmitting: state.isSubmitting,
      })}
    >
      {/* @ts-expect-error fixme */}
      {({ isValid, isSubmitting }) => (
        <Button
          type={'button'}
          onClick={onSubmit}
          disabled={!isValid}
          loading={isSubmitting}
        >
          Proceed
        </Button>
      )}
      {/* @ts-expect-error fixme */}
    </form.Subscribe>
  );
};

const PurchaseButton = ({
  children,
  ...props
}: {
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}) => {
  const { isConnected } = useActiveAccount();
  const form = useFormContext() as unknown as UseAppForm;

  // Should check if there is a pending transaction

  return (
    <Dialog>
      <form.Subscribe
        selector={(state) => ({
          isValid: state.isValid,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ isSubmitting }) => (
          <DialogTrigger asChild>
            <Button
              disabled={!isConnected || props.disabled}
              // || !amount || !paymentMethod}
              className='w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50'
              type='button'
              loading={isSubmitting || props.loading}
            >
              <Shield className='w-4 h-4 mr-2' />
              {!isConnected ? 'Connect Wallet First' : 'Purchase Tokens'}
            </Button>
          </DialogTrigger>
        )}
      </form.Subscribe>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review your purchase</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
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
  const initialQ = 1;
  return {
    paid: {
      amount: new Prisma.Decimal(sale.tokenPricePerUnit)
        .mul(initialQ)
        .toString(),
      currency: sale.currency,
      quantity: initialQ,
      ppu: sale.tokenPricePerUnit.toString(),
    },
    base: {
      ppu: sale.tokenPricePerUnit.toString(),
      currency: sale.currency,
      min: sale.minimumTokenBuyPerUser,
      max: sale.maximumTokenBuyPerUser || 0,
    },
    tokenSymbol: sale?.token?.symbol || '',
    saleId: sale?.id || '',
    receivingWallet: activeAccount?.address || '',
    requiresSaft: !!sale?.saftCheckbox,
    requiresKYC: !!sale?.requiresKYC,
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

const getDecimalScale = (currency: string | undefined) => {
  if (currency && FIAT_CURRENCIES.includes(currency)) {
    return 2;
  }
  return calculator.CRYPTO_PRECISION;
};
