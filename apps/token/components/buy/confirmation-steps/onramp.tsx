"use client";
import { motion } from "@mjs/ui/components/motion";
import { Alert, AlertDescription } from "@mjs/ui/primitives/alert";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { toast } from "@mjs/ui/primitives/sonner";
import { Tooltip } from "@mjs/ui/primitives/tooltip";
import Decimal from "decimal.js";
import { CheckCircle, Coins, CreditCard } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { defineChain, NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { BuyWidget, useActiveWallet } from "thirdweb/react";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import useActiveAccount from "@/components/hooks/use-active-account";
import { useBalanceChecker } from "@/components/hooks/use-balance-checker";
import { PurchaseSummaryCard } from "@/components/invest/summary";
import { client } from "@/lib/auth/thirdweb-client";
import { useBlockchains } from "@/lib/services/api";
import { NETWORK_TO_TOKEN_MAPPING } from "@/lib/services/crypto/config";
import calculator from "@/lib/services/pricefeeds";
import { CryptoPaymentButton } from "./crypto-payment-btn";

export const OnRampWidget = ({
  transaction: tx,
}: {
  transaction: TransactionByIdWithRelations;
}) => {
  const [amount, setAmount] = useState<{
    amount: string | null;
    currency: string | null;
    quantity: string | null;
    pricePerUnit: string | null;
  }>({
    amount: null,
    currency: null,
    quantity: tx.quantity.toString() || null,
    pricePerUnit: null,
  });
  const locale = useLocale();
  const { activeAccount, chainId } = useActiveAccount();
  const activeWallet = useActiveWallet();

  const { data, isLoading, error } = useBlockchains(!!activeAccount);

  const chain = data?.chains?.find((chain) => {
    return chain.chainId === chainId;
  });

  const supportedTokens = getSupportedTokens(chain?.chainId);
  const paymentToken = supportedTokens.find(
    (token) => token.isNative,
  );

  const isBalanceSufficient = useBalanceChecker({
    requiredAmount: amount.amount || "1",
    tokenAddress: paymentToken?.address || undefined,
    isNativeToken: paymentToken?.isNative || false,
  });

  console.log("🚀 ~ onramp.tsx:59 ~ isBalanceSufficient:", isBalanceSufficient);

  useEffect(() => {
    console.log("🚀 ~ TX DATA", tx);
    if (!isLoading && !amount.amount && chain) {
      (async () => {
        const newPaidCurrency = paymentToken?.symbol;

        console.log("🚀 ~ onramp.tsx:68 ~ newPaidCurrency:", newPaidCurrency);


        // We should not add fee here but probably add an extra for the gas??

        const result = await calculator.convertCurrency({
          amount: tx.totalAmount.toString(),
          fromCurrency: tx.paidCurrency,
          toCurrency: newPaidCurrency,
          precision: 18,
        });

        setAmount((p) => ({
          ...p,
          amount: new Decimal(result.amount).toSignificantDigits().toString(),
          currency: result.currency,
          pricePerUnit: new Decimal(result.pricePerUnit)
            .toSignificantDigits()
            .toString(),
        }));
      })();
    }
  }, [!!data, amount]);

  if (isLoading) {
    return <Skeleton className="w-full min-w-[165px] h-10" />;
  }

  if (error || !data?.chains?.length) {
    return <div>Error</div>;
  }

  if (!chain) {
    return <div>Chain not found</div>;
  }

  const handlePrepareTransaction = () => {
    console.log("🚀 ~ handlePrepareTransaction ~ amount:", amount);
  };

  console.log("🚀 ~ OnRampWidget ~ amount:", amount);

  return (
    <div className="space-y-4">
      <PurchaseSummaryCard
        purchased={{
          quantity: tx.quantity.toString(),
          tokenSymbol: tx.tokenSymbol,
        }}
        base={tx.quantity.toString()}
        total={tx.quantity.toString()}
        paid={{
          totalAmount: amount.amount || "1",
          currency: amount.currency || tx.paidCurrency,
        }}
        locale={locale}
      />
      <div className="w-full flex flex-col md:flex-row justify-between gap-4">
        <div className="shrink-0">
          <BuyWidget
            client={client}
            title="Get Funds"
            chain={defineChain(chain.chainId)}
            amount={amount.amount || "1"}
            activeWallet={activeWallet}
            paymentMethods={["card"]}
            onSuccess={() => {
              handlePrepareTransaction();
            }}
            onCancel={() => {
              toast.error("Purchase cancelled by user");
            }}
            onError={(error) => {
              toast.error(error.message);
            }}
          // supportedTokens={{ [chain.chainId]: getSupportedTokens(chain.chainId) }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex-1 space-y-4"
        >
          <PaymentInstructions />
        </motion.div>
      </div>

      <Tooltip content={isBalanceSufficient ? '' : "You need to add funds to your wallet to complete the purchase"}>
        <div className="flex flex-col [&>*]:flex-1 [&>*]:w-full gap-2">
          <CryptoPaymentButton
            chain={{
              chainId: chain.chainId,
              isNative: paymentToken?.isNative || false,
              decimals: paymentToken?.decimals || 18,
              contractAddress: paymentToken?.address || NATIVE_TOKEN_ADDRESS,
            }}
            toWallet={tx.sale.toWalletsAddress}
            amount={amount.amount || "1"}
            disabled={!isBalanceSufficient}
            txId={tx.id}
            onSuccess={() => {
              console.log("🚀 ~ onSuccess ~ onSuccess:");
            }}
          />
        </div>
      </Tooltip>
    </div>
  );
};

export const PaymentInstructions = () => {
  return (
    <ol className="flex flex-col gap-4 justify-between items-center">
      {paymentSteps.map((step, index) => (
        <li key={step.id}>
          <Alert className={step.alertClassName}>
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full ${step.stepNumberBg} flex items-center justify-center font-semibold ${step.stepNumberText}`}
              >
                {step.id}
              </div>
            </div>
            <AlertDescription className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <step.icon className="h-4 w-4" />
                <h3 className="font-semibold">{step.title}</h3>
                {/* <Badge variant={step.badge.variant}>{step.badge.text}</Badge> */}
              </div>
              <p className="text-sm text-secondary-500 leading-relaxed">
                {step.description}
              </p>
            </AlertDescription>
          </Alert>
        </li>
      ))}
    </ol>
  );
};

const paymentSteps = [
  {
    id: 1,
    icon: CreditCard,
    title: "FIAT On-Ramping",
    badge: { text: "Thirdweb Payments", variant: "secondary" as const },
    description:
      "FIAT payments are processed by on-ramping funds to your wallet via credit card. Select between a series of providers your prefered quote. This allows you to fund your wallet seamlessly.",
    stepNumberBg: "bg-primary-800",
    stepNumberText: "text-sm",
    alertClassName: "flex gap-4 p-4 rounded-lg border",
  },
  {
    id: 2,
    icon: Coins,
    title: "Purchase Crypto",
    badge: { text: "Multiple Options", variant: "outline" as const },
    description:
      "You need to buy funds in any supported cryptocurrency to pay for the purchased tokens. Choose from our supported currencies based on your preference and availability.",
    stepNumberBg: "bg-primary-800",
    stepNumberText: "text-sm",
    alertClassName: "flex gap-4 p-4 rounded-lg border",
  },
  {
    id: 3,
    icon: CheckCircle,
    title: "Complete Purchase",
    badge: { text: "Final Step", variant: "default" as const },
    description:
      "After on-ramping funds, execute the payment transaction to confirm your tokens purchase",
    stepNumberBg: "bg-primary-800",
    stepNumberText: "text-sm",
    alertClassName: "flex gap-4 p-4 rounded-lg border",
  },
];

function getSupportedTokens(chainId: number | undefined) {
  if (!chainId) return [];
  return Object.values(NETWORK_TO_TOKEN_MAPPING[chainId] || {}).map((t) => ({
    name: t.symbol,
    address: t.contract,
    symbol: t.symbol,
    isNative: t.isNative,
    decimals: t.decimals,
  }));
}
