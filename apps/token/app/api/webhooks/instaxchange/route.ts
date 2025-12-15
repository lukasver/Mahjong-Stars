import { FOP, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ActionCtx } from "@/common/schemas/dtos/sales";
import { prisma } from "@/lib/db/prisma";
import transactionsController from "@/lib/repositories/transactions";
import { instaxchangeService } from "@/lib/services/instaxchange";
import logger from "@/lib/services/logger.server";

/**
 * Zod schema for Instaxchange webhook payload validation
 * Based on: https://instaxchange.com/iframe-session.html
 */
const InstaxchangeWebhookPayloadSchema = z.object({
  webhookId: z.string(),
  transactionId: z.string(),
  reference: z.string().nullable(),
  data: z.object({
    amountInFiat: z.number(),
    fiatCurrency: z.string(),
    amountInCrypto: z.number(),
    cryptoCurrency: z.string(),
    status: z.enum(["completed", "failed"]),
    statusReason: z.string().nullable(),
    walletAddress: z.string(),
    additionalData: z.record(z.string(), z.unknown()).nullable(),
    sessionId: z.string(),
    createdAt: z.string(),
  }),
  invoiceData: z.object({
    Email: z.string(),
    Name: z.string(),
    Credit_card_number: z.string(),
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

type InstaxchangeWebhookPayload = z.infer<
  typeof InstaxchangeWebhookPayloadSchema
>;

/**
 * POST handler for Instaxchange webhook events
 * Handles payment status updates and transaction confirmation
 */
export async function POST(req: NextRequest) {
  try {
    if (!instaxchangeService) {
      return NextResponse.json({ error: "Not implemented" }, { status: 501 });
    }
    // Get raw body for signature verification
    // Next.js 13+ requires reading the body as text for webhook signature verification
    const rawBody = await req.text();
    // According to Instaxchange docs, the header is X-InstaXWH-KEY
    const signature = req.headers.get("X-InstaXWH-KEY");

    if (!signature) {
      logger.warn("Instaxchange webhook missing signature header");
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 401 },
      );
    }

    // Verify webhook signature
    // Instaxchange uses MD5 hash with sorted JSON keys (implemented in verifyWebhookSignature)
    const isValidSignature = instaxchangeService.verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (!isValidSignature) {
      logger.warn("Instaxchange webhook signature verification failed", {
        signature: signature.substring(0, 20) + "...",
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse webhook payload
    let payload: InstaxchangeWebhookPayload;
    try {
      const parsed = JSON.parse(rawBody);
      payload = InstaxchangeWebhookPayloadSchema.parse(parsed);
    } catch (error) {
      logger.error("Failed to parse Instaxchange webhook payload", {}, error);
      return NextResponse.json(
        { error: "Invalid JSON or Payload" },
        { status: 400 },
      );
    }

    logger.info("Instaxchange webhook received", {
      webhookId: payload.webhookId,
      transactionId: payload.transactionId,
      sessionId: payload.data.sessionId,
      status: payload.data.status,
    });

    // TODO: check if can be without RAW
    // Find transaction by sessionId stored in metadata
    // Use raw SQL query for efficient JSON path filtering in PostgreSQL
    const transactions = await prisma.$queryRaw<
      Array<{
        id: string;
        userId: string;
        paidCurrency: string;
        totalAmount: Prisma.Decimal;
        metadata: Prisma.JsonValue;
      }>
    >`
      SELECT id, "userId", "paidCurrency", "totalAmount", metadata
      FROM "sale_transactions"
      WHERE metadata->'instaxchange'->>'sessionId' = ${payload.data.sessionId}
      LIMIT 1
    `;

    if (transactions.length === 0) {
      logger.error("Transaction not found for Instaxchange session", {
        sessionId: payload.data.sessionId,
        webhookId: payload.webhookId,
      });
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    const transactionData = transactions[0];
    if (!transactionData) {
      logger.error("Transaction data is undefined", {
        sessionId: payload.data.sessionId,
      });
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Fetch full transaction with relations
    const transaction = await prisma.saleTransactions.findUnique({
      where: { id: transactionData.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            walletAddress: true,
          },
        },
        sale: {
          select: {
            id: true,
            tokenSymbol: true,
            currency: true,
          },
        },
      },
    });

    if (!transaction) {
      logger.error("Transaction not found after initial query", {
        transactionId: transactionData.id,
        sessionId: payload.data.sessionId,
      });
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Handle idempotency: Check if this webhook event was already processed
    const existingMetadata =
      (transaction.metadata as Record<string, unknown>) || {};
    const instaxchangeMetadata =
      (existingMetadata.instaxchange as Record<string, unknown>) || {};
    const webhookEvents =
      (instaxchangeMetadata.webhookEvents as Array<{
        webhookId: string;
        processedAt: string;
      }>) || [];

    // Check if this exact webhook was already processed (using webhookId)
    const isDuplicate = webhookEvents.some(
      (e) => e.webhookId === payload.webhookId,
    );

    if (isDuplicate) {
      logger.info("Instaxchange webhook event already processed", {
        sessionId: payload.data.sessionId,
        webhookId: payload.webhookId,
        transactionId: transaction.id,
      });
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Process webhook event based on event type
    //TODO: check why this structure...
    const webhookEvent = {
      webhookId: payload.webhookId,
      transactionId: payload.transactionId,
      reference: payload.reference,
      status: payload.data.status,
      statusReason: payload.data.statusReason,
      amountInFiat: payload.data.amountInFiat,
      fiatCurrency: payload.data.fiatCurrency,
      amountInCrypto: payload.data.amountInCrypto,
      cryptoCurrency: payload.data.cryptoCurrency,
      walletAddress: payload.data.walletAddress,
      depositTxId: payload.invoiceData.Deposit_tx_ID,
      depositTxStatus: payload.invoiceData.Deposit_tx_status,
      withdrawTxId: payload.invoiceData.Withdraw_tx_ID,
      withdrawTxStatus: payload.invoiceData.Withdraw_tx_status,
      processedAt: new Date().toISOString(),
      createdAt: payload.createdAt,
    };

    // Update metadata with webhook event
    const updatedMetadata = {
      ...existingMetadata,
      instaxchange: {
        ...instaxchangeMetadata,
        webhookEvents: [...webhookEvents, webhookEvent],
        lastWebhookEvent: webhookEvent,
        lastUpdated: new Date().toISOString(),
      },
    };

    // Handle different event types
    // According to Instaxchange docs, check data.status and invoiceData.Deposit_tx_status
    if (
      payload.data.status === "completed" &&
      payload.invoiceData.Deposit_tx_status === "completed"
    ) {
      // Confirm the transaction
      try {
        // Create a minimal ActionCtx for the transaction confirmation
        // Since this is a webhook, we don't have a user session, but we need to pass the user context
        // ActionCtx requires jwtContent and address from BaseCtx, but confirmTransaction only uses userId
        const ctx: ActionCtx = {
          userId: transaction.userId,
          isAdmin: false,
          jwtContent: {}, // Not used by confirmTransaction
          address: transaction.user.walletAddress || "", // Get from user if available
        };

        // Prepare confirmation payload
        // Use amountInFiat and fiatCurrency from the webhook payload
        //TODO!: check this, we should have reference to the payment amount/currency and the one received by the provider should be the 
        // !one in paidCurrency/amountPaid.
        const confirmationPayload = {
          formOfPayment: FOP.CARD,
          amountPaid: payload.data.amountInFiat.toString(),
          paidCurrency: payload.data.fiatCurrency,
          paymentDate: payload.data.createdAt
            ? new Date(payload.data.createdAt)
            : new Date(),
          metadata: {
            ...updatedMetadata,
            instaxchange: {
              ...updatedMetadata.instaxchange,
              depositTxId: payload.invoiceData.Deposit_tx_ID,
              depositTxStatus: payload.invoiceData.Deposit_tx_status,
              withdrawTxId: payload.invoiceData.Withdraw_tx_ID,
              withdrawTxStatus: payload.invoiceData.Withdraw_tx_status,
              completedAt: payload.data.createdAt,
              invoiceId: payload.invoiceData.Invoice_ID,
            },
          },
          // Store withdraw transaction ID in txHash field if available
          ...(payload.invoiceData.Withdraw_tx_ID && {
            txHash: payload.invoiceData.Withdraw_tx_ID,
          }),
        };

        // Confirm transaction using the transactions controller
        const result = await transactionsController.confirmTransaction(
          {
            id: transaction.id,
            type: "FIAT",
            payload: confirmationPayload,
          },
          ctx,
        );

        if (!result.success) {
          logger.error(
            "Failed to confirm Instaxchange transaction",
            {
              transactionId: transaction.id,
              sessionId: payload.data.sessionId,
              webhookId: payload.webhookId,
            },
            new Error(result.message),
          );
          // Still update metadata to record the webhook event
          await prisma.saleTransactions.update({
            where: { id: transaction.id },
            data: {
              metadata: updatedMetadata as Prisma.InputJsonValue,
            },
          });
          return NextResponse.json(
            {
              error: "Failed to confirm transaction",
              details: result.message,
            },
            { status: 500 },
          );
        }

        logger.info("Instaxchange transaction confirmed successfully", {
          transactionId: transaction.id,
          sessionId: payload.data.sessionId,
          webhookId: payload.webhookId,
          amountInFiat: payload.data.amountInFiat,
          fiatCurrency: payload.data.fiatCurrency,
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        logger.error(
          "Error confirming Instaxchange transaction",
          {
            transactionId: transaction.id,
            sessionId: payload.data.sessionId,
            webhookId: payload.webhookId,
          },
          error,
        );
        // Still update metadata to record the webhook event
        await prisma.saleTransactions.update({
          where: { id: transaction.id },
          data: {
            metadata: updatedMetadata as Prisma.InputJsonValue,
          },
        });
        return NextResponse.json(
          {
            error: "Webhook internal error",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        );
      }
    } else if (payload.data.status === "failed") {
      // Update transaction status to reflect failure
      // Note: We don't change status to REJECTED automatically as that requires admin approval
      // Keep current status but update metadata with failure reason
      await prisma.saleTransactions.update({
        where: { id: transaction.id },
        data: {
          metadata: updatedMetadata as Prisma.InputJsonValue,
        },
      });

      logger.info("Instaxchange payment failed", {
        transactionId: transaction.id,
        sessionId: payload.data.sessionId,
        webhookId: payload.webhookId,
        status: payload.data.status,
        statusReason: payload.data.statusReason,
        depositTxStatus: payload.invoiceData.Deposit_tx_status,
      });

      return NextResponse.json({ success: true });
    } else {
      // For other statuses (e.g., pending, processing), just update metadata
      await prisma.saleTransactions.update({
        where: { id: transaction.id },
        data: {
          metadata: updatedMetadata as Prisma.InputJsonValue,
        },
      });

      logger.info("Instaxchange webhook event processed", {
        transactionId: transaction.id,
        sessionId: payload.data.sessionId,
        webhookId: payload.webhookId,
        status: payload.data.status,
        depositTxStatus: payload.invoiceData.Deposit_tx_status,
      });

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    logger.error("Instaxchange webhook handler error", {}, error);
    return NextResponse.json(
      {
        error: "Webhook internal error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
