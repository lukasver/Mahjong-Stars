"use client";

import { cn } from "@mjs/ui/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
} from "@mjs/ui/primitives/alert-dialog";
import { Badge } from "@mjs/ui/primitives/badge";
import { Button } from "@mjs/ui/primitives/button";
import { type ColumnDef } from "@mjs/ui/primitives/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@mjs/ui/primitives/dropdown-menu";
import { toast } from "@mjs/ui/primitives/sonner";
import {
  copyToClipboard,
  formatDate,
  safeFormatCurrency,
} from "@mjs/utils/client";
import { FOP, TransactionStatus } from "@prisma/client";
import { Decimal } from "decimal.js";
import {
  CheckIcon,
  ExternalLink,
  Eye,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { DateTime } from "luxon";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Suspense, useState } from "react";
import { shortenAddress } from "thirdweb/utils";
import { FIAT_CURRENCIES } from "@/common/config/constants";
import {
  AdminTransactionsWithRelations,
  TransactionWithRelations,
} from "@/common/types/transactions";
import { getSignedAgreement } from "@/lib/services/fetchers";
import MahjongStarsIconXl from "@/public/static/images/logos/isologo.webp";
import { ApproveTransactionDialog } from "./approve-transaction-dialog";
import { RejectTransactionDialog } from "./reject-transaction-dialog";
import { TransactionDetailsModal } from "./transaction-details-modal";

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

export const getColumns = (isAdmin = false) => {
  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      enableHiding: true,
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return (
          <span className="font-mono text-xs text-secondary">
            {id.slice(-8)}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        let date = DateTime.fromISO(row.getValue("createdAt"));
        if (!date.isValid) {
          date = DateTime.fromJSDate(new Date(row.getValue("createdAt")));
        }

        return (
          <div>
            <div className="text-sm">{formatDate(date)}</div>
            <div className="text-xs text-secondary">
              {date.toLocaleString({
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </div>
          </div>
        );
      },
    },
    isAdmin ? {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const user =
          "user" in row.original
            ? row.original.user.profile?.firstName
            : undefined;
        const wallet = row.original.receivingWallet;

        return (
          <div className="flex items-start gap-1 flex-col">
            <span className="text-sm font-medium">{user || "N/A"}</span>
            {wallet && (
              <span className="text-xs text-secondary">
                {shortenAddress(wallet)}
              </span>
            )}
          </div>
        );
      },
    } : { accessorKey: "PLACEHOLDER" },
    {
      accessorKey: "sale",
      header: "Sale",
      cell: ({ row }) => {
        const sale = row.getValue("sale") as TransactionWithRelations["sale"];

        return <span className="text-sm font-medium">{sale.name}</span>;
      },
    },
    {
      accessorKey: "quantity",
      header: "Purchased",
      cell: ({ row }) => {
        const value = row.getValue("quantity") as string | number;
        if (!value) return null;
        return (
          <div>
            <span>
              {new Intl.NumberFormat().format(new Decimal(value).toNumber())}{" "}
              {row.original.tokenSymbol}
            </span>
          </div>
        );
      },
    },
    // {
    //   accessorKey: 'totalAmount',
    //   header: 'Total',
    //   cell: ({ row }) => {
    //     const value = row.getValue('totalAmount') as string | number;
    //     const currency = row.original.paidCurrency as string;
    //     if (!value) return null;

    //     const amount = new Decimal(value).toNumber();
    //     return (
    //       <span>
    //         {new Intl.NumberFormat('en-US', {
    //           style: 'decimal',
    //           minimumFractionDigits: 2,
    //           maximumFractionDigits: 6,
    //         }).format(amount)}{' '}
    //         {tokenSymbol}
    //       </span>
    //     );
    //   },
    // },
    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ row }) => {
        const totalAmount = row.original.totalAmount?.toString();
        const amountCurrency = row.original.totalAmountCurrency;
        const paidCurrency = row.original.paidCurrency;
        const paidAmount = row.original.amountPaid;
        const isDifferentPaidCurrency = paidAmount && amountCurrency !== paidCurrency;
        const locale = useLocale();

        if (Number.isNaN(Number(totalAmount))) return "TBD";

        return (
          <span>
            {safeFormatCurrency(
              {
                totalAmount: isDifferentPaidCurrency ? paidAmount : totalAmount,
                currency: isDifferentPaidCurrency ? paidCurrency : amountCurrency,
              },
              {
                locale,
                precision: FIAT_CURRENCIES.includes(paidCurrency)
                  ? "FIAT"
                  : "CRYPTO",
              },
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as TransactionStatus;
        return (
          <Badge className={statusColors[status]}>
            {formatChipMessage(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "formOfPayment",
      header: "Payment",
      cell: ({ row }) => {
        const fop = row.getValue("formOfPayment") as FOP;
        const txHash = row.original.txHash;

        return (
          <div
            role={txHash ? "button" : undefined}
            onClick={() => txHash && copyToClipboard(txHash)}
            className={cn(txHash && "cursor-pointer")}
          >
            <div className="text-sm">{fopLabels[fop]}</div>
            {txHash && (
              <div className="text-xs text-secondary font-mono">
                {txHash.slice(0, 10)}...
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => <ActionButtons row={row.original} isAdmin={isAdmin} />,
    },
  ] satisfies ColumnDef<
    TransactionWithRelations | AdminTransactionsWithRelations
  >[];

  return columns.filter((column) => column.accessorKey !== "PLACEHOLDER");
};

const ActionButtons = ({
  row,
  isAdmin,
}: {
  row: TransactionWithRelations | AdminTransactionsWithRelations;
  isAdmin?: boolean;
}) => {
  const status = row.status;
  const [showDetails, setShowDetails] = useState(false);
  const [_isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState<
    "approve" | "reject" | undefined
  >(undefined);

  const handleViewSaft = async (id: string, agreementId: string) => {
    console.log(id, agreementId);
    try {
      setIsLoading(true);
      const response = await getSignedAgreement(agreementId);
      if (response.error) {
        toast.error("Failed to load agreement");
        return;
      }
      // Handle successful response
      console.log(response.data);
      if (response.data?.agreement.downloadUrl) {
        window.open(response.data?.agreement.downloadUrl, "_blank");
      } else {
        toast.error("No download URL found");
      }
    } catch {
      toast.error("An error occurred while loading the agreement");
    } finally {
      setIsLoading(false);
    }
  };

  const Content = ({ isAdmin }: { isAdmin: boolean }) => {
    if (isAdmin) {
      return (
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setShowDetails(true)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          {row.agreementId && (
            <DropdownMenuItem
              onClick={() => handleViewSaft(row.id, row.agreementId!)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Saft
            </DropdownMenuItem>
          )}
          {status === TransactionStatus.PAYMENT_SUBMITTED && (
            <DropdownMenuItem onClick={() => setOpenDialog("approve")}>
              <CheckIcon className="h-4 w-4 mr-2 text-secondary" />
              Approve
            </DropdownMenuItem>
          )}
          {[
            TransactionStatus.PAYMENT_SUBMITTED,
            TransactionStatus.PENDING,
            TransactionStatus.AWAITING_PAYMENT,
          ].includes(status) && (
              <DropdownMenuItem onClick={() => setOpenDialog("reject")}>
                <XCircle className="h-4 w-4 mr-2 text-destructive" />
                Reject
              </DropdownMenuItem>
            )}

          {"explorerUrl" in row && row.explorerUrl && (
            <DropdownMenuItem asChild>
              <a
                href={row.explorerUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </a>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      );
    }
    return (
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setShowDetails(true)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        {status === TransactionStatus.PENDING && (
          <Link href={`/dashboard/buy/${row.id}`}>
            <DropdownMenuItem>
              <CheckIcon className="h-4 w-4 mr-2 text-secondary" />
              Continue
            </DropdownMenuItem>
          </Link>
        )}
        {(status === TransactionStatus.AWAITING_PAYMENT ||
          status === TransactionStatus.PENDING) && (
            <DropdownMenuItem>
              <XCircle className="h-4 w-4 mr-2 text-destructive" />
              Cancel
            </DropdownMenuItem>
          )}
        {status === TransactionStatus.AWAITING_PAYMENT && (
          <DropdownMenuItem>
            <Eye className="h-4 w-4 mr-2" />
            Confirm payment
          </DropdownMenuItem>
        )}

        {"explorerUrl" in row && row.explorerUrl && (
          <DropdownMenuItem asChild>
            <a
              href={row.explorerUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </a>
          </DropdownMenuItem>
        )}
        {/* <DropdownMenuSeparator />
      <DropdownMenuItem>
        <Download className='h-4 w-4 mr-2' />
        Export Transaction
      </DropdownMenuItem> */}
      </DropdownMenuContent>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <Content isAdmin={!!isAdmin} />
      </DropdownMenu>
      <Suspense
        key={row.id}
        fallback={
          <AlertDialog open={true}>
            <AlertDialogContent>
              <div className="flex items-center gap-2">
                <span className="aspect-square animate-pulse">
                  <Image
                    height={80}
                    width={80}
                    src={MahjongStarsIconXl}
                    alt="The Tiles Company Logo"
                    className="animate-spin aspect-square"
                  />
                </span>
                <span className="text-xl font-bold font-head">Loading...</span>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        }
      >
        <TransactionDetailsModal
          open={showDetails}
          onOpenChange={setShowDetails}
          id={row.id}
        />
      </Suspense>

      {/* Admin Dialogs */}
      {isAdmin && "user" in row && (
        <>
          <ApproveTransactionDialog
            open={openDialog === "approve"}
            onOpenChange={() => setOpenDialog(undefined)}
            transaction={row as AdminTransactionsWithRelations}
          />
          <RejectTransactionDialog
            open={openDialog === "reject"}
            onOpenChange={() => setOpenDialog(undefined)}
            transaction={row as AdminTransactionsWithRelations}
          />
        </>
      )}
    </div>
  );
};
