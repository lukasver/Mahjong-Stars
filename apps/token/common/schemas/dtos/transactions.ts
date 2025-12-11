import { z } from "zod";
import {
  SaleTransactionsSchema,
  TransactionFeeSchema,
} from "@/common/schemas/generated";

export const CreateTransactionDto = SaleTransactionsSchema.pick({
  tokenSymbol: true,
  quantity: true,
  formOfPayment: true,
  receivingWallet: true,
  saleId: true,
  comment: true,
  totalAmount: true,
  paidCurrency: true,
}).extend({
  fees: z.array(
    TransactionFeeSchema.partial()
      .pick({
        type: true,
        amount: true,
        currencySymbol: true,
        description: true,
        metadata: true,
      })
      .required({
        amount: true,
        currencySymbol: true,
        type: true,
      }),
  ).optional(),
});

export type CreateTransactionDto = z.infer<typeof CreateTransactionDto>;

export const UpdateTransactionDto = SaleTransactionsSchema.partial();
export type UpdateTransactionDto = z.infer<typeof UpdateTransactionDto>;

export const GetTransactionDto = SaleTransactionsSchema.pick({
  userId: true,
  formOfPayment: true,
  tokenSymbol: true,
  saleId: true,
}).partial();
export type GetTransactionDto = z.infer<typeof GetTransactionDto>;
