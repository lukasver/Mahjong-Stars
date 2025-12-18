/**
 * @test-plan.md (243-249)
 * TC-TX-001: Transaction Page Load
 *
 * Mock API responses to get a transaction to use in `/dashboard/buy/[tx]`.
 * Navigate to `/dashboard/buy/[tx]`
 * Verify transaction page loads
 * Wait for the "Verify Email" dialog to appear
 * Verify the email mocking responses.
 * Verify modal is closed after email is verified.
 * Verify transaction ID is displayed
 * Verify transaction steps are visible
 * Expected: Transaction page loads successfully
 */

import { invariant } from "@epic-web/invariant";
import { FOP } from "@prisma/client";
import { TIMEOUTS } from "../../utils/constants";
import { expect, test } from "./transaction.fixtures";

test("TC-TX-001: Transaction Page Load", async ({
  tx001: txPage,
  entities,
}) => {
  const { page } = txPage;
  const pageEntities = entities.get(txPage.pageId);

  const tx = pageEntities?.["saleTransactions"].find(
    (t) => t.formOfPayment === FOP.TRANSFER,
  );

  invariant(tx, "Transaction not found");

  // Mock transaction API response
  await txPage.mockTransactionResponse(tx, {
    transaction: {
      status: tx.status,
      formOfPayment: tx.formOfPayment,
    },
    requiresKYC: null,
    requiresSAFT: false,
    kycCompleted: true,
  });

  // Navigate to transaction page
  await txPage.goto(tx.id);
  await txPage.waitForTransactionPageLoaded();

  // Wait for the "Verify Email" dialog to appear
  await txPage.waitForEmailVerificationDialog();

  // Verify email verification dialog is displayed
  const emailDialog = txPage.getEmailVerificationDialog();
  await expect(emailDialog).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify dialog title and description
  const dialogTitle = txPage.getEmailVerificationTitle();
  await expect(dialogTitle).toBeVisible({ timeout: TIMEOUTS.SHORT });
  await expect(dialogTitle).toContainText(/verify email/i);

  const dialogDescription = txPage.getEmailVerificationDescription();
  await expect(dialogDescription).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify email form inputs are visible
  const emailInput = txPage.getEmailInput();
  await expect(emailInput).toBeVisible({ timeout: TIMEOUTS.SHORT });

  const EMAIL = "test@example.com";
  const FIRST_NAME = "John";
  const LAST_NAME = "Doe";

  await txPage.interceptEmailVerificationRequest(tx.id, {
    email: EMAIL,
    firstName: FIRST_NAME,
    lastName: LAST_NAME,
  });
  // Fill and submit email verification form
  await txPage.fillEmailVerificationForm("test@example.com", "John", "Doe");
  await txPage.submitEmailVerificationForm();

  // Wait for token input to appear (step 2)
  const tokenInput = txPage.getTokenInput();
  await expect(tokenInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

  // Mock email verification API responses
  const verificationToken = "123456";

  await txPage.interceptEmailTokenVerificationRequest(tx.id, true);

  // Verify the email mocking responses - submit token
  await txPage.verifyEmailToken(verificationToken);


  expect(await txPage.getEmailVerificationSuccessMessage()).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

  // Verify modal is closed after email is verified
  await txPage.waitForEmailVerificationDialogClose();
  await expect(emailDialog).not.toBeVisible({ timeout: TIMEOUTS.MEDIUM });

  // Verify transaction page is displayed
  await txPage.verifyTransactionPageDisplayed();

  // Verify transaction ID is displayed (check URL matches)
  expect(page.url()).toContain(tx.id);

  // Verify transaction steps are visible
  const stepper = txPage.getStepper();
  await expect(stepper).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify at least one step is visible (Payment step should be visible since KYC and SAFT are not required)
  const paymentStep = txPage.getPaymentStep();
  await expect(paymentStep).toBeVisible({ timeout: TIMEOUTS.SHORT });

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/page-load.png",
    fullPage: true,
  });
});
