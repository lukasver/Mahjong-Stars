"use client";

import { invariant } from "@epic-web/invariant";
import { cn } from "@mjs/ui/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@mjs/ui/primitives/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mjs/ui/primitives/alert-dialog";
import { Button } from "@mjs/ui/primitives/button";
import { Input } from "@mjs/ui/primitives/input";
import { toast } from "@mjs/ui/primitives/sonner";
import { formatCurrency } from "@mjs/utils/client";
import { AlertTriangle, Check, Copy } from "lucide-react";
import { useState } from "react";
import { ZodError } from "zod";
import { metadata } from "@/common/config/site";
import { FOPSchema } from "@/common/schemas/generated";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { ethAddressSchema } from "@/lib/utils";
import { SuccessCryptoPaymentData } from "../widgets/transaction";

export function CryptoManualPaymentForm({
  transaction,
  className,
  onSuccess,
  isSubmitting,
}: {
  transaction: TransactionByIdWithRelations;
  className?: string;
  onSuccess: (d: SuccessCryptoPaymentData) => void;
  isSubmitting?: boolean;
}) {
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const walletAddress = transaction.sale?.toWalletsAddress;
  const amount = transaction.totalAmount.toString();
  const network = transaction.blockchain?.name;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress);
    toast.success("Address copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      invariant(txHash.trim(), "Transaction hash is required");
      ethAddressSchema.parse(txHash);
      setShowConfirmDialog(true);
    } catch (e) {
      const message =
        e instanceof ZodError
          ? e.errors.map((error) => error.message).join(", ")
          : "Please enter a valid transaction hash";
      toast.error(message);
      return;
    }
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setShowConfirmDialog(false);
    onSuccess({
      transactionHash: txHash,
      chainId: transaction.blockchain?.chainId || 0,
      amountPaid: amount,
      paidCurrency: transaction.totalAmountCurrency,
      formOfPayment: FOPSchema.enum.CRYPTO,
      paymentDate: new Date(),
      metadata: {
        paymentMethod: "manual",
        provider: "manual",
      },
    });
  };

  return (
    <div
      className={cn(
        "space-y-6 rounded-xl bg-black p-6",
        "max-w-[398px] mx-auto bg-gray-900/80 border-gray-700/50 backdrop-blur-sm rounded-[20px]",
        className,
      )}
    >
      {/* Instructions */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">
          Manual Payment Instructions
        </h3>
        <p className="text-sm text-zinc-400">
          Send the payment from your external wallet, then paste the transaction
          hash below to verify your payment.
        </p>
      </div>


      {/* Payment Details */}
      <div className="space-y-4 rounded-lg bg-zinc-900/50 p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-zinc-400">Amount to send</span>
            <span className="text-right text-sm font-medium text-white">
              {formatCurrency(amount, {
                locale: "en-US",
                currency: transaction.totalAmountCurrency,
              })}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-zinc-400">Network</span>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium text-white">{network}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-800" />

        {/* Wallet Address */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">
            Send to wallet address
          </label>
          <div className="flex items-center gap-2 rounded-lg bg-black/50 p-3">
            <code className="flex-1 text-sm text-white break-all">
              {walletAddress}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 text-zinc-400 transition-colors hover:text-white"
              title="Copy address"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-5 w-5 shrink-0 stroke-secondary-300" />
        <AlertTitle className="text-sm text-secondary-300">
          Important: Verify Network Before Sending
        </AlertTitle>
        <AlertDescription className="text-xs">
          Ensure you are sending funds on the{" "}
          <strong className="text-red-200">{network}</strong> network. Sending
          funds on the wrong network will result in permanent loss and cannot be
          recovered.
        </AlertDescription>
      </Alert>

      {/* Transaction Hash Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="txHash" className="text-sm font-medium text-white">
            Transaction Hash
          </label>
          <Input
            id="txHash"
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x..."
            required
          />
          <p className="text-xs text-zinc-500">
            Paste the transaction hash from your wallet after sending the
            payment
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !txHash.trim()}
          className="w-full rounded-lg bg-white text-center font-medium text-black transition-all hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Verifying..." : "Submit Transaction Hash"}
        </Button>
      </form>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-secondary-300"
            >Confirm Transaction Submission</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2 text-foreground">
              <p>
                Please confirm that the following information is correct before
                submitting:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>The transaction has been confirmed on the blockchain</li>
                <li>The transaction hash is correct</li>
                <li>
                  You understand that this purchase will be subject to manual
                  reconciliation before it is confirmed.
                </li>
              </ul>
              <div className="pt-2">
                <p className="text-sm font-medium">Transaction Hash:</p>
                <code className="mt-1 block break-all rounded bg-zinc-100 p-2 text-xs text-zinc-900">
                  {txHash}
                </code>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="bg-white text-black hover:bg-zinc-100"
            >
              {isSubmitting ? "Verifying..." : "Yes, Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-center">
        Need help?{" "}
        <a
          className="transition-all text-secondary-300 hover:underline hover:text-secondary-500"
          href={`mailto:${metadata.supportEmail}`}
        >
          Contact support
        </a>
      </p>
      {/* Help Link */}
      {/* <div className="flex items-center justify-center gap-1 text-xs text-zinc-500">
        <span>Need help?</span>
        <a
          href="#"
          className="inline-flex items-center gap-1 text-red-400 hover:text-red-300"
        >
          View guide
          <ExternalLink className="h-3 w-3" />
        </a>
      </div> */}
    </div>
  );
}
