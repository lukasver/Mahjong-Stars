"use client";

import { JsonViewer } from "@mjs/ui/components/json-viewer";
import { Badge } from "@mjs/ui/primitives/badge";
import { Button } from "@mjs/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mjs/ui/primitives/dialog";
import { Separator } from "@mjs/ui/primitives/separator";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { toast } from "@mjs/ui/primitives/sonner";
import {
  copyToClipboard,
  formatDate,
  safeFormatCurrency,
} from "@mjs/utils/client";
import { FOP, Prisma, TransactionStatus } from "@prisma/client";
import Decimal from "decimal.js";
import { Copy, ExternalLink } from "lucide-react";
import { DateTime } from "luxon";
import { Route } from "next";
import { useLocale } from "next-intl";
import type React from "react";
import { FIAT_CURRENCIES } from "@/common/config/constants";
import { useTransactionById, useUser } from "@/lib/services/api";
import AppLink from "../link";

interface TransactionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  isAdmin?: boolean;
}

const statusColors: Record<TransactionStatus, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  AWAITING_PAYMENT:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PAYMENT_SUBMITTED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  PAYMENT_VERIFIED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",

  TOKENS_DISTRIBUTED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REFUNDED:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const fopLabels: Record<FOP, string> = {
  CRYPTO: "Crypto",
  TRANSFER: "Bank Transfer",
  CARD: "Credit Card",
};

const formatChipMessage = (status: TransactionStatus) => {
  switch (status) {
    case TransactionStatus.COMPLETED:
      return "Completed";
    case TransactionStatus.CANCELLED:
      return "Cancelled";
    case TransactionStatus.PAYMENT_VERIFIED:
      return "Payment Verified";
    case TransactionStatus.TOKENS_DISTRIBUTED:
      return "Tokens Distributed";
    case TransactionStatus.PENDING:
      return "Pending";
    case TransactionStatus.AWAITING_PAYMENT:
      return "Awaiting Payment";
    case TransactionStatus.PAYMENT_SUBMITTED:
      return "Payment Submitted";

    case TransactionStatus.REJECTED:
      return "Rejected";
    case TransactionStatus.REFUNDED:
      return "Refunded";
    default:
      return status;
  }
};

function getStatusBadge(status: TransactionStatus) {
  return (
    <Badge className={statusColors[status]}>{formatChipMessage(status)}</Badge>
  );
}

function formatNumber(
  num?: number | string | null | Decimal,
  locale: string = "en-US",
) {
  if (!num) return "N/A";
  const decimal = new Prisma.Decimal(num);
  const asNum = decimal.toNumber();
  if (isNaN(asNum)) return "N/A";
  return new Intl.NumberFormat(locale).format(asNum);
}

function formatAddress(address: string) {
  if (!address) return "N/A";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function DetailRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
}) {
  return (
    <div className="flex justify-between items-start py-2">
      <span className="text-sm font-medium text-secondary min-w-[140px]">
        {label}:
      </span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className="text-sm text-right">{value}</span>
        {copyable && typeof value === "string" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              if (value) {
                copyToClipboard(value);
                toast.success("Copied to clipboard");
              }
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function TransactionDetailsModal({
  open,
  onOpenChange,
  id,
  isAdmin,
}: TransactionDetailsModalProps) {
  const { data, isLoading, error } = useTransactionById(id);
  const { data: user } = useUser();
  const locale = useLocale();

  if (!id) return null;
  const tx = data?.transaction;


  // If error, Error boundary should handle
  if (error) {
    throw new Error(error);
  }

  // If we are not loading and transaction is null, throw error
  if (!tx && !isLoading) {
    throw new Error("Transaction not found");
  }

  if (!tx) return null;

  const isCryptoPayment = tx.formOfPayment === FOP.CRYPTO;
  const isFiatCurrency = FIAT_CURRENCIES.includes(tx.paidCurrency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {isLoading ? (
                  <Skeleton className="w-40 h-6" />
                ) : (
                  `Transaction ${tx.id.slice(-8)}`
                )}
              </DialogTitle>
              <DialogDescription className="mt-1 text-secondary">
                {isLoading ? (
                  <Skeleton className="w-52 h-4" />
                ) : (
                  "Detailed information about this transaction"
                )}
              </DialogDescription>
            </div>
            {!isLoading && getStatusBadge(tx.status)}
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Financial Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="glassy text-foreground p-4 rounded-lg">
                <div className="text-sm text-secondary">Purchased At</div>
                {tx.amountPaid ? (
                  <div className="text-2xl font-bold">
                    {safeFormatCurrency(
                      {
                        totalAmount: tx.totalAmount.toString(),
                        currency: tx.totalAmountCurrency,
                      },
                      {
                        locale,
                      },
                    )}
                  </div>
                ) : null}
                {tx.totalAmountCurrency !== tx.paidCurrency && (
                  <span className="text-xs text-muted">
                    ~{" "}
                    {safeFormatCurrency(
                      {
                        totalAmount: tx.amountPaid || tx.totalAmount.toString(),
                        currency: tx.paidCurrency,
                      },
                      {
                        locale,
                      },
                    )}
                  </span>
                )}
              </div>
              <div className="glassy text-foreground p-4 rounded-lg">
                <div className="text-sm text-secondary">Tokens Purchased</div>
                <div className="text-2xl font-bold">
                  {formatNumber(new Decimal(tx.quantity).toNumber())}{" "}
                  {tx.tokenSymbol}
                </div>
              </div>
            </div>
          </div>
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="space-y-1">
              <DetailRow label="Transaction ID" value={tx.id} copyable />
              <DetailRow label="Status" value={getStatusBadge(tx.status)} />
              <DetailRow
                label="Form of Payment"
                value={fopLabels[tx.formOfPayment]}
              />
              <DetailRow
                label="Created"
                value={formatDate(tx.createdAt, {
                  locale,
                  format: DateTime.DATETIME_MED,
                })}
              />
              <DetailRow
                label="Updated"
                value={formatDate(tx.updatedAt, {
                  locale,
                  format: DateTime.DATETIME_MED,
                })}
              />
            </div>
          </div>

          <Separator />

          {/* Sale Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Sale Information</h3>
            <div className="space-y-1" data-sale-id={tx.sale.id}>
              <DetailRow label="Sale Name" value={tx.sale.name} />

              <DetailRow label="Token Symbol" value={tx.tokenSymbol} />
            </div>
          </div>

          <Separator />

          {/* Token Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Token Information</h3>
            <div className="space-y-1">
              <DetailRow
                label="Quantity Purchased"
                value={formatNumber(tx.quantity)}
              />
              <DetailRow
                label="Price per Token"
                value={safeFormatCurrency(
                  {
                    currency: tx.totalAmountCurrency,
                    totalAmount: tx.price.toString(),
                  },
                  {
                    precision: isFiatCurrency ? "FIAT" : "CRYPTO",
                    locale,
                  },
                )}
              />
              <DetailRow
                label="Total Amount"
                value={safeFormatCurrency(
                  {
                    currency: tx.totalAmountCurrency,
                    totalAmount: tx.totalAmount.toString(),
                  },
                  {
                    locale,
                    precision: isFiatCurrency ? "FIAT" : "CRYPTO",
                  },
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
            <div className="space-y-1">
              {tx.amountPaid ? (
                <DetailRow
                  label="Amount Paid"
                  value={safeFormatCurrency(
                    {
                      totalAmount: tx.amountPaid,
                      currency: tx.paidCurrency,
                    },
                    {
                      locale,
                      precision: isFiatCurrency ? "FIAT" : undefined,
                    },
                  )}
                />
              ) : (
                <DetailRow label="Amount Paid" value="Awaiting payment" />
              )}
              {isFiatCurrency && (
                <DetailRow label="Currency" value={tx.paidCurrency} />
              )}
              {tx.comment && <DetailRow label="Comment" value={tx.comment} />}
            </div>
          </div>

          <Separator />

          {/* Wallet Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Wallet Information</h3>
            <div className="space-y-1">
              <DetailRow
                label="Receiving Wallet"
                value={
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                      {tx.receivingWallet && formatAddress(tx.receivingWallet)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (tx.receivingWallet) {
                          copyToClipboard(tx.receivingWallet);
                          toast.success("Wallet address copied to clipboard");
                        }
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                }
              />
              {/* Blockchain Information (for crypto payments) */}
              {isCryptoPayment && tx.txHash && (
                <div className="space-y-1">
                  <DetailRow
                    label="Transaction Hash"
                    value={
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {formatAddress(tx.txHash)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            if (tx.txHash) {
                              copyToClipboard(tx.txHash);
                              toast.success(
                                "Transaction hash copied to clipboard",
                              );
                            }
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {data?.explorerUrl && (
                          <a
                            href={data.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        )}
                      </div>
                    }
                  />
                  {tx.blockchain && (
                    <DetailRow label="Network" value={tx?.blockchain?.name} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Token Distribution Information */}
          {tx?.tokenDistributions && tx?.tokenDistributions.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Token Distribution
                </h3>
                <div className="space-y-1">
                  {tx?.tokenDistributions.map((distribution, index) => (
                    <div
                      key={distribution.id}
                      className="border rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          Distribution {index + 1}
                        </span>
                        <Badge
                          variant={
                            distribution.status === "COMPLETED"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {distribution.status}
                        </Badge>
                      </div>
                      {/* <DetailRow
                        label='Quantity'
                        value={formatNumber(distribution.quantity)}
                      />
                      <DetailRow
                        label='Distributed At'
                        value={
                          distribution.distributedAt
                            ? formatDate(distribution.distributedAt, {
                                locale,
                                format: DateTime.DATETIME_MED,
                              })
                            : 'Pending'
                        }
                      /> */}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Approval Information */}
          {tx && "approver" in tx && tx.approver && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Approval Information
                </h3>
                <div className="space-y-1">
                  <DetailRow label="Approved By" value={tx?.approver?.email} />
                  <DetailRow
                    label="Approved At"
                    value={formatDate(tx.updatedAt, {
                      locale,
                      format: DateTime.DATETIME_MED,
                    })}
                  />
                </div>
              </div>
            </>
          )}

          {isAdmin && tx.metadata && (
            <>
              <Separator />
              <div>
                <JsonViewer
                  title="Metadata"
                  defaultExpanded
                  data={tx.metadata} />
              </div>
            </>
          )}
          <Separator />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {user?.id === tx.userId &&
            tx.status === TransactionStatus.PENDING && (
              <AppLink href={`/dashboard/buy/${tx.id}` as Route} prefetch>
                <Button>Continue Transaction</Button>
              </AppLink>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
