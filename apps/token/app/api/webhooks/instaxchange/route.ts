import { invariant } from "@epic-web/invariant";
import { FOP, Prisma, TransactionStatus } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";
import type { ActionCtx } from "@/common/schemas/dtos/sales";
import { transactionByIdWithRelations } from "@/common/types/transactions";
import { prisma } from "@/lib/db/prisma";
import transactionsController from "@/lib/repositories/transactions";
import { ConfirmTransactionDto } from "@/lib/repositories/transactions/dtos";
import { instaxchangeService } from "@/lib/services/instaxchange";
import logger from "@/lib/services/logger.server";
import { InstaxchangeWebhookPayload } from "./types";

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

    console.log("🚀 ~ route.ts:87 ~ isValidSignature:", isValidSignature);

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
      payload = InstaxchangeWebhookPayload.parse(parsed);
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

    const txId = payload.reference?.split("-")[0];
    if (!txId) {
      logger.error("Transaction ID not found", { payload });
      return NextResponse.json(
        { error: "Invalid transaction ID in webhook ref" },
        { status: 404 },
      );
    }
    // Reply fast but keep processing in the background
    waitUntil(processWebhookEvent(payload));

    return NextResponse.json({ success: true });
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

const processWebhookEvent = async (payload: InstaxchangeWebhookPayload) => {
  const txId = payload.reference?.split("-")[0];
  invariant(txId, "Transaction ID not found");

  const tx = await prisma.saleTransactions.findUniqueOrThrow({
    where: { id: txId },
    include: transactionByIdWithRelations.include,
  });

  // Handle idempotency: Check if this webhook event was already processed
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

  if (isDuplicate) {
    logger.info("Instaxchange webhook event already processed", {
      sessionId: payload.data.sessionId,
      webhookId: payload.webhookId,
      transactionId: txId,
    });
    return NextResponse.json({ success: true, message: "Already processed" });
  }

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

  if (tx.receivingWallet !== payload.invoiceData.Wallet_address) {
    logger.error("Transaction recipient wallet changed", {
      txId,
      receivingWallet: tx.receivingWallet,
      newWallet: payload.invoiceData.Wallet_address,
    });
    return await prisma.saleTransactions.update({
      where: { id: txId },
      data: {
        status: TransactionStatus.REJECTED,
        comment:
          "Transaction recipient wallet changed by user during payment process",
        metadata: updatedMetadata as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      }
    });
  }



  // Handle different event types
  // According to Instaxchange docs, check data.status and invoiceData.Deposit_tx_status
  switch (payload.data.status) {
    case "completed": {
      try {
        const ctx: ActionCtx = {
          userId: tx.userId,
          isAdmin: false,
          address: tx.user.walletAddress,
        };

        const confirmationPayload = {
          formOfPayment: FOP.CARD,
          amountPaid: payload.data.amountInCrypto.toString(),
          paidCurrency: payload.data.cryptoCurrency === 'USDC_POLYGON' ? 'USDC' : payload.data.cryptoCurrency,
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

        logger.info("Instaxchange transaction confirmed successfully", {
          transactionId: tx.id,
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
            transactionId: tx.id,
            sessionId: payload.data.sessionId,
            webhookId: payload.webhookId,
          },
          error,
        );
        // Still update metadata to record the webhook event
        await prisma.saleTransactions.update({
          where: { id: tx.id },
          data: {
            metadata: updatedMetadata as Prisma.InputJsonValue,
          },
        });

        throw error;
      }
    };
    case "failed": {
      // Update transaction status to reflect failure
      // Note: We don't change status to REJECTED automatically as that requires admin approval
      // Keep current status but update metadata with failure reason
      //TODO!: notify user
      const res = await prisma.saleTransactions.update({
        where: { id: tx.id },
        data: {
          status: TransactionStatus.CANCELLED,
          metadata: updatedMetadata as Prisma.InputJsonValue,
          comment: `Payment failed with provider: ${payload.data.statusReason}`,
        },
        select: {
          id: true,
        }
      });

      logger.info("Instaxchange payment failed", {
        transactionId: tx.id,
        sessionId: payload.data.sessionId,
        webhookId: payload.webhookId,
        status: payload.data.status,
        statusReason: payload.data.statusReason,
        depositTxStatus: payload.invoiceData.Deposit_tx_status,
      });

      return res;
    };
    default: {
      // For other statuses (e.g., pending, processing), just update metadata
      const res = await prisma.saleTransactions.update({
        where: { id: tx.id },
        data: {
          status: TransactionStatus.AWAITING_PAYMENT,
          metadata: updatedMetadata as Prisma.InputJsonValue,
        },
        select: {
          id: true,
        }
      });

      logger.info("Instaxchange webhook event processed", {
        transactionId: tx.id,
        sessionId: payload.data.sessionId,
        webhookId: payload.webhookId,
        status: payload.data.status,
        depositTxStatus: payload.invoiceData.Deposit_tx_status,
      });

      return res;
    }
  }

};
