"use client";

import { motion } from "@mjs/ui/components/motion";
import { Badge } from "@mjs/ui/primitives/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { Prisma, SaleStatus } from "@prisma/client";

const IcoPhasesPayload = Prisma.validator<Prisma.SaleFindManyArgs>()({
  select: {
    id: true,
    name: true,
    status: true,
    saleStartDate: true,
    saleClosingDate: true,
    tokenPricePerUnit: true,
    initialTokenQuantity: true,
    availableTokenQuantity: true,
    tokenSymbol: true,
  },
});

type IcoPhases = Prisma.SaleGetPayload<typeof IcoPhasesPayload>;

/**
 * Sort sales by priority:
 * 1. Active sales (OPEN status with future end date) - first
 * 2. Other sales ordered by closest start date to now
 */
const sortSalesByPriority = (sales: IcoPhases[]): IcoPhases[] => {
  const now = new Date();

  return [...sales].sort((a, b) => {
    const aEndDate = new Date(a.saleClosingDate);
    const bEndDate = new Date(b.saleClosingDate);
    const aStartDate = new Date(a.saleStartDate);
    const bStartDate = new Date(b.saleStartDate);

    // Check if sales are active (OPEN status with future end date)
    const aIsActive = a.status === SaleStatus.OPEN && aEndDate > now;
    const bIsActive = b.status === SaleStatus.OPEN && bEndDate > now;

    // Active sales come first
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    // If both are active or both are not active, sort by start date (closest to now first)
    const aStartDiff = Math.abs(aStartDate.getTime() - now.getTime());
    const bStartDiff = Math.abs(bStartDate.getTime() - now.getTime());

    return aStartDiff - bStartDiff;
  });
};

export function IcoPhases({ sales }: { sales: IcoPhases[] }) {
  // Sort sales according to the specified logic
  const sortedSales = sortSalesByPriority(sales);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        scale: { type: "spring", visualDuration: 0.6, bounce: 0.2 },
      }}
    >
      <Card className="border-zinc-800 bg-zinc-900/50 !h-full max-h-[565px]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <CardHeader>
            <CardTitle>ICO Phases</CardTitle>
            <CardDescription>Token sale schedule and pricing</CardDescription>
          </CardHeader>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="h-full max-h-[calc(100%-100px)] overflow-y-auto scrollbar-hidden"
        >
          <CardContent>
            <div className="space-y-6">
              <div className="relative space-y-5">
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  className="absolute left-3 top-0 h-full w-px bg-zinc-800"
                  style={{ transformOrigin: "top" }}
                />

                {sortedSales.map((sale, index) => {
                  const isEndDateInPast = new Date(sale.saleClosingDate) < new Date();
                  const effectiveStatus = isEndDateInPast ? SaleStatus.FINISHED : sale.status;
                  const statusBadge = getStatusBadge(effectiveStatus);
                  const dateRange = formatDateRange(
                    sale.saleStartDate,
                    sale.saleClosingDate,
                  );
                  const raised = calculateRaised(
                    sale.initialTokenQuantity.toString(),
                    sale.availableTokenQuantity?.toString() || "0",
                    sale.tokenPricePerUnit.toString(),
                  );
                  const target =
                    parseFloat(sale.initialTokenQuantity.toString()) *
                    parseFloat(sale.tokenPricePerUnit.toString());

                  return (
                    <motion.div
                      key={sale.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.8 + index * 0.1,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                      className="relative pl-8"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 1.0 + index * 0.1,
                          duration: 0.6,
                          ease: "easeOut",
                        }}
                        className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border ${effectiveStatus === SaleStatus.OPEN
                          ? "border-purple-500 bg-purple-900/50"
                          : effectiveStatus === SaleStatus.FINISHED
                            ? "border-purple-500 bg-zinc-900"
                            : "border-zinc-700 bg-zinc-900"
                          }`}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 1.2 + index * 0.1,
                            duration: 0.4,
                            ease: "easeOut",
                          }}
                          className={`h-2 w-2 rounded-full ${effectiveStatus === SaleStatus.OPEN
                            ? "bg-purple-500"
                            : effectiveStatus === SaleStatus.FINISHED
                              ? "bg-purple-500"
                              : "bg-zinc-700"
                            }`}
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 1.4 + index * 0.1,
                          duration: 0.4,
                          ease: "easeOut",
                        }}
                        className="space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-medium ${effectiveStatus === SaleStatus.CREATED
                              ? "text-zinc-500"
                              : ""
                              }`}
                          >
                            {sale.name}
                          </h3>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              delay: 1.6 + index * 0.1,
                              duration: 0.3,
                              ease: "easeOut",
                            }}
                          >
                            <Badge
                              variant={statusBadge.variant}
                              className={statusBadge.className}
                            >
                              {statusBadge.text}
                            </Badge>
                          </motion.div>
                        </div>
                        <p
                          className={`text-sm ${effectiveStatus === SaleStatus.CREATED
                            ? "text-zinc-600"
                            : "text-zinc-400"
                            }`}
                        >
                          {dateRange}
                        </p>
                        <div
                          className={`text-sm ${effectiveStatus === SaleStatus.CREATED
                            ? "text-zinc-500"
                            : ""
                            }`}
                        >
                          <span className="font-medium">Price:</span> $
                          {parseFloat(
                            sale.tokenPricePerUnit.toString(),
                          ).toFixed(3)}{" "}
                          |{" "}
                          {effectiveStatus === SaleStatus.FINISHED ? (
                            <>
                              <span className="font-medium">Raised:</span> $
                              {raised.toLocaleString()}
                            </>
                          ) : (
                            <>
                              <span className="font-medium">Target:</span> $
                              {target.toLocaleString()}
                            </>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
}

/**
 * Get status badge variant and text
 */
const getStatusBadge = (status: SaleStatus) => {
  switch (status) {
    case SaleStatus.FINISHED:
      return {
        variant: "outline" as const,
        className: "border-green-500 text-green-500",
        text: "Completed",
      };
    case SaleStatus.OPEN:
      return {
        className: "bg-purple-500 text-white",
        text: "Active",
      };
    case SaleStatus.CREATED:
      return {
        variant: "outline" as const,
        className: "border-zinc-700 text-zinc-500",
        text: "Upcoming",
      };
    default:
      return {
        variant: "outline" as const,
        className: "border-zinc-700 text-zinc-500",
        text: "Unknown",
      };
  }
};

/**
 * Format date range
 */
const formatDateRange = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const end = new Date(endDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${start} - ${end}`;
};

/**
 * Calculate raised amount
 */
const calculateRaised = (initial: string, available: string, price: string) => {
  const initialTokens = parseFloat(initial);
  const availableTokens = parseFloat(available);
  const tokenPrice = parseFloat(price);
  const soldTokens = initialTokens - availableTokens;
  return soldTokens * tokenPrice;
};
