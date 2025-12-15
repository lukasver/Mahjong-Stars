"use client";

import { invariant } from "@epic-web/invariant";
import { FileUpload } from "@mjs/ui/components/file-upload";
import { motion } from "@mjs/ui/components/motion";
import { useActionListener } from "@mjs/ui/hooks/use-action-listener";
import { Button } from "@mjs/ui/primitives/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { toast } from "@mjs/ui/primitives/sonner";
import { Tabs, TabsContent } from "@mjs/ui/primitives/tabs";
import { copyToClipboard, safeFormatCurrency } from "@mjs/utils/client";
import { TransactionStatus } from "@prisma/client";
import Decimal from "decimal.js";
import { notFound, useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { FIAT_CURRENCIES, ONE_MINUTE } from "@/common/config/constants";
import { metadata as siteConfig } from "@/common/config/site";
import { FOPSchema } from "@/common/schemas/generated";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import {
  BankDetailsCard,
  BankDetailsSkeleton,
} from "@/components/bank-details";
import { FormError } from "@/components/form-error";
import useActiveAccount from "@/components/hooks/use-active-account";
import { useUsdAmount } from "@/components/hooks/use-usd-amount";
import { PurchaseSummaryCard } from "@/components/invest/summary";
import { PulseLoader } from "@/components/pulse-loader";
import { SwitchNetworkButton } from "@/components/switch-network-button";
import {
  associateDocumentsToUser,
  confirmCryptoTransaction,
  confirmInstaxchangeTransaction,
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
import { InstaxchangeWidget } from "../widgets/instaxchange";
import { OnRampWidget } from "../widgets/onramp";
import {
  CryptoTransactionWidget,
  SuccessCryptoPaymentData,
} from "../widgets/transaction";
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

  const { execute } = useActionListener(useAction(confirmCryptoTransaction), {
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error("Transaction error", error);
      toast.error(error);
    },
  });

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

  const handleInstaxchangeSuccess = (d: SuccessCryptoPaymentData) => {
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
            <CardTitle><h2 className='font-head'>Payment</h2></CardTitle>
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
          />
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
  onSuccess: (d: SuccessCryptoPaymentData) => void;
}) => {
  const { chainId } = useActiveAccount();

  const {
    data: cryptoTransaction,
    isLoading,
    error,
  } = useCryptoTransaction(tx.id, { chainId: chainId || 0 });

  return (
    <div className="py-2 text-center space-y-4">
      {/* <motion.div
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
      </motion.div> */}

      {/* Balance Checker */}
      {error ? (
        <FormError type="custom" title="Error" message={error} />
      ) : !cryptoTransaction?.paymentToken || !cryptoTransaction?.blockchain ? (
        <FormError
          type="switch-network"
          title="Error"
          message="Payment with this token not supported on this network, please try a different network"
        >
          <div className="w-full flex justify-center">
            <SwitchNetworkButton />
          </div>
        </FormError>
      ) : (
        !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <CryptoComponent transaction={tx} onSuccessPayment={onSuccess} />
          </motion.div>
        )
      )}
    </div>
  );
};

const FiatPayment = ({
  tx,
  onSuccess,
  onSuccessCrypto,
  onSuccessInstaxchange,
}: {
  tx: TransactionByIdWithRelations;
  onSuccess: () => void;
  onSuccessCrypto: (d: SuccessCryptoPaymentData) => void;
  onSuccessInstaxchange: (d: SuccessCryptoPaymentData) => void;
}) => {
  const { data: banks, isLoading: isBanksLoading } = useSaleBanks(
    tx?.sale?.id || "",
  );
  const locale = useLocale();
  const [files, setFiles] = useState<unknown[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // const [paymentMethod, setPaymentMethod] = useState<"CARD" | "TRANSFER">(
  //   "CARD",
  // );

  // Convert transaction amount to USD for threshold checking
  const { usdAmount, isLoading: isCheckingAmount } = useUsdAmount({
    amount: tx?.totalAmount,
    currency: tx?.paidCurrency,
  });

  console.log("🚀 ~ payment-step.tsx:304 ~ isCheckingAmount:", isCheckingAmount);


  console.log("🚀 ~ payment-step.tsx:304 ~ usdAmount:", usdAmount);


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

  // Amount threshold for Instaxchange (USD 1,000)
  const INSTAXCHANGE_MAX_AMOUNT = new Decimal(1000);

  const shouldUseInstaxchange =
    !isCheckingAmount &&
    usdAmount !== null &&
    usdAmount.lte(INSTAXCHANGE_MAX_AMOUNT) &&
    tx.formOfPayment === "CARD";

  // If no banks available or form of payment is CARD, show card payment (Instaxchange or Thirdweb)
  if (
    (!isBanksLoading && banks?.banks?.length === 0) ||
    tx.formOfPayment === "CARD"
  ) {
    if (true) {
      return (

        <PulseLoader text="Checking payment options..." />

      );
    }

    // Use Instaxchange for amounts ≤ USD 1,000, Thirdweb for larger amounts
    if (shouldUseInstaxchange) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <InstaxchangeWidget
            transaction={tx}
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

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <CryptoComponent
          transaction={tx}
          onSuccessPayment={onSuccessCrypto}
          showHelp
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {[FOPSchema.enum.CARD, FOPSchema.enum.TRANSFER].includes(
        tx.formOfPayment,
      ) ? (
        <Tabs
          value={tx.formOfPayment}
        // onValueChange={(value) =>
        //   setPaymentMethod(value as "CARD" | "TRANSFER")
        // }
        >
          {/* <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="CARD">Card Payment</TabsTrigger>
            <TabsTrigger value="TRANSFER">Bank Transfer</TabsTrigger>
          </TabsList> */}

          <TabsContent value={FOPSchema.enum.CARD}>
            {isCheckingAmount ? (
              <div className="space-y-4 p-4 mx-auto">
                <PulseLoader text="Checking payment options..." />
              </div>
            ) : shouldUseInstaxchange ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <InstaxchangeWidget
                  transaction={tx}
                  onSuccess={onSuccessInstaxchange}
                  onError={(error) => {
                    toast.error("Payment Error", {
                      description: error,
                    });
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <CryptoComponent
                  transaction={tx}
                  onSuccessPayment={onSuccessCrypto}
                  showHelp
                />
              </motion.div>
            )}
          </TabsContent>
          <TabsContent value="TRANSFER">
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
                to one of the following bank accounts & upload a proof of
                payment:
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
                  <label className="font-medium">
                    Upload Bank Transfer Receipt
                  </label>
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
                  {isSubmitting
                    ? "Submitting..."
                    : "Submit Payment Confirmation"}
                </Button>
              </motion.form>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Fallback to card payment if no banks available
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <CryptoComponent
            transaction={tx}
            onSuccessPayment={onSuccessCrypto}
            showHelp
          />
        </motion.div>
      )}
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
    return (
      <CardContent className="flex justify-center items-center h-full">
        <PulseLoader text="Wait for it..." />
      </CardContent>
    );
  }

  if (!isAvailable) {
    return <div>Transaction not available</div>;
  }

  return children;
}

type CryptoComponentProps = {
  mode?: "transaction" | "onramp";
  transaction: TransactionByIdWithRelations;
  onSuccessPayment: (d: SuccessCryptoPaymentData) => void;

  showHelp?: boolean;
};
const CryptoComponent = (props: CryptoComponentProps) => {
  const { mode = "transaction", ...rest } = props;

  return mode === "transaction" ? (
    <div className="space-y-4">
      {props.showHelp && (
        <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600 max-w-[398] mx-auto">
          <h4 className="text-secondary-300 font-medium">Important notice:</h4>
          <div className="space-y-2 text-sm">
            <p>
              Payments with credit card are processed by Thirdweb Payments
              providers. <br />
              You will be redirected to fund your current wallet with the
              required amount of crypto to pay for the tokens.
              <br />
              This process can take a couple minutes, please do not close this
              page.
            </p>
          </div>
        </div>
      )}
      <CryptoTransactionWidget {...rest} />
      <p className="text-center">
        Need help?{" "}
        <a
          className="transition-all text-secondary-300 hover:underline hover:text-secondary-500"
          href={`mailto:${siteConfig.supportEmail}`}
        >
          Contact support
        </a>
      </p>
    </div>
  ) : (
    <OnRampWidget {...rest} />
  );
};
