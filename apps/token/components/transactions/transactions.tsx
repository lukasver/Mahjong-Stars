"use client";
import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import { EmptyState } from "@mjs/ui/components/empty-states";
import { motion } from "@mjs/ui/components/motion";
import { Button } from "@mjs/ui/primitives/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { DataTable } from "@mjs/ui/primitives/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@mjs/ui/primitives/dropdown-menu";
import { toast } from "@mjs/ui/primitives/sonner";
import { Tooltip } from "@mjs/ui/primitives/tooltip";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import {
  AdminTransactionsWithRelations,
  TransactionWithRelations,
} from "@/common/types/transactions";
import { exportTransactions } from "@/lib/actions/admin";
import { NetworkStatus } from "../network-status";
import { getColumns } from "./columns";
import { TransactionFilters } from "./transaction-filters";

interface TransactionsProps {
  transactions?: TransactionWithRelations[] | AdminTransactionsWithRelations[];
  isAdmin?: boolean;
}

export const Transactions = ({
  transactions,
  isAdmin = false,
}: TransactionsProps) => {
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionWithRelations[] | AdminTransactionsWithRelations[]
  >(transactions || []);
  const {
    executeAsync: executeExportAsync,
    isExecuting: isExporting,
    isPending,
  } = useAction(exportTransactions);

  const params = useSearchParams();
  const saleId = params.get("saleId");

  const handleExportTransactions = async (
    format: "csv" | "xlsx",
    saleId?: string | null,
  ) => {
    if (isExporting) return;

    const res = await executeExportAsync({
      format,
      saleId: saleId || undefined,
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

  // Set initial column visibility to hide the ID column
  const initialColumnVisibility = {
    id: false, // Hide the ID column by default
  };

  return (
    <div className="pt-4 md:pt-0">
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
            "mb-4 border border-gray-300/30 shadow-sm max-w-[calc(100vw-3%)] sm:max-w-none w-full",
          )}
        >
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.2,
                  duration: 0.5,
                }}
              >
                <CardTitle className="text-foreground">Transactions</CardTitle>
                <CardDescription className="wrap-normal">
                  Pending transactions will be automatically cancelled after 6
                  hours.
                </CardDescription>
              </motion.div>
              <motion.div
                className="flex flex-col gap-4 sm:flex-row sm:items-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.3,
                  duration: 0.5,
                }}
              >
                <div className="flex items-center gap-2">
                  <NetworkStatus compact />
                </div>
              </motion.div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <motion.div
        className="max-w-[350px] flex justify-center sm:block sm:max-w-none w-full min-h-[30rem] max-h-screen h-full mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.4,
          duration: 0.6,
        }}
      >
        <DataTable
          columns={getColumns(isAdmin)}
          data={filteredTransactions}
          loading={isPending || isExporting}
          pageSize={10}
          showPagination={true}
          showColumnVisibility={true}
          initialColumnVisibility={initialColumnVisibility}
          emptyState={
            <EmptyState
              icon={'transaction'}
              title="No transactions found"
              description="Your purchases will be listed here"
              action={{
                href: "/dashboard/buy",
                label: "Get started!",
              }}
            />
          }
        >
          <div className="flex items-center gap-2 w-full md:w-auto h-full flex-1 md:mr-2">
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.5,
                duration: 0.5,
              }}
            >
              <TransactionFilters
                transactions={transactions}
                isAdmin={isAdmin}
                onFilteredDataChange={setFilteredTransactions}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.6,
                duration: 0.5,
              }}
              className="self-end md:self-center"
            >
              <DropdownMenu>
                <Tooltip content="Export transactions">
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isExporting}
                      className="shrink-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleExportTransactions("csv", saleId)}
                    disabled={isExporting}
                  >
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportTransactions("xlsx", saleId)}
                    disabled={isExporting}
                  >
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>
        </DataTable>
      </motion.div>
    </div>
  );
};
