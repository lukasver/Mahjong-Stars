"use client";

import { motion } from "@mjs/ui/components/motion";
import { toast } from "@mjs/ui/primitives/sonner";
import Decimal from "decimal.js";
import { useState } from "react";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { useUsdAmount } from "@/components/hooks/use-usd-amount";
import { PulseLoader } from "@/components/pulse-loader";
import { useCardProviderAvailability } from "@/lib/services/api";
import {
  InstaxchangeWidget,
  SuccessInstaxchangePaymentData,
} from "../widgets/instaxchange";
import { SuccessCryptoPaymentData } from "../widgets/transaction";
import { CardPaymentNotice } from "./card-payment-notice";
import { CryptoPaymentComponent } from "./payment-step-crypto";

interface CardPaymentHandlerProps {
  transaction: TransactionByIdWithRelations;
  onSuccessInstaxchange: (d: SuccessInstaxchangePaymentData) => void;
  onSuccessCrypto: (d: SuccessCryptoPaymentData) => void;
}


// Amount threshold for Instaxchange (USD 1,000)
const INSTAXCHANGE_MAX_AMOUNT = new Decimal(1000);
/**
 * Component that handles card payment logic
 * Checks card provider availability and conditionally renders Instaxchange widget or fallback
 */
export function CardPaymentHandler({
  transaction: tx,
  onSuccessInstaxchange,
  onSuccessCrypto,
}: CardPaymentHandlerProps) {
  const {
    data: availabilityData,
    isLoading: isCheckingAvailability,
  } = useCardProviderAvailability();

  const isProviderAvailable = availabilityData?.available ?? false;
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);

  const { usdAmount, isLoading: isCheckingAmount } = useUsdAmount({
    amount: tx?.totalAmount,
    currency: tx?.paidCurrency,
  });

  /**
   * Check the logic. Not if the provider is available.
   */
  const shouldUseInstaxchange =
    !isCheckingAmount &&
    usdAmount !== null &&
    usdAmount.lte(INSTAXCHANGE_MAX_AMOUNT) &&
    tx.formOfPayment === "CARD";







  const isLoading = isCheckingAvailability || isCheckingAmount

  // Show loading state while checking availability or amount
  if (isLoading) {
    return (
      <PulseLoader
        className="justify-center"
        text="Checking available payment options..."
      />
    );
  }

  const shouldUseProvider = isProviderAvailable && shouldUseInstaxchange;
  const shouldShowNotice = !isProviderAvailable && shouldUseInstaxchange;
  // const shouldUseCrypto = !shouldUseInstaxchange && tx.formOfPayment === "CARD" && onSuccessCrypto;


  // If provider is available and should use Instaxchange, render widget
  if (shouldUseProvider) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <InstaxchangeWidget
          txId={tx?.id}
          onSuccess={onSuccessInstaxchange}
          onError={(error) => {
            toast.error("Payment Error", {
              description: error,
            });
          }}
        />
      </motion.div>
    );
  }


  // If provider is unavailable, show notice with reservation options
  if (shouldShowNotice) {
    // If user selected different payment method, show crypto payment
    if (showCryptoPayment && onSuccessCrypto) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <CryptoPaymentComponent
            transaction={tx}
            onSuccessPayment={onSuccessCrypto}
            showHelp
          />
        </motion.div>
      );
    }

    return (
      <CardPaymentNotice
        transaction={tx}
        onSelectDifferent={
          () => setShowCryptoPayment(true)
        }
      />
    );
  }
  // // If amount exceeds Instaxchange threshold, use crypto payment (Thirdweb)
  // // This applies regardless of provider availability since Instaxchange can't handle large amounts
  // if (
  //   shouldUseCrypto
  // ) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <CryptoPaymentComponent
        transaction={tx}
        onSuccessPayment={onSuccessCrypto}
        showHelp
      />
    </motion.div>
  );
  // }

  // throw new Error("Invalid payment state");
}
