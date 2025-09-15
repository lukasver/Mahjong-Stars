"use client";

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
import { Badge } from "@mjs/ui/primitives/badge";
import { Button } from "@mjs/ui/primitives/button";
import { toast } from "@mjs/ui/primitives/sonner";
import { safeFormatCurrency } from "@mjs/utils/client";
import { CheckIcon, Eye, FileText, UserCheck, XCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { FIAT_CURRENCIES } from "@/common/config/constants";
import { AdminTransactionsWithRelations } from "@/common/types/transactions";
import { confirmAdminTransaction } from "@/lib/actions/admin";
import { getDocumentById } from "@/lib/services/fetchers";
import { getQueryClient } from "@/lib/services/query";

interface ApproveTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: AdminTransactionsWithRelations;
}

/**
 * Dialog component for approving a transaction
 * Shows transaction details, KYC status, and SAFT status
 */
export function ApproveTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: ApproveTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDocument, setLoadingDocument] = useState<string | null>(null);
  const locale = useLocale();

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await confirmAdminTransaction({
        id: transaction.id,
        requiresKYC:
          requiresKyc &&
          // Only change to verified if the kyc status is not not_started or rejected
          !(kycStatus === "NOT_STARTED" || kycStatus === "REJECTED"),
      });
      const queryClient = getQueryClient();
      await queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
      toast.success("Transaction approved successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const kycStatus = transaction.user.kycVerification?.status;
  const kycDocuments = transaction.user.kycVerification?.documents || [];
  const hasKycDocuments = kycDocuments.length > 0;
  const isKycVerified = kycStatus === "VERIFIED";
  const requiresSaft = transaction.sale.saftCheckbox;
  const requiresKyc = transaction.sale.requiresKYC;
  const hasSaftContract = transaction.agreementId;

  const formatAmount = (amount: string | number, currency: string) => {
    return safeFormatCurrency(
      { totalAmount: amount.toString(), currency },
      {
        locale,
        precision: FIAT_CURRENCIES.includes(currency) ? "FIAT" : "CRYPTO",
      },
    );
  };

  const handleDocumentView = async (id: string) => {
    setLoadingDocument(id);
    try {
      // Get presigned URL from backend
      const response = await getDocumentById(id);

      if (response.error) {
        throw new Error("Failed to get document URL");
      }
      const data = response.data?.documents[0];

      if (!data) {
        throw new Error("Document not found");
      }

      // Open document in new tab
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error getting document URL:", error);
      toast.error("Failed to open document");
    } finally {
      setLoadingDocument(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckIcon className="h-5 w-5 text-green-600" />
            Approve Transaction
          </AlertDialogTitle>
          <AlertDialogDescription>
            Review transaction details before approval
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Transaction Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">ID:</span>
                <p className="font-mono">{transaction.id}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">User:</span>
                <p>
                  {transaction.user.profile?.firstName}{" "}
                  {transaction.user.profile?.lastName}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Token Amount:
                </span>
                <p>
                  {transaction.quantity.toString()} {transaction.tokenSymbol}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Total Amount:
                </span>
                <p>
                  {formatAmount(
                    transaction.totalAmount.toString(),
                    transaction.paidCurrency,
                  )}
                </p>
              </div>
              {transaction.amountPaid && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    Amount Paid:
                  </span>
                  <p>
                    {transaction.amountPaid
                      ? formatAmount(
                        transaction.amountPaid,
                        transaction.paidCurrency,
                      )
                      : transaction.status === "REJECTED" ||
                        transaction.status === "CANCELLED"
                        ? "N/A"
                        : "Awaiting payment"}
                  </p>
                </div>
              )}
              <div>
                <span className="font-medium text-muted-foreground">
                  Payment Method:
                </span>
                <p className="capitalize">{transaction.formOfPayment}</p>
              </div>
            </div>
          </div>

          {/* KYC Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                KYC Status
              </h3>
              <Badge
                variant={isKycVerified ? "default" : "secondary"}
                className={
                  isKycVerified
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                }
              >
                {isKycVerified ? "Verified" : kycStatus || "Not Submitted"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {hasKycDocuments && (
                <div className="space-y-2 flex flex-row gap-2">
                  {kycDocuments.map((document) => (
                    <Button
                      key={document.id}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                      onClick={() => handleDocumentView(document.id)}
                      loading={loadingDocument === document.id}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {document.name || "Document"}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            {hasKycDocuments && (
              <div className="text-sm text-muted-foreground">
                {kycDocuments.length} document(s) uploaded
              </div>
            )}
          </div>

          {/* SAFT Status */}
          {requiresSaft ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  SAFT Status
                </h3>
                <Badge
                  variant={hasSaftContract ? "default" : "secondary"}
                  className={
                    hasSaftContract
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  }
                >
                  {hasSaftContract ? "Available" : "Not Available"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {hasSaftContract && (
                  <span className="text-sm text-muted-foreground">
                    Contract ID: Available
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  SAFT Not required for this sale
                </h3>
              </div>
            </div>
          )}

          {/* Warning if KYC not verified */}
          {requiresKyc && !isKycVerified && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  KYC Not Verified
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                User's KYC status is not verified. Please review KYC documents
                before approval.
              </p>
            </div>
          )}
        </div>

        <div className="mt-2 space-y-2">
          <h3 className="text-sm font-medium">
            Approving this transaction will:
          </h3>
          <ul className="list-disc pl-6 text-sm text-secondary space-y-1">
            <li>
              Change the transaction status to &quot;PAYMENT VERIFIED&quot;
            </li>
            {requiresKyc && (
              <li>Change the user&apos;s KYC status to &quot;VERIFIED&quot;</li>
            )}
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleApprove}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Approving..." : "Approve Transaction"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
