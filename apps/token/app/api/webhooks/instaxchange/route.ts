import { invariant } from "@epic-web/invariant";
import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { FOP, Prisma, TransactionStatus } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";
import type { ActionCtx } from "@/common/schemas/dtos/sales";
import { transactionByIdWithRelations } from "@/common/types/transactions";
import { prisma } from "@/lib/db/prisma";
import transactionsController from "@/lib/repositories/transactions";
import { ConfirmTransactionDto, RejectTransactionDto } from "@/lib/repositories/transactions/dtos";
import { instaxchangeService } from "@/lib/services/instaxchange";
import { InstaxchangeWebhookPayload } from "./types";

/**
 * POST handler for Instaxchange webhook events
 * Handles payment status updates and transaction confirmation
 */
export async function POST(req: NextRequest) {
  const span = trace
    .getTracer("instaxchange-webhook")
    .startSpan("webhook-handler");

  try {
    span.setAttributes({
      "http.method": "POST",
      "http.route": "/api/webhooks/instaxchange",
    });

    if (!instaxchangeService) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Instaxchange service not implemented",
      });
      span.end();
      return NextResponse.json({ error: "Not implemented" }, { status: 501 });
    }

    // Get raw body for signature verification
    // Next.js 13+ requires reading the body as text for webhook signature verification
    const rawBody = await req.text();

    // According to Instaxchange docs, the header is X-InstaXWH-KEY
    const signature = req.headers.get("X-InstaXWH-KEY");

    if (!signature) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Missing signature header",
      });
      span.addEvent("webhook.validation.failed", {
        reason: "missing_signature_header",
      });
      span.end();
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 401 },
      );
    }

    // Verify webhook signature
    const verifySpan = trace
      .getTracer("instaxchange-webhook")
      .startSpan("verify-webhook-signature");

    let isValidSignature: boolean;
    try {
      // Instaxchange uses MD5 hash with sorted JSON keys (implemented in verifyWebhookSignature)
      isValidSignature = instaxchangeService.verifyWebhookSignature(
        rawBody,
        signature,
      );

      verifySpan.setAttributes({
        "webhook.signature.valid": isValidSignature,
        "webhook.signature.prefix": signature.substring(0, 20),
      });

      if (!isValidSignature) {
        verifySpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Invalid signature",
        });
        verifySpan.addEvent("webhook.signature.verification.failed");
        verifySpan.end();
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Invalid signature",
        });
        span.end();
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      verifySpan.setStatus({ code: SpanStatusCode.OK });
      verifySpan.end();
    } catch (error) {
      verifySpan.recordException(error as Error);
      verifySpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Signature verification error",
      });
      verifySpan.end();
      throw error;
    }

    // Parse webhook payload
    const parseSpan = trace
      .getTracer("instaxchange-webhook")
      .startSpan("parse-webhook-payload");

    let payload: InstaxchangeWebhookPayload;
    try {
      const parsed = JSON.parse(rawBody);
      payload = InstaxchangeWebhookPayload.parse(parsed);
      parseSpan.setAttributes({
        "webhook.id": payload.webhookId,
        "webhook.transaction_id": payload.transactionId ?? "",
        "webhook.session_id": payload.data.sessionId,
        "webhook.status": payload.data.status,
      });
      parseSpan.setStatus({ code: SpanStatusCode.OK });
      parseSpan.end();
    } catch (error) {
      parseSpan.recordException(error as Error);
      parseSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Failed to parse webhook payload",
      });
      parseSpan.end();
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Invalid JSON or Payload",
      });
      span.end();
      return NextResponse.json(
        { error: "Invalid JSON or Payload" },
        { status: 400 },
      );
    }

    const txId = payload.reference?.split("-")[0];
    if (!txId) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Transaction ID not found in webhook reference",
      });
      span.addEvent("webhook.validation.failed", {
        reason: "missing_transaction_id",
        reference: payload.reference ?? "",
      });
      span.end();
      return NextResponse.json(
        { error: "Invalid transaction ID in webhook ref" },
        { status: 404 },
      );
    }

    span.setAttributes({
      "transaction.id": txId,
      "webhook.id": payload.webhookId,
      "webhook.session_id": payload.data.sessionId,
      "webhook.status": payload.data.status,
    });

    span.addEvent("webhook.received", {
      webhookId: payload.webhookId,
      transactionId: payload.transactionId,
      sessionId: payload.data.sessionId,
      status: payload.data.status,
    });

    // Reply fast but keep processing in the background
    // Pass the span context to maintain trace continuity
    const spanContext = trace.setSpan(context.active(), span);
    waitUntil(
      context.with(spanContext, () => processWebhookEvent(payload)),
    );

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: "Webhook handler internal error",
    });
    span.end();
    return NextResponse.json(
      {
        error: "Webhook internal error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * Main function to process events from Instaxchange webhook
 */
const processWebhookEvent = async (payload: InstaxchangeWebhookPayload) => {
  const span = trace
    .getTracer("instaxchange-webhook")
    .startSpan("process-webhook-event");

  try {
    const txId = payload.reference?.split("-")[0];
    invariant(txId, "Transaction ID not found");

    span.setAttributes({
      "transaction.id": txId,
      "webhook.id": payload.webhookId,
      "webhook.session_id": payload.data.sessionId,
      "webhook.status": payload.data.status,
    });

    const fetchTxSpan = trace
      .getTracer("instaxchange-webhook")
      .startSpan("fetch-transaction");

    let tx;
    try {
      tx = await prisma.saleTransactions.findUniqueOrThrow({
        where: { id: txId },
        include: transactionByIdWithRelations.include,
      });

      fetchTxSpan.setAttributes({
        "transaction.id": tx.id,
        "transaction.status": tx.status,
        "transaction.user_id": tx.userId,
      });
      fetchTxSpan.setStatus({ code: SpanStatusCode.OK });
      fetchTxSpan.end();
    } catch (error) {
      fetchTxSpan.recordException(error as Error);
      fetchTxSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Transaction not found",
      });
      fetchTxSpan.end();
      throw error;
    }

    // Handle idempotency: Check if this webhook event was already processed
    const idempotencySpan = trace
      .getTracer("instaxchange-webhook")
      .startSpan("check-idempotency");

    const existingMetadata = (tx.metadata as Record<string, unknown>) || {};
    const instaxchangeMetadata =
      (existingMetadata.instaxchange as Record<string, unknown>) || {};
    const webhookEvents =
      (instaxchangeMetadata.webhookEvents as Array<{
        webhookId: string;
        processedAt: string;
        payload: string;
      }>) || [];

    // Check if this exact webhook was already processed (using webhookId)
    const isDuplicate = webhookEvents.some(
      (e) => e.webhookId === payload.webhookId,
    );

    idempotencySpan.setAttributes({
      "webhook.idempotency.is_duplicate": isDuplicate,
      "webhook.events.count": webhookEvents.length,
    });

    if (isDuplicate) {
      idempotencySpan.addEvent("webhook.duplicate.detected", {
        webhookId: payload.webhookId,
        sessionId: payload.data.sessionId,
        transactionId: txId,
      });
      idempotencySpan.setStatus({ code: SpanStatusCode.OK });
      idempotencySpan.end();
      span.setStatus({ code: SpanStatusCode.OK });
      span.addEvent("webhook.already_processed");
      span.end();
      return;
    }

    idempotencySpan.setStatus({ code: SpanStatusCode.OK });
    idempotencySpan.end();

    // Process webhook event based on event type
    const webhookEvent: {
      webhookId: string;
      processedAt: string;
      payload: string;
    } = {
      webhookId: payload.webhookId,
      processedAt: new Date().toISOString(),
      payload: JSON.stringify(payload),
    };

    // Update metadata with webhook event
    const updatedMetadata = Object.assign(existingMetadata, {
      instaxchange: {
        ...instaxchangeMetadata,
        webhookEvents: [...webhookEvents, webhookEvent],
        lastWebhookEvent: webhookEvent,
        lastUpdated: new Date().toISOString(),
      },
    });

    // Validate wallet address
    if (tx.sale.toWalletsAddress.toLowerCase() !== payload.data.walletAddress?.toLowerCase()) {
      console.debug('Processed case ==> WALLET ADDRESS MISMATCH')
      const walletValidationSpan = trace
        .getTracer("instaxchange-webhook")
        .startSpan("validate-wallet-address");

      walletValidationSpan.setAttributes({
        "transaction.receiving_wallet": tx.receivingWallet ?? "",
        "webhook.wallet_address": payload.invoiceData.Wallet_address,
        "validation.failed": true,
        "validation.reason": "wallet_address_mismatch",
      });

      walletValidationSpan.addEvent("webhook.wallet_mismatch", {
        txId,
        receivingWallet: tx.receivingWallet ?? "",
        newWallet: payload.invoiceData.Wallet_address,
      });

      walletValidationSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Transaction recipient wallet changed",
      });
      walletValidationSpan.end();

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Wallet address mismatch",
      });
      span.addEvent("webhook.rejected", {
        reason: "wallet_address_mismatch",
      });

      const updateSpan = trace
        .getTracer("instaxchange-webhook")
        .startSpan("reject-transaction");

      try {
        const ctx: ActionCtx = {
          userId: tx.userId,
          isAdmin: false,
          address: tx.user.walletAddress,
        };

        const rejectDto: RejectTransactionDto = {
          id: txId,
          reason: "Transaction recipient wallet changed by user during payment process",
          metadata: updatedMetadata,
        };

        const result = await transactionsController.rejectTransaction(rejectDto, ctx);

        if (!result.success) {
          throw new Error(result.message || "Failed to reject transaction");
        }

        updateSpan.setAttributes({
          "transaction.status": TransactionStatus.REJECTED,
        });
        updateSpan.setStatus({ code: SpanStatusCode.OK });
        updateSpan.end();
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return
      } catch (error) {
        updateSpan.recordException(error as Error);
        updateSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to reject transaction",
        });
        updateSpan.end();
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Error rejecting transaction",
        });
        span.end();
        throw error;
      }
    }



    // Handle different event types
    // According to Instaxchange docs, check data.status and invoiceData.Deposit_tx_status
    switch (payload.data.status) {
      case "completed": {
        console.debug('Processed case ==> COMPLETED')
        const confirmSpan = trace
          .getTracer("instaxchange-webhook")
          .startSpan("confirm-transaction");

        try {
          confirmSpan.setAttributes({
            "transaction.id": tx.id,
            "webhook.session_id": payload.data.sessionId,
            "payment.amount_fiat": payload.data.amountInFiat.toString(),
            "payment.fiat_currency": payload.data.fiatCurrency,
            "payment.amount_crypto": payload.data.amountInCrypto.toString(),
            "payment.crypto_currency": payload.data.cryptoCurrency,
          });

          const ctx: ActionCtx = {
            userId: tx.userId,
            isAdmin: false,
            address: tx.user.walletAddress,
          };

          const confirmationPayload = {
            formOfPayment: FOP.CARD,
            amountPaid: payload.data.amountInCrypto.toString(),
            paidCurrency: "USDC" as const,
            // payload.data.cryptoCurrency === "USDC_POLYGON"
            //   ? "USDC"
            //   : payload.data.cryptoCurrency,
            paymentDate: payload.data.createdAt
              ? new Date(payload.data.createdAt)
              : new Date(),
            paymentEvidenceId: payload.transactionId ?? undefined,
            metadata: {
              ...updatedMetadata,
              instaxchange: {
                ...updatedMetadata.instaxchange,
                amountInFiat: payload.data.amountInFiat.toString(),
                fiatCurrency: payload.data.fiatCurrency,
                amountInCrypto: payload.data.amountInCrypto.toString(),
                cryptoCurrency: payload.data.cryptoCurrency,
                depositTxId: payload.invoiceData.Deposit_tx_ID,
                depositTxStatus: payload.invoiceData.Deposit_tx_status,
                withdrawTxId: payload.invoiceData.Withdraw_tx_ID,
                withdrawTxStatus: payload.invoiceData.Withdraw_tx_status,
                completedAt: payload.data.createdAt,
                invoiceId: payload.invoiceData.Invoice_ID,
                sessionId: payload.data.sessionId,
                status: payload.data.status,
                statusReason: payload.data.statusReason,
              },
            },
            // Store withdraw transaction ID in txHash field if available
            ...(payload.invoiceData.Withdraw_tx_ID && {
              txHash: payload.invoiceData.Withdraw_tx_ID,
            }),
          } satisfies ConfirmTransactionDto["payload"];

          // Confirm transaction using the transactions controller
          const result = await transactionsController.confirmTransaction(
            {
              id: txId,
              type: "FIAT",
              payload: confirmationPayload,
            },
            ctx,
          );

          if (!result.success) {
            throw new Error(result.message);
          }

          confirmSpan.addEvent("transaction.confirmed", {
            transactionId: tx.id,
            sessionId: payload.data.sessionId,
            webhookId: payload.webhookId,
            amountInFiat: payload.data.amountInFiat,
            fiatCurrency: payload.data.fiatCurrency,
          });

          confirmSpan.setStatus({ code: SpanStatusCode.OK });
          confirmSpan.end();
          span.setStatus({ code: SpanStatusCode.OK });
          span.addEvent("webhook.completed");
          span.end();
          return;
        } catch (error) {
          confirmSpan.recordException(error as Error);
          confirmSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Failed to confirm transaction",
          });
          confirmSpan.end();

          // Still update metadata to record the webhook event
          const updateMetadataSpan = trace
            .getTracer("instaxchange-webhook")
            .startSpan("update-metadata-on-error");

          try {
            await prisma.saleTransactions.update({
              where: { id: tx.id },
              data: {
                metadata: updatedMetadata as Prisma.InputJsonValue,
              },
            });
            updateMetadataSpan.setStatus({ code: SpanStatusCode.OK });
            updateMetadataSpan.end();
          } catch (updateError) {
            updateMetadataSpan.recordException(updateError as Error);
            updateMetadataSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: "Failed to update metadata",
            });
            updateMetadataSpan.end();
          }

          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Error confirming transaction",
          });
          span.end();
          throw error;
        }
      }
      case "failed": {
        console.debug('Processed case ==> FAILED')
        const failedSpan = trace
          .getTracer("instaxchange-webhook")
          .startSpan("handle-payment-failure");

        try {
          failedSpan.setAttributes({
            "transaction.id": tx.id,
            "webhook.session_id": payload.data.sessionId,
            "webhook.status_reason": payload.data.statusReason ?? "",
            "webhook.deposit_tx_status": payload.invoiceData.Deposit_tx_status ?? "",
          });

          // Cancel transaction using rejectTransaction method with CANCELLED status
          // This will restore units to the sale and send email notification to the user
          const ctx: ActionCtx = {
            userId: tx.userId,
            isAdmin: false,
            address: tx.user.walletAddress,
          };

          const cancelDto: RejectTransactionDto = {
            id: tx.id,
            reason: `Payment failed with provider: ${payload.data.statusReason}`,
            metadata: updatedMetadata,
            status: "CANCELLED",
          };

          const result = await transactionsController.rejectTransaction(cancelDto, ctx);

          if (!result.success) {
            throw new Error(result.message || "Failed to cancel transaction");
          }

          failedSpan.addEvent("payment.failed", {
            transactionId: tx.id,
            sessionId: payload.data.sessionId,
            webhookId: payload.webhookId,
            status: payload.data.status,
            statusReason: payload.data.statusReason ?? "",
            depositTxStatus: payload.invoiceData.Deposit_tx_status ?? "",
          });

          failedSpan.setAttributes({
            "transaction.status": TransactionStatus.CANCELLED,
          });
          failedSpan.setStatus({ code: SpanStatusCode.OK });
          failedSpan.end();
          span.setStatus({ code: SpanStatusCode.OK });
          span.addEvent("webhook.failed");
          span.end();
          return
        } catch (error) {
          failedSpan.recordException(error as Error);
          failedSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Failed to handle payment failure",
          });
          failedSpan.end();
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Error handling payment failure",
          });
          span.end();
          throw error;
        }
      }
      default: {
        console.debug(`Processed case ==> DEFAULT (${payload.data.status})`)
        const defaultSpan = trace
          .getTracer("instaxchange-webhook")
          .startSpan("handle-pending-status");

        try {
          defaultSpan.setAttributes({
            "transaction.id": tx.id,
            "webhook.session_id": payload.data.sessionId,
            "webhook.status": payload.data.status,
            "webhook.deposit_tx_status": payload.invoiceData.Deposit_tx_status ?? "",
          });

          // For other statuses (e.g., pending, processing), just update metadata
          await prisma.saleTransactions.update({
            where: { id: tx.id },
            data: {
              //TODO! check if we should keep this in PENDING instead...
              status: TransactionStatus.AWAITING_PAYMENT,
              metadata: updatedMetadata as Prisma.InputJsonValue,
            },
            select: {
              id: true,
            },
          });

          defaultSpan.addEvent("webhook.status_update", {
            transactionId: tx.id,
            sessionId: payload.data.sessionId,
            webhookId: payload.webhookId,
            status: payload.data.status,
            depositTxStatus: payload.invoiceData.Deposit_tx_status ?? "",
          });

          defaultSpan.setAttributes({
            "transaction.status": TransactionStatus.AWAITING_PAYMENT,
          });
          defaultSpan.setStatus({ code: SpanStatusCode.OK });
          defaultSpan.end();
          span.setStatus({ code: SpanStatusCode.OK });
          span.addEvent("webhook.pending");
          span.end();
          return
        } catch (error) {
          defaultSpan.recordException(error as Error);
          defaultSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Failed to handle pending status",
          });
          defaultSpan.end();
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Error handling pending status",
          });
          span.end();
          throw error;
        }
      }
    }
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: "Error processing webhook event",
    });
    span.end();
    throw error;
  }
}
