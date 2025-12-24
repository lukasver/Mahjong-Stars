import { FOP } from '@prisma/client';

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
