"use client";

import { invariant } from "@epic-web/invariant";
import { FileUpload } from "@mjs/ui/components/file-upload";
import { motion } from "@mjs/ui/components/motion";
import { Button } from "@mjs/ui/primitives/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { toast } from "@mjs/ui/primitives/sonner";
import { copyToClipboard, safeFormatCurrency } from "@mjs/utils/client";
import { TransactionStatus } from "@prisma/client";
import { notFound, useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { FIAT_CURRENCIES, ONE_MINUTE } from "@/common/config/constants";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import {
  BankDetailsCard,
  BankDetailsSkeleton,
} from "@/components/bank-details";
import { BalanceChecker } from "@/components/buy/balance-checker";
import { PurchaseSummaryCard } from "@/components/invest/summary";
import { PulseLoader } from "@/components/pulse-loader";
import {
  associateDocumentsToUser,
  confirmTransaction,
  getFileUploadPrivatePresignedUrl,
} from "@/lib/actions";
import {
  useCryptoTransaction,
  useSaleBanks,
  useTransactionAvailabilityForSale,
  useTransactionById,
} from "@/lib/services/api";
import { getQueryClient } from "@/lib/services/query";
import { uploadFile } from "@/lib/utils/files";
import { CryptoPaymentButton } from "./crypto-payment-btn";
import { OnRampWidget } from "../onramp";
import { isFileWithPreview } from "./utils";

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
  }, [tx?.transaction?.status]);

  if (isLoading) {
    return (
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <CardHeader>
            <CardTitle>Payment</CardTitle>
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
    // return <CardContent>Transaction not found.</CardContent>;
    return notFound();
  }

  // TODO: Confirm the correct path for payment fields and type properly
  const paymentMethod = tx?.transaction?.formOfPayment;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>
            Please follow the instructions below to complete your payment.
          </CardDescription>
        </CardHeader>
      </motion.div>
      <CardContent>
        {paymentMethod !== "CRYPTO" ? (
          <FiatPayment tx={tx.transaction} onSuccess={onSuccess} />
        ) : (
          <CryptoPayment tx={tx.transaction} onSuccess={onSuccess} />
        )}
      </CardContent>
    </>
  );
}

const CryptoPayment = ({
  tx,
  onSuccess,
}: {
  tx: TransactionByIdWithRelations;
  onSuccess: () => void;
}) => {
  const locale = useLocale();
  const { data: cryptoTransaction, isLoading } = useCryptoTransaction(tx.id);

  const [isBalanceSufficient, setIsBalanceSufficient] = useState(false);

  // const { data: profiles } = useSocialProfiles({
  //   client,
  //   address: ac?.address,
  // });

  return (
    <div className="py-2 text-center space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <PurchaseSummaryCard
          purchased={{
            quantity: tx.quantity.toString(),
            tokenSymbol: tx.tokenSymbol,
          }}
          base={tx.quantity.toString()}
          total={tx.quantity.toString()}
          paid={{
            totalAmount: tx.totalAmount.toString(),
            currency: tx.paidCurrency,
          }}
          locale={locale}
        />
      </motion.div>

      {/* Balance Checker */}
      {!isLoading && cryptoTransaction?.paymentToken && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <BalanceChecker
            onBalanceCheck={(result) => {
              setIsBalanceSufficient(result);
            }}
            requiredAmount={tx.totalAmount.toString()}
            tokenAddress={
              cryptoTransaction.paymentToken.contractAddress || undefined
            }
            tokenSymbol={cryptoTransaction.paymentToken.tokenSymbol}
            isNativeToken={cryptoTransaction.paymentToken.isNative}
            chainId={cryptoTransaction.blockchain.chainId}
            onAddFunds={() => {
              // Open external link to add funds
              window.open("https://binance.com", "_blank");
            }}
          />
        </motion.div>
      )}

      {/* <div className='mb-2'>
        <span className='font-medium'>Crypto payment</span> (coming soon)
      </div> */}
      {/* <div className='text-muted-foreground'>
        Please follow the instructions for crypto payment in the next step.
      </div> */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="flex flex-col gap-2"
        >
          <CryptoPaymentButton
            chain={cryptoTransaction?.paymentToken}
            toWallet={cryptoTransaction?.transaction?.sale?.toWalletsAddress}
            amount={tx.totalAmount.toString()}
            disabled={!isBalanceSufficient}
            txId={tx.id}
            onSuccess={onSuccess}
          />
        </motion.div>
      )}
    </div>
  );
};

const FiatPayment = ({
  tx,
  onSuccess,
}: {
  tx: TransactionByIdWithRelations;
  onSuccess: () => void;
}) => {


  const { data: banks, isLoading: isBanksLoading } = useSaleBanks(
    tx?.sale?.id || "",
  );
  const locale = useLocale();
  const [files, setFiles] = useState<unknown[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handles the upload of the bank slip file.
   */
  const handleBankSlipChange = (fileList: unknown[]) => {
    setFiles(fileList.slice(0, 1));
    setError(null);
    setSuccess(false);
  };

  /**
   * Handles the payment confirmation submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      invariant(banks?.banks?.length, "No banks found, try again later");
      invariant(tx, "Transaction id could not be found");
      invariant(files.length, "No files uploaded");

      const saleId = tx.sale.id;
      const txId = tx.id;

      const validFiles = files
        .map((f) => (isFileWithPreview(f) ? f.file : null))
        .filter((f): f is File => !!f);
      const response = await Promise.all(
        validFiles.map(async (file) => {
          const key = `sale/${saleId}/tx/${txId}/${file.name}`;
          const urlRes = await getFileUploadPrivatePresignedUrl({ key });
          if (!urlRes?.data?.url) throw new Error("Failed to get upload URL");
          await uploadFile(file, urlRes.data.url).then();
          // Here i need to update our backend with refernece to the file
          return key;
        }),
      );

      const keys = response.flatMap((key) => ({ key }));
      const [_associateResult, confirmResult] = await Promise.allSettled([
        associateDocumentsToUser({
          documents: keys,
          type: "PAYMENT",
          transactionId: txId,
        }),
        confirmTransaction({
          id: txId,
          type: "FIAT",
          payload: {
            paymentDate: new Date(),
          },
        }).then(() => {
          const client = getQueryClient();
          const keys = [["transactions"], ["sales"]];
          keys.forEach((key) => client.invalidateQueries({ queryKey: key }));
        }),
      ]);

      if (confirmResult.status === "rejected") {
        throw confirmResult.reason;
      }

      setSuccess(true);
      setFiles([]);
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isBanksLoading && banks?.banks?.length === 0 || tx.formOfPayment === 'CARD') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <OnRampWidget
          transaction={tx}
          onSuccessPayment={onSuccess}
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <PurchaseSummaryCard
          locale={locale}
          purchased={{
            quantity: tx.quantity.toString(),
            tokenSymbol: tx.sale.tokenSymbol,
          }}
          total={tx.quantity.toString()}
          paid={{
            totalAmount: tx.totalAmount.toString(),
            currency: tx.paidCurrency,
          }}
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-sm text-foreground"
      >
        Proceed to pay{" "}
        <span className="font-medium ">
          {safeFormatCurrency(
            {
              totalAmount: tx?.totalAmount.toString(),
              currency: tx?.paidCurrency,
            },
            {
              locale,
              precision: FIAT_CURRENCIES.includes(tx?.paidCurrency)
                ? "FIAT"
                : "CRYPTO",
            },
          )}
        </span>{" "}
        to one of the following bank accounts & upload a proof of payment:
      </motion.p>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        Bank Details:
      </motion.h3>
      <motion.ul
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="space-y-4 max-h-[600px] overflow-y-auto"
      >
        {isBanksLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          banks?.banks.map((bank, index) => (
            <motion.li
              key={bank.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + index * 0.1, duration: 0.4 }}
            >
              <BankDetailsCard
                noSelectable
                onCopy={() => {
                  copyToClipboard(bank.iban);
                  toast.success("IBAN copied to clipboard");
                }}
                data={{
                  bankName: bank.bankName,
                  iban: bank.iban,
                  currency: bank.currency,
                  accountName: bank.accountName || "",
                  swift: bank.swift || "",
                  address: bank.address || "",
                  memo: bank.memo || "",
                }}
              />
            </motion.li>
          ))
        )}
      </motion.ul>
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.4 }}
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div>
          <label className="font-medium">Upload Bank Transfer Receipt</label>
          <FileUpload
            type="all"
            maxSizeMB={5}
            className="w-full"
            multiple={false}
            onFilesChange={handleBankSlipChange}
          />
        </div>
        {error && <div className="text-destructive mt-2">{error}</div>}
        {success && (
          <div className="text-success mt-2">
            Payment confirmation submitted!
          </div>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={!banks?.banks?.length || !files.length}
          variant="accent"
          loading={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Payment Confirmation"}
        </Button>
      </motion.form>
    </div>
  );
};

/**
 * Used to check if the payment if the sale is still available for the transaction to render the payment page. If it is, render the children, otherwise renders an error component.
 */
export function PaymentAvailabilityGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tx: txId } = useParams();
  const { data, isLoading } = useTransactionAvailabilityForSale(
    txId as string,
    {
      refetchInterval: ONE_MINUTE,
      enabled: !!txId,
      staleTime: ONE_MINUTE,
    },
  );

  const isAvailable = data?.transaction === true;

  if (isLoading) {
    return <CardContent className="flex justify-center items-center h-full"><PulseLoader text='Wait for it...' /></CardContent>;
  }

  if (!isAvailable) {
    return <div>Transaction not available</div>;
  }

  return children;
}
