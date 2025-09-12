"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mjs/ui/primitives/alert-dialog";
import { toast } from "@mjs/ui/primitives/sonner";
import { useState } from "react";
import { VerifyEmailForm, VerifyTokenForm } from "@/components/verify-email";
import { getQueryClient } from "@/lib/services/query";

/**
 * Dialog component that handles mandatory email verification
 * @returns JSX.Element
 */
export const VerifyMandatoryEmail = ({ email }: { email: string }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(1);
  const handleSuccess = async () => {
    await getQueryClient().invalidateQueries({
      queryKey: ["users", "me"],
    });
    toast.success("Email verified");
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent overlayClassName="bg-black/80">
        <AlertDialogHeader>
          <AlertDialogTitle>Verify Email</AlertDialogTitle>
          <AlertDialogDescription className="text-secondary">
            Please verify your email address to proceed with the transaction.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          {step === 1 && (
            <VerifyEmailForm
              onSuccess={() => setStep(2)}
              canSkip={false}
              defaultEmail={email?.startsWith('temp_') ? '' : email}
            />
          )}
          {step === 2 && (
            <VerifyTokenForm
              key={2}
              token={""}
              noMessage
              onCancel={() => setStep((pv) => (pv - 1) as 1 | 2)}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
