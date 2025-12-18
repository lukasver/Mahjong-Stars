/**
 * @test-plan.md (338-345)
 * TC-TX-009: Transaction Status Page (Success)
 *
 * Navigate to `/dashboard/buy/[tx]/success`
 * Verify success message is displayed
 * Verify transaction details are displayed
 * Verify "View Transaction" or "Back to Dashboard" button is visible
 * Click "Back to Dashboard"
 * Verify navigation to dashboard
 * Expected: Success status page displays correctly
 */

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { TransactionPage } from "../../pages/transaction.pom";
import { ROUTES, TIMEOUTS } from "../../utils/constants";

test("TC-TX-009: Transaction Status Page (Success)", async ({ page }) => {
  const transactionId = faker.string.uuid();


  const transactionPage = new TransactionPage(page);

  // Navigate to success status page
  await transactionPage.navigateToStatus(transactionId, "success");
  await transactionPage.waitForTransactionPageLoaded();

  // Verify success message is displayed
  const successMessage = transactionPage.getSuccessMessage();
  await expect(successMessage).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify transaction details are displayed
  const transactionDetails = transactionPage.getTransactionDetails();
  await expect(transactionDetails).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Verify "View Transaction" or "Back to Dashboard" button is visible
  const backButton = transactionPage.getBackToDashboardButton();
  const viewButton = transactionPage.getViewTransactionButton();

  const backButtonCount = await backButton.count();
  const viewButtonCount = await viewButton.count();

  expect(backButtonCount > 0 || viewButtonCount > 0).toBe(true);

  // Click "Back to Dashboard" if available
  if (backButtonCount > 0) {
    await expect(backButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
    await expect(backButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });

    // Click and verify navigation
    await backButton.click({ timeout: TIMEOUTS.MEDIUM });
    await page.waitForURL(`**${ROUTES.DASHBOARD}**`, {
      timeout: TIMEOUTS.MEDIUM,
    });
    expect(page.url()).toContain(ROUTES.DASHBOARD);
  }

  await page.screenshot({
    path: "./__tests__/e2e/specs/__screenshots__/transaction/status-success.png",
    fullPage: true,
  });
});
