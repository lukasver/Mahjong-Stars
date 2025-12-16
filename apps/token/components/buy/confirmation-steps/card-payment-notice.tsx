"use client";

import { motion } from "@mjs/ui/components/motion";
import { Button } from "@mjs/ui/primitives/button";
import { Card } from "@mjs/ui/primitives/card";
import { toast } from "@mjs/ui/primitives/sonner";
import { FOP, TransactionStatus } from "@prisma/client";
import { AlertTriangle, Clock } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { updateTransactionToAwaitingPayment } from "@/lib/actions";
import { ReservedTransactionError } from "./reserved-transaction-error";

interface CardPaymentNoticeProps {
  transaction: TransactionByIdWithRelations;
  onSelectDifferent?: () => void;
}

/**
 * Component that displays a service unavailable notice when card payment provider is unavailable
 * Shows UI with buttons to reserve the purchase or select a different payment method
 */
export function CardPaymentNotice({
  transaction: tx,
  onSelectDifferent,
}: CardPaymentNoticeProps) {
  const [updateError, setUpdateError] = useState<{
    code: string;
    existingTransactionId: string;
  } | null>(null);
  const [isReserved, setIsReserved] = useState(false);

  const isStillReserved = tx.status === TransactionStatus.AWAITING_PAYMENT &&
    tx.formOfPayment === FOP.CARD;

  const { execute: updateTransaction, isPending: isReserving } = useAction(
    updateTransactionToAwaitingPayment,
    {
      onSuccess: () => {
        setIsReserved(true);
        setUpdateError(null);
        toast.success("Purchase reserved", {
          description:
            "Your purchase has been reserved. You can complete payment once the service is available.",
        });
      },
      onError: ({ error }) => {
        const errorString =
          error?.serverError ||
          error?.validationErrors?._errors?.[0] ||
          "Failed to reserve transaction";
        try {
          const errorData = JSON.parse(errorString) as {
            code?: string;
            existingTransactionId?: string;
            message?: string;
          };
          if (errorData.code === "RESERVED_TRANSACTION_EXISTS") {
            setUpdateError({
              code: errorData.code,
              existingTransactionId: errorData.existingTransactionId || "",
            });
          } else {
            toast.error("Failed to reserve transaction", {
              description: errorData.message || errorString,
            });
          }
        } catch {
          toast.error("Failed to reserve transaction", {
            description: errorString,
          });
        }
      },
    },
  );

  const handleReserve = () => {
    updateTransaction({ id: tx.id });
  };

  // If there's a reserved transaction conflict, show error UI
  if (updateError?.code === "RESERVED_TRANSACTION_EXISTS") {
    return (
      <ReservedTransactionError
        existingTransactionId={updateError.existingTransactionId}
        onDeleted={() => {
          setUpdateError(null);
          updateTransaction({ id: tx.id });
        }}
      />
    );
  }

  // If transaction is already reserved, show success message
  if (isReserved) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-4"
      >
        <Card className="w-full bg-black/60 backdrop-blur-sm border-2 border-green-600/50 rounded-2xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="p-4 bg-green-900/40 border-2 border-green-600/60 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-green-200 font-semibold mb-2 text-lg">
                    Tokens Reserved
                  </h3>
                  <p className="text-green-200/80 text-sm leading-relaxed">
                    Your purchase has been reserved as{" "}
                    <strong className="text-green-300">
                      "Awaiting Payment"
                    </strong>{" "}
                    status. You will receive a notification when card payment
                    becomes available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="space-y-4"
    >
      <Card className="w-full bg-black/60 backdrop-blur-sm border-2 border-[#8B1E1E] rounded-2xl overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Service Unavailable Alert */}
          <div className="mb-6 p-4 bg-red-900/40 border-2 border-red-600/60 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-200 font-semibold mb-2 text-lg">
                  Service Temporarily Unavailable
                </h3>
                <p className="text-red-200/80 text-sm leading-relaxed">
                  The <strong>card payment</strong> service is currently
                  unavailable. You can reserve your purchase and complete
                  payment later, or select a different payment method.
                </p>
              </div>
            </div>
          </div>

          {/* Reservation Panel */}
          <div className="p-6 bg-amber-900/30 border-2 border-amber-600/50 rounded-lg">
            <div className="flex items-start gap-3 mb-5">
              <Clock className="size-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-grow">
                <h3 className="text-amber-200 font-semibold mb-2 text-xl">
                  Reserve Your Purchase
                </h3>
                <p className="text-amber-200/80 text-sm leading-relaxed mb-1">
                  We will reserve your purchase with a{" "}
                  <strong className="text-amber-300">"Pay Soon"</strong> status.
                </p>
                <p className="text-amber-200/70 text-xs leading-relaxed">
                  You’ll receive an email notification as soon as the card
                  payment service is available again. Your booking will be
                  securely held for 24 hours after that moment.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-5 justify-end">
              <Button
                onClick={onSelectDifferent}
                variant="outline"
                disabled={isReserving}
              >
                Select Different Method
              </Button>
              <Button
                onClick={handleReserve}
                disabled={isReserving || isStillReserved}
                loading={isReserving}
              >
                {isStillReserved ? "Already Reserved" : "Confirm Reservation"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
