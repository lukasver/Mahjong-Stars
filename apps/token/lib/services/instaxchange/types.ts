import { z } from "zod";
// Docs: https://instaxchange.com/iframe-session.html

/**
 * Instaxchange API error response structure
 */
export interface InstaxchangeApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export const PaymentMethod = z.enum([
  "card",
  "ideal",
  "bancontact",
  "apple-pay",
  "google-pay",
  "interac",
  "pix",
  "blik",
  "sepa"
]);


/**
 * Instaxchange session creation request payload
 */
export interface CreateSessionRequest {
  accountRefId: string;
  fromAmount?: number;
  toAmount?: number;
  toCurrency: "USDC" | "USDC_POLYGON";
  fromCurrency: string;
  address: string;
  amountDirection: "sending" | "receiving";
  webhookRef?: string;
  returnUrl?: string;
  method?: z.infer<typeof PaymentMethod>;
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
}



/**
 * Customer details in session creation response
 */
export interface CustomerDetails {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  address_line: string | null;
  dob: string | null;
}

/**
 * Instaxchange session creation response
 */
export interface CreateSessionResponse {
  id: string;
  from_currency: string;
  to_currency: string;
  merchant_account_id: string;
  from_amount: number;
  to_amount: number;
  method: string;
  payment_direction: string;
  status: string;
  created_at: string;
  wallet: string;
  next_step: string | null;
  customer_details: CustomerDetails;
  beneficiary_id: string | null;
  quote_direction: string;
  deposit_tx_status: string | null;
  payout_tx_status: string | null;
  return_url: string | null;
  pv: unknown | null;
}

/**
 * Instaxchange session status response
 */
export interface SessionStatusResponse {
  sessionId: string;
  webhookRef: string | null;
  address: string;
  sessionStatus:
  | "initiated"
  | "pending"
  | "processing"
  | "completed"
  | "failed";
  depositId: string | null;
  depositStatus: string | null;
  depositStatusReason: string | null;
  withdrawalID: string | null;
  withdrawStatus: string | null;
  withdrawStatusReason: string | null;
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  createdAt: string; // (ISO 8601)
  updatedAt: string; // (ISO 8601)
}

type InstaxchangeTransactionStatus = "completed" | "pending" | "processing" | "failed";

/**
 * Instaxchange webhook payload structure
 */
export interface InstaxchangeWebhookResponse {
  webhookId: string;
  transactionId: string;
  "reference": string,
  "data": {
    amountInFiat: number;
    fiatCurrency: string;
    amountInCrypto: number;
    cryptoCurrency: string;
    status: InstaxchangeTransactionStatus | string;
    statusReason: string | null;
    walletAddress: string;
    additionalData: { wdId: string };
    sessionId: string;
    createdAt: string;
  },
  invoiceData: {
    Email: string;
    Name: string;
    Credit_card_number: string;
    Invoice_ID: string;
    Status: InstaxchangeTransactionStatus | string;
    Wallet_address: string;
    Details: string;
    Invoice_date: string;
    Deposit_tx_ID: string;
    Deposit_tx_amount: string;
    Deposit_tx_status: InstaxchangeTransactionStatus | string;
    Withdraw_tx_ID: string;
    Withdraw_tx_amount: string;
    Withdraw_tx_status: InstaxchangeTransactionStatus | string;
  },
  createdAt: string;
}


