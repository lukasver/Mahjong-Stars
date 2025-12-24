import { z } from 'zod';

/**
 * Zod schema for Instaxchange webhook payload validation
 * Based on: https://instaxchange.com/iframe-session.html
 */
export const InstaxchangeWebhookPayload = z.object({
  webhookId: z.string(),
  transactionId: z.string(),
  reference: z.string().nullable(),
  data: z.object({
    amountInFiat: z.number(),
    fiatCurrency: z.string(),
    amountInCrypto: z.number(),
    cryptoCurrency: z.string(),
    status: z.string(),
    statusReason: z.string().nullable(),
    walletAddress: z.string(),
    additionalData: z.record(z.string(), z.unknown()).nullable(),
    sessionId: z.string(),
    createdAt: z.string(),
  }),
  invoiceData: z.object({
    Email: z.string().nullable(),
    Name: z.string().nullable(),
    Credit_card_number: z.string().nullable(),
    Invoice_ID: z.string(),
    Status: z.string(),
    Wallet_address: z.string(),
    Details: z.string(),
    Invoice_date: z.string(),
    Deposit_tx_ID: z.string().nullable(),
    Deposit_tx_amount: z.string().nullable(),
    Deposit_tx_status: z.string().nullable(),
    Withdraw_tx_ID: z.string().nullable(),
    Withdraw_tx_amount: z.string().nullable(),
    Withdraw_tx_status: z.string().nullable(),
  }),
  createdAt: z.string(),
});

export type InstaxchangeWebhookPayload = z.infer<
  typeof InstaxchangeWebhookPayload
>;
