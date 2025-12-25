import { FOP, Prisma } from "@prisma/client";
import { InstaxchangeWebhookResponse } from "@/lib/services/instaxchange/types";

export type ConfirmTransactionDto = {
  id: string;
  type: "CRYPTO" | "FIAT";
  payload?: {
    formOfPayment?: FOP;
    confirmationId?: string;
    receivingWallet?: string;
    comment?: string;
    txHash?: string;
    chainId?: number;
    amountPaid?: string;
    paymentDate?: Date;
    paymentEvidenceId?: string;
    paidCurrency?: string;
    metadata?: Record<string, unknown>;
  };
};

export type RejectTransactionDto = {
  id: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  status?: "REJECTED" | "CANCELLED";
};

export type GetTransactionStatusDto = {
  id: string;
};

export type GetTransactionStatusRes = Prisma.SaleTransactionsGetPayload<{
  select: {
    id: true;
    status: true;
    formOfPayment: true;
  };
}> & {
  providerStatus: InstaxchangeWebhookResponse["data"]["status"] | null;
};
