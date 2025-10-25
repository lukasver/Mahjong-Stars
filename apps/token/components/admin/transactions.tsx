"use client";

import { Badge } from "@mjs/ui/primitives/badge";
import { Button } from "@mjs/ui/primitives/button";
import { BanknoteArrowUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminTransactionsWithRelations } from "@/common/types/transactions";
import { useAllTransactions } from "@/lib/services/api";
import { Placeholder } from "../placeholder";
import { PulseLoader } from "../pulse-loader";
import { Transactions } from "../transactions/transactions";

export default function AdminTransactions({
  saleId,
  userId,
}: {
  saleId?: string;
  userId?: string;
}) {
  const { data, isLoading } = useAllTransactions(saleId, userId);
  const router = useRouter();

  const handleClearFilter = () => {
    // Remove userId from URL to show all transactions
    const url = new URL(window.location.href);
    url.searchParams.delete("userId");
    router.push(url.pathname + url.search);
  };

  if (isLoading) {
    return <PulseLoader />;
  }

  if (!data?.transactions) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen md:min-h-[60dvh]">
        <Placeholder
          icon={BanknoteArrowUp}
          title="No transactions found"
          description="There are no transactions in the system"
        />
      </div>
    );
  }

  // Get user info from first transaction if available
  const firstTransaction = data
    ?.transactions?.[0] as AdminTransactionsWithRelations;
  const userInfo = firstTransaction?.user;
  const userName =
    userInfo?.profile?.firstName && userInfo?.profile?.lastName
      ? `${userInfo.profile.firstName} ${userInfo.profile.lastName}`.trim()
      : userInfo?.email || "Unknown User";

  return (
    <div className="space-y-4">
      {/* Filter indicator and clear button */}
      {userId && (
        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-2xl border border-slate-600">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Filtered by User
            </Badge>
            <span className="text-sm text-muted-foreground">
              Showing transactions for:{" "}
              <span className="font-medium">{userName}</span>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilter}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filter
          </Button>
        </div>
      )}

      <Transactions transactions={data?.transactions} isAdmin={true} />
    </div>
  );
}
