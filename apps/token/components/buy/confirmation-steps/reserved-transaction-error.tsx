"use client";

import { motion } from "@mjs/ui/components/motion";
import { useActionListener } from "@mjs/ui/hooks/use-action-listener";
import { Alert, AlertDescription, AlertTitle } from "@mjs/ui/primitives/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@mjs/ui/primitives/alert-dialog";
import { Button } from "@mjs/ui/primitives/button";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { deleteOwnTransaction } from "@/lib/actions";
import { getQueryClient } from "@/lib/services/query";

interface ReservedTransactionErrorProps {
  existingTransactionId: string;
  onDeleted?: () => void;
  onViewTransaction?: () => void;
}

/**
 * Component that displays an error when user already has a reserved transaction
 * Provides options to delete the existing transaction or view it
 */
export function ReservedTransactionError({
  existingTransactionId,
  onDeleted,
  onViewTransaction,
}: ReservedTransactionErrorProps) {
  const router = useRouter();
  const { execute, isPending } = useActionListener(
    useAction(deleteOwnTransaction),
    {
      onSuccess: () => {
        getQueryClient().invalidateQueries({
          queryKey: ["transactions"],
        });
        onDeleted?.();
      },
    },
  );

  const handleDelete = () => {
    execute({ id: existingTransactionId });
  };

  const handleViewTransaction = () => {
    if (onViewTransaction) {
      onViewTransaction();
    } else {
      router.push(`/dashboard/buy/${existingTransactionId}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="space-y-4"
    >
      <Alert className="border-red-500/50 bg-red-500/10">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <AlertTitle className="text-red-500 font-semibold">
          Reserved Transaction Conflict
        </AlertTitle>
        <AlertDescription className="text-red-400/90 mt-2">
          You already have a reserved transaction for card payment. Only one
          reserved transaction is allowed at a time. Please resolve the existing
          transaction before creating a new one.
        </AlertDescription>
      </Alert>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-sm text-muted-foreground space-y-2"
      >
        <p>
          Existing Transaction ID:{" "}
          <span className="font-mono text-foreground">
            {existingTransactionId}
          </span>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isPending}
              className="flex-1"
            >
              Delete Reserved Transaction
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reserved Transaction</AlertDialogTitle>
              <AlertDialogDescription className="text-foreground">
                Are you sure you want to delete this reserved transaction? This
                will release the reserved amount and you can create a new
                transaction. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-white"
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="outline"
          onClick={handleViewTransaction}
          disabled={isPending}
          className="flex-1"
        >
          View Reserved Transaction
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="text-xs text-muted-foreground/80 text-center"
      >
        Alternatively, you can choose a different payment method (bank transfer
        or crypto) from the payment options.
      </motion.p>
    </motion.div>
  );
}
