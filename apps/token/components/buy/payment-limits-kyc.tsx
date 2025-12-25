"use client";

import { Alert, AlertDescription } from "@mjs/ui/primitives/alert";
import { Button } from "@mjs/ui/primitives/button";
import { FOP } from "@prisma/client";
import { AlertCircle } from "lucide-react";
import { PaymentLimitsDialog } from "./payment-limits-kyc-dialog";

interface PaymentDisclaimerProps {
  method?: FOP | "all";
  customMessage?: string;
  showDialog?: boolean;
}

export function PaymentDisclaimer({
  method,
  customMessage,
  showDialog = true,
}: PaymentDisclaimerProps) {
  const defaultMessage =
    "Transaction limits and KYC requirements apply based on your payment method and amount.";

  return (
    <Alert className="mb-4 relative">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div>
          <span className="text-sm">{customMessage || defaultMessage}</span>
          {showDialog && (
            <PaymentLimitsDialog
              method={method}
              trigger={
                <Button variant="link" size="sm" className="text-secondary-300 underlined !p-0 absolute -bottom-2 right-0">
                  View more
                </Button>
              }
            />
          )}

        </div>
      </AlertDescription>
    </Alert>
  );
}
