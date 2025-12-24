import "server-only";
import { invariant } from "@epic-web/invariant";
import { trace } from "@opentelemetry/api";
import { Geo } from "@vercel/functions";
import Decimal from "decimal.js";
import { z } from "zod";
import { env, publicUrl } from "@/common/config/env";
import { TransactionFeeTypeSchema } from "@/common/schemas/generated";
import { TransactionByIdWithRelations } from "@/common/types/transactions";
import { InstaxchangeService } from "@/lib/services/instaxchange";
import { PaymentMethod } from "@/lib/services/instaxchange/types";
import logger from "@/lib/services/logger.server";
import { AmountCalculatorService } from "@/lib/services/pricefeeds/amount.service";
import rates from "../feeds/rates";

export class PaymentsService {
  constructor(private readonly provider: InstaxchangeService) {
    invariant(this.provider, "Payment Provider not found");
  }
  createSession = async ({
    tx,
    method,
    geo,
  }: {
    tx: TransactionByIdWithRelations;
    method: z.infer<typeof PaymentMethod>;
    geo?: Geo;
  }) => {
    const span = trace
      .getTracer("payment-service")
      .startSpan("create-payment-session");

    span.setAttributes({
      "transaction.id": tx.id,
      "checkout.method": method,
    });

    let txAmount = new Decimal(tx.totalAmount);
    let txCurrency = tx.totalAmountCurrency;



    const calculator = new AmountCalculatorService(async (from, to) => {
      const ex = await rates.getExchangeRate(from, to);
      if (!ex?.success || !ex?.data) {
        return {
          data: null,
          error: ex?.message || "Failed to fetch exchange rate",
        };
      }
      return { data: ex.data, error: null };
    });

    // if payment type is apple pay, we cannot use CHF. Check that and if it is, we should convert to EUR.
    // https://instaxchange.com/dashboard/payment-methods
    if (method === "apple-pay" && txCurrency === "CHF") {
      // TODO!: we need to convert to supporteed currency (USD/EUR/GBP)
      const FALLBACK_CURRENCY = "EUR";
      txAmount = new Decimal(
        (
          await calculator.convertToCurrency({
            amount: txAmount.toString(),
            fromCurrency: txCurrency,
            toCurrency: FALLBACK_CURRENCY,
            precision: 8,
          })
        ).amount,
      );
      txCurrency = FALLBACK_CURRENCY;
    }

    // Convert amount to USD for threshold check
    let usdAmount: Decimal;
    let fixedFeePart =
      env.INSTAXCHANGE_FIXED_FEE && String(env.INSTAXCHANGE_FIXED_FEE); //USD
    const percentageFeePart =
      env.INSTAXCHANGE_PERCENTAGE_FEE &&
      String(env.INSTAXCHANGE_PERCENTAGE_FEE);

    if (txCurrency === "USD") {
      usdAmount = txAmount;
    } else {
      const conversion = await calculator.convertToCurrency({
        amount: txAmount.toString(),
        fromCurrency: txCurrency,
        toCurrency: "USD",
        precision: 8,
      });
      usdAmount = new Decimal(conversion.amount);
      if (fixedFeePart) {
        // Convert the fixed fee part to the target currency
        fixedFeePart = new Decimal(conversion.exchangeRate)
          .mul(new Decimal(fixedFeePart))
          .toString();
      }
    }

    let feeAmount: Decimal | undefined;
    let feeAmountUsd: Decimal | undefined;
    let finalAmount = txAmount;
    // If fees are configured, calculate them
    if (fixedFeePart || percentageFeePart) {
      feeAmount = calculator.calculateFee({
        amount: txAmount.toString(),
        fee: {
          fixed: fixedFeePart,
          percentage: percentageFeePart,
        },
      });
      feeAmountUsd = calculator.calculateFee({
        amount: usdAmount.toString(),
        fee: {
          fixed: fixedFeePart,
          percentage: percentageFeePart,
        },
      });
      // Add the fee amount to the final amount
      if (feeAmount && !feeAmount.isZero()) {
        finalAmount = finalAmount.add(new Decimal(feeAmount));
      }
    }

    span.setAttributes({
      "transaction.original_amount": txAmount.toString(),
      "transaction.final_amount": finalAmount.toString(),
      "transaction.currency": txCurrency,
      "transaction.quantity": tx.quantity.toString(),
      "transaction.amount_usd": usdAmount.toString(),
      ...(feeAmount && {
        "transaction.fee_amount": feeAmount.toString(),
      }),
      ...(feeAmountUsd && {
        "transaction.fee_amount_usd": feeAmountUsd.toString(),
      }),
    });

    const MIN_AMOUNT_TO_PURCHASE = new Decimal(env.MIN_AMOUNT_TO_PURCHASE || 0);
    invariant(
      usdAmount.greaterThanOrEqualTo(MIN_AMOUNT_TO_PURCHASE),
      "Transaction amount is less than the minimum amount to purchase in CC",
    );

    // Check amount threshold (≤ USD 1,000 for Instaxchange)
    // const INSTAXCHANGE_MAX_AMOUNT = new Decimal(1000);
    // if (usdAmount.gt(INSTAXCHANGE_MAX_AMOUNT)) {
    // 	throw new Error(
    // 		`Transaction amount exceeds Instaxchange limit of $${INSTAXCHANGE_MAX_AMOUNT.toString()} USD`,
    // 	);
    // }

    const recipientAddress = tx.sale.toWalletsAddress;
    invariant(
      recipientAddress,
      "Recipient address not found to create session",
    );

    // Create Instaxchange session
    // Convert to number only when calling the API (which expects a number)
    const session = await this.provider.createSession({
      // payment method selected by user
      method,
      fromAmount: finalAmount.toNumber(),
      // User sends FIAT, provider computes receiving amount in crypto
      amountDirection: "sending" as const,
      // Currency the user is sending
      fromCurrency: txCurrency,
      // Destination wallet address that will receive the crypto
      address: tx.sale.toWalletsAddress,
      // Transaction ID for reference in webhooks
      transactionId: tx.id,
      // User profile data
      email: tx.user.email || undefined,
      firstName: tx.user.profile?.firstName || undefined,
      lastName: tx.user.profile?.lastName || undefined,
      country: geo?.country || undefined,
      returnUrl: `${publicUrl}/apps/dashboard/buy/${tx.id}/pending`
    });

    // Store session ID in transaction metadata
    const existingMetadata = (tx.metadata as Record<string, unknown>) || {};

    const updatedMetadata = Object.assign(existingMetadata, {
      instaxchange: {
        sessionId: session.id,
        status: session.status,
        returnUrl: session.return_url,
        createdAt: session.created_at,
        amountUsd: usdAmount.toString(),
      },
    });

    span.setAttributes({
      "checkout.from_currency": session.from_currency,
      "checkout.from_amount": session.from_amount.toString(),
      "checkout.to_currency": session.to_currency,
      "checkout.to_amount": session.to_amount.toString(),
      "checkout.payment_direction": session.payment_direction,
      "checkout.status": session.status,
      "checkout.wallet": session.wallet,
      ...(feeAmount && {
        "checkout.fee_amount": feeAmount.toString(),
      }),
    });

    invariant(session.to_amount > 0, "Transaction amount is less than zero");

    logger.info("Instaxchange session created", {
      sessionId: session.id,
      transactionId: tx.id,
      usdAmount: usdAmount.toString(),
      amount: session.to_amount.toString(),
      currency: session.to_currency,
      feeAmount: feeAmount,
    });

    console.debug("SESSION ID=>>", session.id);

    return {
      session,
      metadata: updatedMetadata,
      fee:
        feeAmount && !feeAmount.isZero()
          ? {
            type: TransactionFeeTypeSchema.enum.PAYMENT_GATEWAY,
            amount: feeAmount,
            currencySymbol: txCurrency,
          }
          : undefined,
    };
  };
}
