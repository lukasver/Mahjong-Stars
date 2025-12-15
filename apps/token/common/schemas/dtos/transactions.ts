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

/**
 * Base schema for payment provider metadata
 * Contains common fields shared across all payment providers
 */
const BasePaymentProviderMetadataSchema = z.object({
  provider: z.string(),
  sessionId: z.string().optional(),
  accountRefId: z.string().optional(),
  kycPerformed: z.boolean().optional(),
  webhookEvents: z
    .array(
      z.object({
        webhookId: z.string().optional(),
        event: z.string().optional(),
        timestamp: z.string().optional(),
        processedAt: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .optional(),
  lastWebhookEvent: z
    .object({
      webhookId: z.string().optional(),
      event: z.string().optional(),
      timestamp: z.string().optional(),
      processedAt: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
  lastUpdated: z.string().optional(),
  createdAt: z.string().optional(),
});

/**
 * Instaxchange-specific payment provider metadata schema
 * Extends base schema with Instaxchange-specific fields
 */
export const InstaxchangePaymentProviderMetadataSchema =
  BasePaymentProviderMetadataSchema.extend({
    provider: z.literal("instaxchange"),
    paymentMethod: z.string().optional(),
    transactionHash: z.string().optional(),
    depositTxId: z.string().nullable().optional(),
    depositTxStatus: z.string().nullable().optional(),
    withdrawTxId: z.string().nullable().optional(),
    withdrawTxStatus: z.string().nullable().optional(),
    invoiceId: z.string().optional(),
    completedAt: z.string().optional(),
    confirmedAt: z.string().optional(),
  });

/**
 * Thirdweb-specific payment provider metadata schema
 * Extends base schema with Thirdweb-specific fields
 * Reserved for future use
 */
export const ThirdwebPaymentProviderMetadataSchema =
  BasePaymentProviderMetadataSchema.extend({
    provider: z.literal("thirdweb"),
    checkoutId: z.string().optional(),
    purchaseData: z.array(z.unknown()).optional(),
    transactions: z.array(z.unknown()).optional(),
  });

/**
 * Discriminated union schema for payment provider metadata
 * Supports multiple payment providers with type-safe discrimination
 */
export const PaymentProviderMetadataSchema = z.discriminatedUnion("provider", [
  InstaxchangePaymentProviderMetadataSchema,
  ThirdwebPaymentProviderMetadataSchema,
]);

export type PaymentProviderMetadata = z.infer<
  typeof PaymentProviderMetadataSchema
>;
export type InstaxchangePaymentProviderMetadata = z.infer<
  typeof InstaxchangePaymentProviderMetadataSchema
>;
export type ThirdwebPaymentProviderMetadata = z.infer<
  typeof ThirdwebPaymentProviderMetadataSchema
>;
