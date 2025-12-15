"use client";

import {
  CardContent
} from "@mjs/ui/primitives/card";
import { useParams } from "next/navigation";
import { ONE_MINUTE } from "@/common/config/constants";
import { PulseLoader } from "@/components/pulse-loader";
import {
  useTransactionAvailabilityForSale
} from "@/lib/services/api";


/**
 * Used to check if the payment if the sale is still available for the transaction to render the payment page. If it is, render the children, otherwise renders an error component.
 */
export function PaymentAvailabilityGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tx: txId } = useParams();
  const { data, isLoading } = useTransactionAvailabilityForSale(
    txId as string,
    {
      refetchInterval: ONE_MINUTE,
      enabled: !!txId,
      staleTime: ONE_MINUTE,
    },
  );

  const isAvailable = data?.transaction === true;

  if (isLoading) {
    return (
      <CardContent className="flex justify-center items-center h-full">
        <PulseLoader text="Wait for it..." />
      </CardContent>
    );
  }

  if (!isAvailable) {
    return <div>Transaction not available</div>;
  }

  return children;
}
