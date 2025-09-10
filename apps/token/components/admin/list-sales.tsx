"use client";

import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import ErrorBoundary from "@mjs/ui/components/error-boundary";
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
import { toast } from "@mjs/ui/primitives/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mjs/ui/primitives/table";
import { formatCurrency, formatDate } from "@mjs/utils/client";
import {
  AlertCircle,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { DateTime } from "luxon";
import { useLocale } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { ReactNode, useState } from "react";
import { SaleStatusType } from "@/common/schemas/generated";
import { SaleWithToken } from "@/common/types/sales";
import { exportTransactions, updateSaleStatus } from "@/lib/actions/admin";
import { useSales } from "@/lib/services/api";
import { getQueryClient } from "@/lib/services/query";
import { useSensitiveAction } from "../hooks/use-sensitive-action";
import AppLink from "../link";
import { SearchSelect } from "../searchBar/search-select";
import { SaleDetailsModal } from "./sale-details-modal";

export function ListSales({
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
  const { data: salesData } = useSales();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState<SaleWithToken | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [pendingOpenSaleId, setPendingOpenSaleId] = useState<string | null>(
    null,
  );

  const filteredSales =
    salesData?.sales.filter((sale) => {
      // Search term filtering - search across multiple fields
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        sale.name.toLowerCase().includes(searchLower) ||
        sale.tokenName.toLowerCase().includes(searchLower) ||
        sale.tokenSymbol.toLowerCase().includes(searchLower) ||
        sale.id.toLowerCase().includes(searchLower) ||
        sale.currency.toLowerCase().includes(searchLower);

      // Status filtering
      const matchesStatus =
        statusFilter === "all" || sale.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  const handleViewDetails = (sale: SaleWithToken) => {
    setSelectedSale(sale);
    setIsDetailsModalOpen(true);
  };

  const locale = useLocale();

  const { executeAsync, isExecuting } = useAction(updateSaleStatus);
  const { executeAsync: executeExportAsync, isExecuting: isExporting } =
    useAction(exportTransactions);

  const handleUpdateStatus = async (saleId: string, status: SaleStatusType) => {
    if (!saleId || isExecuting || !status) return;
    const res = await executeAsync({
      id: saleId,
      status,
    });

    if (res?.data) {
      const queryClient = getQueryClient();
      await queryClient.invalidateQueries({
        queryKey: ["sales"],
      });
      setIsOpenDialogOpen(false);
      setPendingOpenSaleId(null);
      toast.success(`Sale status changed to ${status}`);
    } else {
      toast.error(
        res?.serverError ||
        res?.validationErrors?._errors?.join(",") ||
        "Unknown error ocurred",
      );
    }
  };

  const handleExportTransactions = async (
    format: "csv" | "xlsx",
    saleId?: string,
  ) => {
    if (isExporting) return;

    const res = await executeExportAsync({
      format,
      saleId,
    });

    if (res?.data) {
      const { data, filename, contentType } = res.data;

      // Create blob and download
      const blob = new Blob([data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Transactions exported successfully as ${format.toUpperCase()}`,
      );
    } else {
      toast.error(
        res?.serverError ||
        res?.validationErrors?._errors?.join(",") ||
        "Failed to export transactions",
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
                    placeholder="Search sales..."
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
                    placeholder="Filter by status..."
                    options={[
                      { label: "All Status", value: "all" },
                      { label: "Open", value: "OPEN" },
                      { label: "Created", value: "CREATED" },
                      { label: "Closed", value: "CLOSED" },
                      { label: "Finished", value: "FINISHED" },
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
                  Showing {filteredSales.length} of{" "}
                  {salesData?.sales.length || 0} sales
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
                    <TableHead>Sale Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales?.map((sale, index) => {
                    const progress =
                      ((sale.initialTokenQuantity -
                        sale.availableTokenQuantity) /
                        sale.initialTokenQuantity) *
                      100;

                    return (
                      <motion.tr
                        key={sale.id}
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
                            <div className="font-medium">{sale.name}</div>
                            <div className="text-sm text-secondary">
                              ID: {sale.id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sale.tokenName}</div>
                            <div className="text-sm text-secondary">
                              {sale.tokenSymbol}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(sale.tokenPricePerUnit, {
                            currency: sale.currency,
                            locale,
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatCurrency(sale.availableTokenQuantity, {
                                locale,
                              })}
                            </div>
                            <div className="text-sm text-secondary">
                              of{" "}
                              {formatCurrency(sale.initialTokenQuantity, {
                                locale,
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-secondary min-w-[3rem]">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(sale.saleStartDate, {
                            locale,
                            format: DateTime.DATE_MED,
                          })}
                        </TableCell>
                        <TableCell>
                          {formatDate(sale.saleClosingDate, {
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
                                onClick={() => handleViewDetails(sale)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild>
                                <AppLink
                                  href={`/admin/transactions?saleId=${sale.id}`}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Transactions
                                </AppLink>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <AppLink
                                  href={`/admin/sales/create?saleId=${sale.id}&step=1`}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Sale
                                </AppLink>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  Change Status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem
                                      disabled={sale.status === "OPEN"}
                                      className="bg-green-500"
                                      onClick={() => {
                                        setPendingOpenSaleId(sale.id);
                                        setIsOpenDialogOpen(true);
                                      }}
                                    >
                                      Open
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleUpdateStatus(sale.id, "CLOSED")
                                      }
                                      disabled={["CLOSED", "FINISHED"].includes(
                                        sale.status,
                                      )}
                                    >
                                      Close
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Download className="mr-2 h-4 w-4" />
                                  Export Transactions
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleExportTransactions("csv", sale.id)
                                      }
                                      disabled={isExporting}
                                    >
                                      Export as CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleExportTransactions(
                                          "xlsx",
                                          sale.id,
                                        )
                                      }
                                      disabled={isExporting}
                                    >
                                      Export as Excel
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                              {/* <DropdownMenuSeparator /> */}
                              {/* <DropdownMenuItem className='text-destructive'>
                                <Trash2 className='mr-2 h-4 w-4' />
                                Delete Sale
                              </DropdownMenuItem> */}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </motion.div>

            {filteredSales.length === 0 && (
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
                  No sales found matching your criteria.
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
      {selectedSale && (
        <ErrorBoundary
          fallback={
            <Dialog defaultOpen>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Error loading sale details</DialogTitle>
                </DialogHeader>
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              </DialogContent>
            </Dialog>
          }
        >
          <SaleDetailsModal
            id={selectedSale.id}
            open={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
          />
        </ErrorBoundary>
      )}

      {/* AlertDialog for opening a sale */}
      <AlertDialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
        {pendingOpenSaleId && (
          <SaleStatusDialog
            saleId={pendingOpenSaleId}
            onConfirm={handleUpdateStatus}
          />
        )}
      </AlertDialog>
    </div>
  );
}

const SaleStatusDialog = ({
  saleId,
  onConfirm,
}: {
  saleId: string;
  onConfirm: (saleId: string, status: SaleStatusType) => Promise<void>;
}) => {
  const sensitiveAction = useSensitiveAction({
    action: "open_sale",
    saleId,
    data: { saleId, status: "OPEN" },

    onError: (error) => {
      toast.error(`Authentication failed: ${error}`);
    },
  });
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Open Sale Confirmation</AlertDialogTitle>
        <AlertDialogDescription className="text-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Only <b>one</b> sale can be open at a time. Opening this sale will
              close any currently open sale.
            </li>
            <li>
              Once open, this sale will be available for public investment.
            </li>
          </ul>
          Are you sure you want to open this sale?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() =>
            sensitiveAction.executeAction(async () => onConfirm(saleId, "OPEN"))
          }
          className="bg-accent"
        >
          Yes, Open Sale
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

function getStatusBadge(status: string) {
  const statusConfig = {
    OPEN: { variant: "default" as const, color: "bg-green-500" },
    CREATED: { variant: "secondary" as const, color: "bg-blue-500" },
    CLOSED: { variant: "outline" as const, color: "bg-gray-500" },
    PAUSED: { variant: "destructive" as const, color: "bg-yellow-500" },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.CREATED;

  return (
    <Badge variant={config.variant} className={`font-medium ${config.color}`}>
      {status}
    </Badge>
  );
}
