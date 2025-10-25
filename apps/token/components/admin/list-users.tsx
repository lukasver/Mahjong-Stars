"use client";

import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import { motion } from "@mjs/ui/components/motion";
import { cn } from "@mjs/ui/lib/utils";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mjs/ui/primitives/dialog";
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
import { Input } from "@mjs/ui/primitives/input";
import { Label } from "@mjs/ui/primitives/label";
import { toast } from "@mjs/ui/primitives/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mjs/ui/primitives/table";
import { Textarea } from "@mjs/ui/primitives/textarea";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@mjs/ui/primitives/tooltip";
import { formatDate } from "@mjs/utils/client";
import {
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Search,
  User,
  UserCheck,
  UserX,
} from "lucide-react";
import { DateTime } from "luxon";
import { useLocale } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { ReactNode, useState } from "react";
import { KycStatusSchema, KycStatusType } from "@/common/schemas/generated";
import {
  getDocumentReadPresignedUrl,
  updateUserKycStatus
} from "@/lib/actions/admin";
import { useAllUsers } from "@/lib/services/api";
import { getQueryClient } from "@/lib/services/query";
import AppLink from "../link";
import { SearchSelect } from "../searchBar/search-select";

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

export function ListUsers({
  children,
  className,
  title,
  description,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
}) {
  const { data: usersData } = useAllUsers();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserWithTransactions | null>(
    null,
  );
  const [isKycDialogOpen, setIsKycDialogOpen] = useState(false);
  const [isUserDetailsDialogOpen, setIsUserDetailsDialogOpen] = useState(false);
  const [pendingKycUserId, setPendingKycUserId] = useState<string | null>(null);
  const [kycAction, setKycAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const filteredUsers =
    usersData?.users.filter((user) => {
      // Search term filtering - search across multiple fields
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.walletAddress.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower) ||
        user.profile?.firstName?.toLowerCase().includes(searchLower) ||
        user.profile?.lastName?.toLowerCase().includes(searchLower);

      // Status filtering
      const matchesStatus =
        statusFilter === "all" || user.kycVerification?.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  const handleViewDetails = (user: UserWithTransactions) => {
    setSelectedUser(user);
    setIsUserDetailsDialogOpen(true);
  };

  const handleKycAction = (userId: string, action: "approve" | "reject") => {
    setPendingKycUserId(userId);
    setKycAction(action);
    setIsKycDialogOpen(true);
  };

  const locale = useLocale();

  const { executeAsync, isExecuting } = useAction(updateUserKycStatus);

  const handleUpdateKycStatus = async () => {
    if (!pendingKycUserId || !kycAction || isExecuting) return;

    const status = kycAction === "approve" ? "VERIFIED" : "REJECTED";
    const res = await executeAsync({
      userId: pendingKycUserId,
      status,
      ...(kycAction === "reject" && { rejectionReason }),
    });

    if (res?.data) {
      const queryClient = getQueryClient();
      await queryClient.invalidateQueries({
        queryKey: ["users", "admin"],
      });
      setIsKycDialogOpen(false);
      setPendingKycUserId(null);
      setKycAction(null);
      setRejectionReason("");
      toast.success(`User KYC status changed to ${status}`);
    } else {
      toast.error(
        res?.serverError ||
        res?.validationErrors?._errors?.join(",") ||
        "Unknown error occurred",
      );
    }
  };

  const handleStatusFilterChange = (value: string) => {
    if (value === "clear") {
      setStatusFilter("all");
    } else {
      setStatusFilter(value);
    }
  };

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className={cn("flex-1 space-y-4 md:p-4", className)}>
      {children}

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.1,
          duration: 0.6,
        }}
      >
        <Card
          className={getGlassyCardClassName(
            "shadow max-w-[355px] sm:max-w-none w-full",
          )}
        >
          <CardHeader className="flex flex-col sm:flex-row gap-2 justify-between p-4 md:p-6">
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
              }}
            >
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </motion.div>
            <motion.div
              className="flex items-center justify-between space-x-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.5,
              }}
            >
              <div className="flex items-center flex-col sm:flex-row gap-2 flex-1">
                <motion.div
                  className="relative w-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.4,
                    duration: 0.4,
                  }}
                >
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-secondary" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full md:w-[300px]"
                  />
                </motion.div>
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.5,
                    duration: 0.4,
                  }}
                >
                  <SearchSelect
                    showAll={false}
                    placeholder="Filter by KYC status..."
                    options={[
                      { label: "All Status", value: "all" },
                      { label: "Not Started", value: "NOT_STARTED" },
                      { label: "Submitted", value: "SUBMITTED" },
                      { label: "Verified", value: "VERIFIED" },
                      { label: "Rejected", value: "REJECTED" },
                    ]}
                    onSearch={handleStatusFilterChange}
                    isFilter={true}
                  />
                </motion.div>
              </div>
            </motion.div>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            {/* Filter Summary */}
            {(searchTerm || statusFilter !== "all") && (
              <motion.div
                className="mb-4 flex items-center gap-2 text-sm text-secondary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.6,
                  duration: 0.4,
                }}
              >
                <span>
                  Showing {filteredUsers.length} of{" "}
                  {usersData?.users.length || 0} users
                </span>
                <span>•</span>
                <span>
                  {searchTerm && `Search: "${searchTerm}"`}
                  {searchTerm && statusFilter !== "all" && " • "}
                  {statusFilter !== "all" && `Status: ${statusFilter}`}
                </span>
              </motion.div>
            )}

            {/* Data Table */}
            <motion.div
              className="rounded-b border bg-primary flex justify-center sm:block sm:max-w-none w-full min-h-[30rem] max-h-screen h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.7,
                duration: 0.6,
              }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="text-secondary [&>th]:text-secondary">
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user, index) => {
                    const fullName = user.profile
                      ? `${user.profile.firstName || ""} ${user.profile.lastName || ""}`.trim()
                      : user.name;

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.8 + index * 0.05,
                          duration: 0.4,
                        }}
                        className="border-b"
                      >
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div
                              className="text-sm text-secondary cursor-pointer hover:text-primary-foreground flex items-center gap-1 transition-colors"
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                handleCopyToClipboard(user.id, "User ID")
                              }
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
                              className="text-xs text-muted-foreground cursor-pointer hover:text-primary-foreground flex items-center gap-1 transition-colors"
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                handleCopyToClipboard(
                                  user.walletAddress,
                                  "Wallet Address",
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleCopyToClipboard(
                                    user.walletAddress,
                                    "Wallet Address",
                                  );
                                }
                              }}
                            >
                              {user.walletAddress.slice(0, 6)}...
                              {user.walletAddress.slice(-4)}
                              <Copy className="h-3 w-3 opacity-50" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-sm text-secondary">
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
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {fullName || "No profile"}
                            </div>
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
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {Object.entries(user.transactionCounts).map(
                              ([status, count]) => (
                                <Badge
                                  key={status}
                                  variant={getTransactionStatusVariant(status)}
                                  className="text-xs w-fit"
                                >
                                  {count} {status.toLowerCase()}
                                </Badge>
                              ),
                            )}
                            {Object.keys(user.transactionCounts).length ===
                              0 && (
                                <span className="text-sm text-secondary">
                                  No transactions
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getKycStatusBadge(
                            user.kycVerification?.status,
                            user.kycVerification?.tier,
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(user.createdAt, {
                            locale,
                            format: DateTime.DATE_MED,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(user)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <AppLink
                                  href={`/admin/transactions?userId=${user.id}`}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Transactions
                                </AppLink>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  Update KYC Status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleKycAction(user.id, "approve")
                                      }
                                      disabled={
                                        user.kycVerification?.status ===
                                        "VERIFIED"
                                      }
                                    >
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleKycAction(user.id, "reject")
                                      }
                                      disabled={
                                        user.kycVerification?.status ===
                                        "REJECTED"
                                      }
                                    >
                                      <UserX className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </motion.div>

            {filteredUsers.length === 0 && (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.8,
                  duration: 0.4,
                }}
              >
                <p className="text-secondary">
                  No users found matching your criteria.
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* KYC Status Update Dialog */}
      <AlertDialog open={isKycDialogOpen} onOpenChange={setIsKycDialogOpen}>
        <KycStatusDialog
          userId={pendingKycUserId}
          action={kycAction}
          rejectionReason={rejectionReason}
          onRejectionReasonChange={setRejectionReason}
          onConfirm={handleUpdateKycStatus}
          isExecuting={isExecuting}
        />
      </AlertDialog>

      {/* User Details Dialog */}
      <Dialog
        open={isUserDetailsDialogOpen}
        onOpenChange={setIsUserDetailsDialogOpen}
      >
        {selectedUser && (
          <UserDetailsDialog
            user={selectedUser}
            onClose={() => {
              setIsUserDetailsDialogOpen(false);
              setSelectedUser(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

const KycStatusDialog = ({
  userId,
  action,
  rejectionReason,
  onRejectionReasonChange,
  onConfirm,
  isExecuting,
}: {
  userId: string | null;
  action: "approve" | "reject" | null;
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
  onConfirm: () => Promise<void>;
  isExecuting: boolean;
}) => {
  if (!userId || !action) return null;

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {action === "approve" ? "Approve KYC" : "Reject KYC"}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-foreground">
          {action === "approve" ? (
            <div>
              <p>
                Are you sure you want to approve this user's KYC verification?
              </p>
              <p className="text-sm text-secondary mt-2">
                This will mark their KYC status as VERIFIED and allow them to
                proceed with transactions.
              </p>
            </div>
          ) : (
            <div>
              <p>
                Are you sure you want to reject this user's KYC verification?
              </p>
              <p className="text-sm text-secondary mt-2">
                Please provide a reason for rejection. This will be visible to
                the user.
              </p>
            </div>
          )}
        </AlertDialogDescription>
      </AlertDialogHeader>

      {action === "reject" && (
        <div className="space-y-2">
          <Label htmlFor="rejection-reason">Rejection Reason *</Label>
          <Textarea
            id="rejection-reason"
            placeholder="Enter reason for rejection..."
            value={rejectionReason}
            onChange={(e) => onRejectionReasonChange(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isExecuting}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={
            isExecuting || (action === "reject" && !rejectionReason.trim())
          }
          className={
            action === "approve"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }
        >
          {isExecuting
            ? "Processing..."
            : action === "approve"
              ? "Approve"
              : "Reject"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

const UserDetailsDialog = ({
  user,
  onClose,
}: {
  user: UserWithTransactions;
  onClose: () => void;
}) => {
  const locale = useLocale();
  const fullName =
    user.profile?.firstName && user.profile?.lastName
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : null;

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const { execute: executeGetPresignedUrl, isExecuting: isGettingUrl } =
    useAction(getDocumentReadPresignedUrl, {
      onSuccess: (data) => {
        if (data?.data?.url) {
          window.open(data.data.url, "_blank", "noopener,noreferrer");
        }
      },
      onError: (error) => {
        toast.error(
          "Failed to open document: " +
          (error.error.serverError || "Unknown error"),
        );
      },
    });

  const handleDocumentClick = (documentId: string, _fileName: string) => {
    executeGetPresignedUrl({ documentId });
  };

  return (
    <DialogContent className="sm:max-w-[min(1024px,90vw)] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Details
        </DialogTitle>
        <DialogDescription>
          Complete profile information and KYC status for{" "}
          {fullName || user.email}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  User ID
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm">{user.id}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(user.id, "User ID")}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Email
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">{user.email}</span>
                  <Badge variant={user.emailVerified ? "default" : "secondary"}>
                    {user.emailVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Wallet Address
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm">
                    {user.walletAddress}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopyToClipboard(
                        user.walletAddress,
                        "Wallet Address",
                      )
                    }
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Registration Date
                </Label>
                <div className="mt-1">
                  <span className="text-sm">
                    {formatDate(user.createdAt, {
                      locale,
                      format: DateTime.DATETIME_MED,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.profile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </Label>
                  <div className="mt-1">
                    <span className="text-sm">
                      {fullName || "Not provided"}
                    </span>
                  </div>
                </div>

                {user.profile.dateOfBirth && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Date of Birth
                    </Label>
                    <div className="mt-1">
                      <span className="text-sm">
                        {formatDate(user.profile.dateOfBirth, {
                          locale,
                          format: DateTime.DATE_MED,
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {user.profile.address && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Address
                    </Label>
                    <div className="mt-1 text-sm">
                      {[
                        user.profile.address.street,
                        user.profile.address.city,
                        user.profile.address.state,
                        user.profile.address.zipCode,
                        user.profile.address.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Not provided"}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="text-muted-foreground">
                  No profile information available
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KYC Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Status
                </Label>
                <div className="mt-1">
                  {getKycStatusBadge(
                    user.kycVerification?.status ||
                    KycStatusSchema.enum.NOT_STARTED,
                    user.kycVerification?.tier,
                  )}
                </div>
              </div>

              {user.kycVerification?.tier && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Tier
                  </Label>
                  <div className="mt-1">
                    <Badge variant="outline">{user.kycVerification.tier}</Badge>
                  </div>
                </div>
              )}

              {user.kycVerification?.verifiedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Verified At
                  </Label>
                  <div className="mt-1">
                    <span className="text-sm">
                      {formatDate(user.kycVerification.verifiedAt, {
                        locale,
                        format: DateTime.DATETIME_MED,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {user.kycVerification?.rejectionReason && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Rejection Reason
                </Label>
                <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <span className="text-sm text-destructive">
                    {user.kycVerification.rejectionReason}
                  </span>
                </div>
              </div>
            )}

            {/* KYC Documents */}
            {user.kycVerification?.documents &&
              user.kycVerification.documents.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Documents
                  </Label>
                  <div className="mt-2 space-y-2">
                    {user.kycVerification.documents.map((doc, index) => (
                      <div
                        key={doc.id}
                        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${isGettingUrl ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        onClick={() =>
                          !isGettingUrl &&
                          handleDocumentClick(doc.id, doc.fileName)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">
                              {doc.name || doc.fileName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Click to open
                            </div>
                          </div>
                        </div>
                        {isGettingUrl ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" /> : <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Transaction Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(user.transactionCounts).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {status.toLowerCase().replace(/_/g, " ")}
                  </div>
                </div>
              ))}
              {Object.keys(user.transactionCounts).length === 0 && (
                <div className="col-span-full text-center py-4">
                  <span className="text-muted-foreground">
                    No transactions found
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  );
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
