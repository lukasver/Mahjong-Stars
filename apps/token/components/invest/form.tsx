"use client";

import { invariant } from "@epic-web/invariant";
import { useActionListener } from "@mjs/ui/hooks/use-action-listener";
import { Alert, AlertDescription } from "@mjs/ui/primitives/alert";
import { Button } from "@mjs/ui/primitives/button";
import { Card, CardContent } from "@mjs/ui/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@mjs/ui/primitives/dialog";
import {
  UseAppForm,
  useAppForm,
  useFormContext,
  useStore,
} from "@mjs/ui/primitives/form";
import { FormInput } from "@mjs/ui/primitives/form-input";
import { Input } from "@mjs/ui/primitives/input";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { toast } from "@mjs/ui/primitives/sonner";
import { formatCurrency } from "@mjs/utils/client";
import { Prisma } from "@prisma/client";
import { FileText, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { InferSafeActionFnResult } from "next-safe-action";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useRef, useState, useTransition } from "react";
import { Account } from "thirdweb/wallets";
import z from "zod";
import { FIAT_CURRENCIES } from "@/common/config/constants";
import { TransactionModalTypes } from "@/common/types";
import { SaleWithToken } from "@/common/types/sales";
import { FormError, FormErrorProps } from "@/components/form-error";
import useActiveAccount from "@/components/hooks/use-active-account";
import { createTransaction } from "@/lib/actions";
import {
  useInputOptions,
  usePendingTransactionsForSale,
  useSaleInvestInfo,
  useUser,
} from "@/lib/services/api";
import calculator from "@/lib/services/pricefeeds";
import { getQueryClient } from "@/lib/services/query";
import { InvestFormSchema } from "./schemas";
import { PurchaseSummary } from "./summary";

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
  const errorCountRef = useRef(0);
  const [blockForm, setBlockForm] = useState<null | Omit<
    FormErrorProps,
    "icon"
  >>(null);
  const router = useRouter();
  const { data: options, isLoading: loadingOptions } = useInputOptions();

  const { data: pendingTransactions } = usePendingTransactionsForSale(
    props.sale.id,
  );

  const { data, isLoading } = useSaleInvestInfo(props.sale.id);
  const [isPending, startTransition] = useTransition();
  const action = useActionListener(useAction(createTransaction), {
    onSuccess: (d) => {
      const result = d as unknown as InferSafeActionFnResult<
        typeof createTransaction
      >["data"];
      getQueryClient().invalidateQueries({
        queryKey: ["transactions", props.sale.id, "pending"],
      });
      if (result?.transaction) {
        router.push(`/dashboard/buy/${result.transaction.id}`);
      }
    },
  });

  const sale = data?.sale;

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
      const { amount } = await calculator.calculateAmountToPay({
        currency: form.state.values.paid.currency,
        quantity: v,
        sale: sale,
        pricePerUnit: form.state.values.paid.ppu,
        tokenDecimals: sale?.token?.decimals || 18,
        // Add fee if we have a BPS fee configured
        addFee: !!process.env.NEXT_PUBLIC_FEE_BPS,
      });

      if (!amount) {
        throw new Error(
          "Error calculating amount, please refresh and try again",
        );
      }
      form.setFieldValue("paid.amount", amount);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  const resetCurrencyAndPPU = (q: number = 1) => {
    if (sale) {
      form.setFieldValue("paid.ppu", sale.tokenPricePerUnit.toString());
      form.setFieldValue("paid.currency", sale.currency);
      form.setFieldValue(
        "paid.amount",
        new Decimal(q)
          .mul(sale.tokenPricePerUnit)
          .toFixed(calculator.FIAT_PRECISION),
      );
    } else {
      setBlockForm({ type: "maintenance" });
    }
  };

  const handleChangeCurrency = async (v: string) => {
    startTransition(async () => {
      const q = form.getFieldValue("paid.quantity") || 1;
      try {
        invariant(q, "Quantity is required");

        // Change to original currency
        if (v === sale?.currency) {
          resetCurrencyAndPPU(q);
          return;
        }

        const currency = v;
        const decimals = sale?.token?.decimals || 18;
        invariant(sale, "Sale is required");
        invariant(q, "Quantity is required");
        invariant(currency, "Currency is required");
        invariant(decimals, "Decimals are required");
        const { pricePerUnit, amount, fees } = await calculator.calculateAmountToPay({


          quantity: String(q),
          sale: sale,
          currency,
          // Add fee if we have a BPS fee configured
          addFee: !!process.env.NEXT_PUBLIC_FEE_BPS,
          // tokenDecimals: decimals,
        });
        // form.reset({})
        form.setFieldValue("paid.amount", amount);
        form.setFieldValue("paid.ppu", pricePerUnit);
        form.setFieldValue("paid.currency", currency);
        form.setFieldValue("paid.quantity", q);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        toast.error(message);
        if (errorCountRef.current >= 3) {
          setBlockForm({ type: "custom", title: message });
        } else {
          errorCountRef.current++;
          resetCurrencyAndPPU(q);
        }
      }
    });
  };

  if (isLoading || loadingOptions) {
    return <InvestSkeleton />;
  }

  if (blockForm) {
    return <FormError {...blockForm} />;
  }

  if (!sale) {
    return <FormError type="sale-ended" />;
  }

  if (sale.availableTokenQuantity === 0) {
    return <FormError type="sale-ended" />;
  }

  // Check if wallet is required but not connected
  const isWalletConnected = !!activeAccount?.address;
  if (!isWalletConnected) {
    return <FormError type="wallet-required" />;
  }

  const amountDescription = getAmountDescription(sale, locale);
  const hasPendingTransaction =
    pendingTransactions?.transactions?.length &&
    pendingTransactions.transactions.length > 0;

  return (
    <form.AppForm>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Wallet */}
        <FormInput
          name="receivingWallet"
          type="text"
          label="Receiving wallet address"
          inputProps={{
            placeholder: "0x1234567890",
          }}
          description="The address where tokens will be sent after release"
          descriptionClassName="text-secondary scroll scrollbar-hidden "
        />

        {/* Quantity */}
        <div className="space-y-4">
          <FormInput
            name="paid.quantity"
            label={`${sale.tokenSymbol} Tokens`}
            type="number"
            listeners={{
              onChange: ({ value }) => {
                handleChangeQuantity(value as string);
              },
            }}
            validators={{
              onChange: z.coerce
                .number({
                  invalid_type_error: "Invalid quantity",
                })
                .int({ message: "Quantity must be a round number" })
                .gte(0, "You must be 13 to make an account")
                .min(
                  sale.minimumTokenBuyPerUser,
                  "You must buy at least the minimum",
                )
                .max(
                  MAX_BUY_ALLOWANCE,
                  "You cannot buy more than the maximum allowed",
                ),
            }}
            inputProps={{
              autoCorrect: "off",
              inputMode: "numeric",
              pattern: "^[0-9]*[.,]?[0-9]*$",
              minLength: 1,
              maxLength: 79,
              spellCheck: false,
              placeholder: "0.00",
            }}
            descriptionClassName="text-secondary scrollbar-hidden"
            description={amountDescription}
          />
          <div className="flex items-end w-full">
            <FormInput
              className="flex-1"
              name="paid.amount"
              label="To pay"
              type="currency"
              inputProps={{
                loading: isPending,
                decimalScale: getDecimalScale(paidCurrency),
                decimalsLimit: 18,
                className:
                  "rounded-r-none pointer-events-none cursor-not-allowed",
                // disabled: true,
                intlConfig: {
                  locale,
                  currency:
                    paidCurrency && FIAT_CURRENCIES.includes(paidCurrency)
                      ? paidCurrency
                      : undefined,
                  maximumFractionDigits: calculator.CRYPTO_PRECISION,
                  minimumFractionDigits: 3,
                },
              }}
            />
            <FormInput
              className="shrink-0"
              name="paid.currency"
              label={""}
              type="select"
              listeners={{
                onChange: ({ value }) => {
                  handleChangeCurrency(value as string);
                },
              }}
              inputProps={{
                className: "rounded-l-none shadow bg-secondary-900/50",
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
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
              type="button"
            >
              <Shield className="w-4 h-4 mr-2" />
              Continue pending transaction
            </Button>
          ) : (
            <PurchaseButton loading={action.isExecuting} disabled={isPending}>
              <PurchaseSummary sale={sale} />
              {sale.requiresKYC && (
                <Alert className="bg-secondary-800/50 border-secondary">
                  <Shield className="h-4 w-4 text-secondary" />
                  <AlertDescription className="text-white/90">
                    <span className="font-bold">KYC Required:</span> You will be
                    prompted to verify your account in the next step.
                  </AlertDescription>
                </Alert>
              )}
              {sale.saftCheckbox && (
                <Alert className="bg-secondary-800/50 border-secondary">
                  <FileText className="h-4 w-4 text-secondary" />
                  <AlertDescription className="text-white/90">
                    <span className="font-bold">SAFT Agreement:</span> You will
                    be prompted to sign a contract in the next steps.
                  </AlertDescription>
                </Alert>
              )}
              {/* @ts-expect-error fixme */}
              <SubmitButton form={form} onSubmit={handleSubmit} />
            </PurchaseButton>
          )}
          <SecurityNotice />

          {process.env.NODE_ENV === "development" && (
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
          type={"button"}
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
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
              type="button"
              loading={isSubmitting || props.loading}
            >
              <Shield className="w-4 h-4 mr-2" />
              {!isConnected ? "Connect Wallet First" : "Purchase Tokens"}
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
    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <div className="flex items-start gap-2">
        <Shield className="w-4 h-4 text-yellow-400 mt-0.5" />
        <div className="text-xs text-yellow-400">
          <p className="font-medium">Security Notice</p>
          <p className="text-yellow-400/80">
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
  activeAccount: Account | undefined,
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
    tokenSymbol: sale?.token?.symbol || "",
    saleId: sale?.id || "",
    receivingWallet: activeAccount?.address || "",
    requiresSaft: !!sale?.saftCheckbox,
    requiresKYC: !!sale?.requiresKYC,
  };
};

const getAmountDescription = (
  sale: Pick<
    SaleWithToken,
    | "minimumTokenBuyPerUser"
    | "maximumTokenBuyPerUser"
    | "availableTokenQuantity"
  >,
  locale: string,
) => {


  let base = `Min: ${formatCurrency(sale.minimumTokenBuyPerUser, {
    locale,
  })}`;
  const val = sale.maximumTokenBuyPerUser || sale.availableTokenQuantity;
  if (val) {
    base += ` / Max: ${formatCurrency(val, {
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

const InvestSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Receiving wallet address section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <div className="relative">
          <Input disabled placeholder="" />
          <Skeleton className="absolute inset-2 h-4 rounded" />
        </div>
      </div>

      {/* tMJS Tokens section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="relative">
          <Input disabled placeholder="" />
          <Skeleton className="absolute inset-2 h-4 w-4 rounded" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* To pay section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-16" />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              disabled
              className="bg-muted/50 border-muted"
              placeholder=""
            />
            <Skeleton className="absolute inset-2 h-4 w-12 rounded" />
          </div>
          <div className="relative w-20">
            <Button variant="outline" disabled className="w-full bg-muted/50">
              <Skeleton className="h-4 w-8" />
            </Button>
          </div>
        </div>
      </div>

      {/* Purchase button */}
      <Button disabled className="w-full h-12 bg-muted/50">
        <Shield className="w-4 h-4 mr-2 opacity-50" />
        <Skeleton className="h-4 w-28" />
      </Button>

      {/* Security notice */}
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-28" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
