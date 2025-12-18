"use client";

import { motion } from "@mjs/ui/components/motion";
import { useActionListener } from "@mjs/ui/hooks/use-action-listener";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { toast } from "@mjs/ui/primitives/sonner";
import { TransactionStatus } from "@prisma/client";
import { notFound, useParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { BankDetailsSkeleton } from "@/components/bank-details";
import {
  confirmCryptoTransaction,
  confirmInstaxchangeTransaction,
} from "@/lib/actions";
import { useTransactionById } from "@/lib/services/api";
import { SuccessInstaxchangePaymentData } from "../widgets/instaxchange";
import { SuccessCryptoPaymentData } from "../widgets/transaction";
import { CryptoPayment } from "./payment-step-crypto";
import { FiatPayment } from "./payment-step-fiat";

interface PaymentStepProps {
  onSuccess: () => void;
}

/**
 * Step 3: Payment Step
 * Shows payment instructions and collects payment confirmation info.
 */
export function PaymentStep({ onSuccess }: PaymentStepProps) {
  const { tx: txId } = useParams();
  const { data: tx, isLoading } = useTransactionById(txId as string);

  const { execute, isPending } = useActionListener(
    useAction(confirmCryptoTransaction),
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error) => {
        console.error("Transaction error", error);
        toast.error(error);
      },
    },
  );

  useEffect(() => {
    const status = tx?.transaction?.status;
    if (
      status &&
      ![TransactionStatus.AWAITING_PAYMENT, TransactionStatus.PENDING].includes(
        status,
      )
    ) {
      onSuccess();
    }
  }, [tx?.transaction?.status, onSuccess]);

  const handleCryptoSuccessPayment = (d: SuccessCryptoPaymentData) => {
    // amount paid can vary if the user paid in a different token than selected, Example: selected fiat but ended up payingi n ETH
    const payload = {
      txId,
      receipt: d.transactionHash,
      chainId: d.chainId,
      amountPaid: d.amountPaid,
      paymentDate: d.paymentDate || new Date(),
      comment: d.comment,
      extraPayload: {
        formOfPayment: d.formOfPayment,
        paidCurrency: d.paidCurrency,
      },
      ...(d.metadata && { metadata: d.metadata }),
    } as Parameters<typeof execute>[0];
    execute(payload);
  };

  const { execute: executeInstaxchange } = useAction(
    confirmInstaxchangeTransaction,
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: ({ error }) => {
        console.error("Instaxchange transaction error", error);
        toast.error(error.serverError || "Instaxchange transaction error");
      },
    },
  );

  const handleInstaxchangeSuccess = (d: SuccessInstaxchangePaymentData) => {
    const payload = {
      txId: txId as string,
      sessionId: d.metadata?.sessionId as string,
      transactionHash: d.transactionHash,
      amountPaid: d.amountPaid,
      paymentDate: d.paymentDate || new Date(),
      paidCurrency: d.paidCurrency,
      metadata: {
        paymentMethod: d.metadata?.paymentMethod,
        provider: d.metadata?.provider || "instaxchange",
      },
    } as Parameters<typeof executeInstaxchange>[0];
    executeInstaxchange(payload);
  };

  if (isLoading) {
    return (
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <CardHeader>
            <CardTitle>
              <h2 className="font-head">Payment</h2>
            </CardTitle>
            <CardDescription>
              Please follow the instructions below to complete your payment.
            </CardDescription>
          </CardHeader>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="space-y-4"
        >
          {[1, 2, 3].map((i) => (
            <BankDetailsSkeleton key={i} />
          ))}
        </motion.div>
      </CardContent>
    );
  }

  if (!tx) {
    return notFound();
  }

  const paymentMethod = tx?.transaction?.formOfPayment;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        data-testid="payment-step-container"
      >
        <CardHeader>
          <CardTitle className="font-head">Payment</CardTitle>
          <CardDescription>
            Please follow the instructions below to complete your payment.
          </CardDescription>
        </CardHeader>
      </motion.div>
      <CardContent>
        {paymentMethod !== "CRYPTO" ? (
          <FiatPayment
            tx={tx.transaction}
            onSuccess={onSuccess}
            onSuccessCrypto={handleCryptoSuccessPayment}
            onSuccessInstaxchange={handleInstaxchangeSuccess}
          />
        ) : (
          <CryptoPayment
            tx={tx.transaction}
            onSuccess={handleCryptoSuccessPayment}
            isPending={isPending}
          />
        )}
      </CardContent>
    </>
  );
}
