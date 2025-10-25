"use client";

import { Badge } from "@mjs/ui/primitives/badge";
import { Button } from "@mjs/ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@mjs/ui/primitives/dropdown-menu";
import { toast } from "@mjs/ui/primitives/sonner";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@mjs/ui/primitives/tooltip";
import { formatDate } from "@mjs/utils/client";
import {
  Copy,
  Eye,
  MoreHorizontal, UserCheck,
  UserX
} from "lucide-react";
import { DateTime } from "luxon";
import { useLocale } from "next-intl";
import React from "react";
import { KycStatusType } from "@/common/schemas/generated";
import AppLink from "../link";

type UserWithTransactions = {
  id: string;
  walletAddress: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  profile: {
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: Date | null;
    address: {
      street: string | null;
      city: string | null;
      zipCode: string | null;
      state: string | null;
      country: string | null;
    } | null;
  } | null;
  kycVerification: {
    status: KycStatusType;
    verifiedAt: Date | null;
    rejectionReason: string | null;
    tier: string | null;
    documents?: {
      id: string;
      url: string;
      fileName: string;
      name: string;
    }[];
  } | null;
  transactionCounts: Record<string, number>;
  _count: {
    transactions: number;
  };
};

interface UsersColumnsProps {
  onViewDetails: (user: UserWithTransactions) => void;
  onKycAction: (userId: string, action: "approve" | "reject") => void;
}

export const getUsersColumns = ({
  onViewDetails,
  onKycAction,
}: UsersColumnsProps) => {
  const locale = useLocale();

  return [
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }: { row: { original: UserWithTransactions; getValue: (key: string) => unknown } }) => {
        const user = row.original;

        return (
          <div className="space-y-1">
            <div className="font-medium">{user.name}</div>
            <div
              className="text-sm text-secondary cursor-pointer hover:text-primary-foreground flex items-center gap-1 transition-colors"
              role="button"
              tabIndex={0}
              onClick={() => handleCopyToClipboard(user.id, "User ID")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCopyToClipboard(user.id, "User ID");
                }
              }}
            >
              ID: {user.id.slice(0, 8)}...
              <Copy className="h-3 w-3 opacity-50" />
            </div>
            <div
              className="text-xs text-secondary-300 cursor-pointer hover:text-primary-foreground flex items-center gap-1 transition-colors"
              role="button"
              tabIndex={0}
              onClick={() =>
                handleCopyToClipboard(user.walletAddress, "Wallet Address")
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCopyToClipboard(user.walletAddress, "Wallet Address");
                }
              }}
            >
              {user.walletAddress.slice(0, 6)}...
              {user.walletAddress.slice(-4)}
              <Copy className="h-3 w-3 opacity-50" />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      size: 200,
      maxSize: 250,
      cell: ({ row }: { row: { original: UserWithTransactions; getValue: (key: string) => unknown } }) => {
        const user = row.original;
        return (
          <div className="space-y-1 max-w-[200px]">
            <div
              className="font-medium truncate cursor-pointer hover:text-primary-foreground transition-colors flex items-center gap-1"
              title={user.email}
              onClick={() => handleCopyToClipboard(user.email, "Email")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCopyToClipboard(user.email, "Email");
                }
              }}
            >
              <span className="truncate">{user.email}</span>
              <Copy className="h-3 w-3 opacity-50 flex-shrink-0" />
            </div>
            <div className="text-sm">
              {user.emailVerified ? (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Unverified
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "profile",
      header: "Profile",
      cell: ({ row }: { row: { original: UserWithTransactions; getValue: (key: string) => unknown } }) => {
        const user = row.original;
        const fullName = user.profile
          ? `${user.profile.firstName || ""} ${user.profile.lastName || ""}`.trim()
          : null;

        return (
          <div className="space-y-1">
            <div className="font-medium">{fullName || "No profile"}</div>
            {user.profile?.dateOfBirth && (
              <div className="text-sm text-secondary">
                DOB:{" "}
                {formatDate(user.profile.dateOfBirth, {
                  locale,
                  format: DateTime.DATE_MED,
                })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "transactions",
      header: "Transactions",
      cell: ({ row }: { row: { original: UserWithTransactions; getValue: (key: string) => unknown } }) => {
        const user = row.original;
        return (
          <div className="flex flex-col gap-1">
            {Object.entries(user.transactionCounts).map(([status, count]) => (
              <Badge
                key={status}
                variant={getTransactionStatusVariant(status)}
                className="text-xs w-fit"
              >
                {count} {status.toLowerCase()}
              </Badge>
            ))}
            {Object.keys(user.transactionCounts).length === 0 && (
              <span className="text-sm text-secondary">No transactions</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "kycStatus",
      header: "KYC Status",
      cell: ({ row }: { row: { original: UserWithTransactions; getValue: (key: string) => unknown } }) => {
        const user = row.original;
        return getKycStatusBadge(
          user.kycVerification?.status as KycStatusType,
          user.kycVerification?.tier,
        ) as React.ReactNode;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }: { row: { original: UserWithTransactions; getValue: (key: string) => unknown } }) => {
        const date = row.getValue("createdAt") as Date;
        return (
          <div className="text-sm">
            {formatDate(date, {
              locale,
              format: DateTime.DATE_MED,
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: UserWithTransactions } }) => (
        <ActionButtons
          user={row.original}
          onViewDetails={onViewDetails}
          onKycAction={onKycAction}
        />
      ),
    },
  ];
};

const ActionButtons = ({
  user,
  onViewDetails,
  onKycAction,
}: {
  user: UserWithTransactions;
  onViewDetails: (user: UserWithTransactions) => void;
  onKycAction: (userId: string, action: "approve" | "reject") => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onViewDetails(user)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <AppLink href={`/admin/transactions?userId=${user.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Transactions
          </AppLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Update KYC Status</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => onKycAction(user.id, "approve")}
                disabled={user.kycVerification?.status === "VERIFIED"}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onKycAction(user.id, "reject")}
                disabled={user.kycVerification?.status === "REJECTED"}
              >
                <UserX className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const handleCopyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  } catch {
    toast.error("Failed to copy to clipboard");
  }
};

function getKycStatusBadge(status?: KycStatusType, tier?: string | null) {
  const statusConfig = {
    NOT_STARTED: { variant: "outline" as const, color: "bg-gray-500" },
    SUBMITTED: { variant: "secondary" as const, color: "bg-blue-500" },
    VERIFIED: { variant: "default" as const, color: "bg-green-500" },
    REJECTED: { variant: "destructive" as const, color: "bg-red-500" },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] ||
    statusConfig.NOT_STARTED;

  const getTierTooltip = (tier?: string | null) => {
    if (!tier) return null;

    const tierInfo = {
      simplified: "Simplified (purchases < $1,000)",
      standard: "Standard (between $1,001 and $10,000)",
      enhanced: "Enhanced (over $10,000)",
    };

    return (
      tierInfo[tier.toLowerCase() as keyof typeof tierInfo] || `Tier: ${tier}`
    );
  };

  const tooltipContent = getTierTooltip(tier);

  const badge = (
    <Badge variant={config.variant} className={`font-medium ${config.color}`}>
      {status || "NOT_STARTED"}
    </Badge>
  );

  if (tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip content={tooltipContent}>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

function getTransactionStatusVariant(status: string) {
  const statusConfig = {
    PENDING: "secondary" as const,
    AWAITING_PAYMENT: "secondary" as const,
    PAYMENT_SUBMITTED: "secondary" as const,
    PAYMENT_VERIFIED: "default" as const,
    COMPLETED: "default" as const,
    TOKENS_DISTRIBUTED: "default" as const,
    REJECTED: "destructive" as const,
    CANCELLED: "outline" as const,
    REFUNDED: "outline" as const,
  };

  return statusConfig[status as keyof typeof statusConfig] || "outline";
}
