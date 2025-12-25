"use client";

import { invariant } from "@epic-web/invariant";
import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import ErrorBoundary from "@mjs/ui/components/error-boundary";
import { FileUpload } from "@mjs/ui/components/file-upload";
import { motion } from "@mjs/ui/components/motion";
import { Button } from "@mjs/ui/primitives/button";
import { Card, CardContent } from "@mjs/ui/primitives/card";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { toast } from "@mjs/ui/primitives/sonner";
import { copyToClipboard, safeFormatCurrency } from "@mjs/utils/client";
import { Banknote } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { FIAT_CURRENCIES } from "@/common/config/constants";
import { metadata } from "@/common/config/site";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { BankDetailsCard } from "@/components/bank-details";
import { PurchaseSummaryCard } from "@/components/invest/summary";
import { Placeholder } from "@/components/placeholder";
import { PulseLoader } from "@/components/pulse-loader";
import {
  associateDocumentsToUser,
  confirmTransaction,
  getFileUploadPrivatePresignedUrl,
} from "@/lib/actions";
import { useCardProviderAvailability, useSaleBanks } from "@/lib/services/api";
import { getQueryClient } from "@/lib/services/query";
import { uploadFile } from "@/lib/utils/files";
import { Instaxchange } from "../widgets/instaxchange";
import { isFileWithPreview } from "./utils";

export function TransferPaymentHandler({
  transaction: tx,
  onSuccess,
}: {
  transaction: TransactionByIdWithRelations;
  onSuccess: () => void;
}) {
  const { data: availabilityData, isLoading: isCheckingAvailability } =
    useCardProviderAvailability();

  // Show loading state while checking availability or amount
  if (isCheckingAvailability) {
    return (
      <PulseLoader
        className="justify-center"
        text="Checking available payment options..."
      />
    );
  }

  const isProviderAvailable = availabilityData?.available ?? false;

  if (isProviderAvailable) {
    const onError = (error: string) => {
      toast.error(error);
    };

    const FallbackComponent = () => (
      <ManualTransferPaymentHandler transaction={tx} onSuccess={onSuccess} />
    );

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <ErrorBoundary fallback={<FallbackComponent />}>
          <Instaxchange
            method={"sepa"}
            txId={tx.id}
            // onSuccess={onSuccess}
            onError={onError}
            errorComponent={<FallbackComponent />}
          />
        </ErrorBoundary>
      </motion.div>
    );
  }

  return (
    <ManualTransferPaymentHandler transaction={tx} onSuccess={onSuccess} />
  );
}

const ManualTransferPaymentHandler = ({
  transaction: tx,
  onSuccess,
}: {
  transaction: TransactionByIdWithRelations;
  onSuccess: () => void;
}) => {
  const locale = useLocale();
  const { data: banks, isLoading: isBanksLoading } = useSaleBanks(
    tx?.sale?.id || "",
  );
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
          const qc = getQueryClient();
          const keys = [["transactions"], ["sales"]];
          keys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
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

  if (isBanksLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!banks?.banks?.length) {
    return (
      <div className='space-y-4'>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <PurchaseSummaryCard
            className={'rounded-2xl'}
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Card className={getGlassyCardClassName("rounded-2xl border p-6")}>
            <CardContent>
              <Placeholder
                title="Bank Transfer Payment Unavailable"
                description=""
                icon={Banknote}
              >
                <div className="text-sm">
                  <p>
                    Please contact us at{" "}
                    <a
                      className="transition-all text-secondary-300 hover:underline hover:text-secondary-500"
                      href={`mailto:${metadata.supportEmail}`}
                    >
                      {metadata.supportEmail}
                    </a>
                    . Our team will provide you with the necessary payment
                    details and instructions.
                  </p>
                  <p className="text-sm text-secondary-300">We apologize for the inconvenience</p>
                </div>
              </Placeholder>
            </CardContent>
          </Card>
        </motion.div>
      </div>
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
                ? 2
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
        {banks?.banks?.length &&
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
          ))}
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
