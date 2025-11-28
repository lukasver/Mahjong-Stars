"use client";

import { motion } from "@mjs/ui/components/motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { Prisma } from "@prisma/client";

const RecentTransactionsPayload =
  Prisma.validator<Prisma.SaleTransactionsDefaultArgs>()({
    select: {
      id: true,
      quantity: true,
      totalAmount: true,
      amountPaidCurrency: true,
      user: {
        select: {
          walletAddress: true,
        },
      },
      createdAt: true,
      sale: {
        select: {
          tokenSymbol: true,
        },
      },
    },
  });

type RecentTransactions = Prisma.SaleTransactionsGetPayload<
  typeof RecentTransactionsPayload
>;

export function RecentTransactions({
  transactions,
}: {
  transactions: RecentTransactions[];
}) {
  return (
    <motion.div
      data-testid="recent-transactions"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        scale: { type: "spring", visualDuration: 0.6, bounce: 0.2 },
      }}
      className="h-full"
    >
      <Card className="border-zinc-800 bg-zinc-900/50 h-full max-h-[565px]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <CardHeader className="">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest token purchases and sales</CardDescription>
          </CardHeader>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="h-full max-h-[calc(100%-100px)] overflow-y-auto scrollbar-hidden"
        >
          <CardContent className="p-0 sm:p-6">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                className="rounded-md border border-zinc-800"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <motion.thead
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    >
                      <tr className="border-b border-zinc-800 bg-zinc-950/50">
                        <th className="px-4 py-3 text-left font-medium">
                          Tokens
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Wallet
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Time
                        </th>
                      </tr>
                    </motion.thead>
                    <motion.tbody
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0, duration: 0.5 }}
                    >
                      {transactions.map((tx, index) => (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 1.2 + index * 0.05,
                            duration: 0.4,
                            ease: "easeOut",
                          }}
                          className="border-b border-zinc-800 last:border-0"
                        >
                          <td className="px-4 py-3 font-medium">
                            {formatAmount(
                              tx.quantity.toString(),
                              tx.sale.tokenSymbol,
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {formatValue(tx.totalAmount.toString())}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {formatWalletAddress(tx.user.walletAddress)}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {formatTimeAgo(tx.createdAt)}
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
}

/**
 * Format wallet address for display
 */
const formatWalletAddress = (address: string) => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format time ago
 */
const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }
  if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }
  return "Just now";
};

/**
 * Format amount with token symbol
 */
const formatAmount = (quantity: string, tokenSymbol: string) => {
  const amount = parseFloat(quantity);
  return `${amount.toLocaleString()} ${tokenSymbol}`;
};

/**
 * Format value in currency
 */
const formatValue = (totalAmount: string) => {
  const amount = parseFloat(totalAmount);
  return `$${amount.toLocaleString()}`;
};
