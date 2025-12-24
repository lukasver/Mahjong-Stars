import { invariant } from "@epic-web/invariant";
import { describe, expect, test, vi } from "vitest";
import { InstaxchangeService } from "@/lib/services/instaxchange";

vi.mock('server-only', () => ({}));
// dotenv.config({ path: ".env.test.local" });
invariant(
  process.env.INSTAXCHANGE_ACCOUNT_REF_ID,
  "INSTAXCHANGE_ACCOUNT_REF_ID is not set",
);
describe("Instaxchange Webhook Signature", () => {
  const service = new InstaxchangeService({
    accountRefId: process.env.INSTAXCHANGE_ACCOUNT_REF_ID,
    apiKey: process.env.INSTAXCHANGE_API_KEY,
    apiUrl: process.env.INSTAXCHANGE_API_URL,
    webhookSecret: process.env.INSTAXCHANGE_WEBHOOK_SECRET,
    maxRetries: 1,
  });

  expect(service).toBeTruthy();


  const sig =
    "83c2301a96aab233444951a7a1954021";
  const body = JSON.stringify({
    "webhookId": "whc_cd8ff31b-85be-41a3-9aea-bb702286e577",
    "transactionId": "dp_1b3e438b-7f7b-4989-85d0-0799a8a3fe06",
    "reference": "cmjiukhh300048o4k4d1i4fsa-1766577779640",
    "data": {
      "amountInFiat": 12.03,
      "fiatCurrency": "USD",
      "amountInCrypto": 11.01448475007,
      "cryptoCurrency": "USDC-POLYGON",
      "status": "pending",
      "statusReason": null,
      "walletAddress": "0x9B99A11559CA88F0692E9dc3e1eA4E5F807782FF",
      "additionalData": null,
      "sessionId": "ps_99a8808b-738c-4f43-9f9f-ad556b0cda3f",
      "createdAt": "2025-12-24T12:03:16.166Z"
    },
    "invoiceData": {
      "Email": "lucas+cc@smat.io",
      "Name": "Lucas Test",
      "Credit_card_number": null,
      "Invoice_ID": "ps_99a8808b-738c-4f43-9f9f-ad556b0cda3f",
      "Status": "pending",
      "Wallet_address": "0x9B99A11559CA88F0692E9dc3e1eA4E5F807782FF",
      "Details": "12.03 USD => 11.01448475007 USDC-POLYGON",
      "Invoice_date": "24th December, 2025",
      "Deposit_tx_ID": "dp_1b3e438b-7f7b-4989-85d0-0799a8a3fe06",
      "Deposit_tx_amount": "12.03 USD",
      "Deposit_tx_status": "in_progress",
      "Withdraw_tx_ID": "dp_1b3e438b-7f7b-4989-85d0-0799a8a3fe06",
      "Withdraw_tx_amount": "11.01448475007 USDC-POLYGON",
      "Withdraw_tx_status": "pending"
    },
    "createdAt": "2025-12-24T13:55:00.406Z"
  });

  test("should create webhook signature correctly", () => {
    // @ts-ignore parsing
    const generated = service['createWebhookSignature'](JSON.parse(body), process.env.INSTAXCHANGE_WEBHOOK_SECRET);
    expect(
      generated,
      `Received: ${generated}
      Should be: ${sig}`,
    ).toBe(sig);
  })

  test("should verify webhook signature", () => {
    const isValid = service.verifyWebhookSignature(body, sig,);
    expect(isValid).toBe(true);

  });
});
