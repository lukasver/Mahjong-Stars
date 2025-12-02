/**
 * @test-plan.md (30-37)
 * TC-DASH-003: Token Cards Display
 *
 * Navigate to `/dashboard`
 * Verify "Your tokens" card is displayed
 * Verify "Tokens pending confirmation" card is displayed
 * Verify "Token Price" card is displayed with correct price
 * Verify "Remaining Tokens" card is displayed
 * Expected: All token cards show correct values
 */

import { expect, test } from "@playwright/test";
import { DashboardPage } from "../../pages/dashboard-page";
import { TIMEOUTS } from "../../utils/constants";

test("TC-DASH-003: Token Cards Display", async ({ page }) => {
	const dashboardPage = new DashboardPage(page);

	// Navigate to dashboard
	await dashboardPage.goto();
	await dashboardPage.waitForDashboardLoaded();

	// Verify token cards container is visible
	const tokenCardsContainer = dashboardPage.getTokenCards();
	await expect(tokenCardsContainer).toBeVisible({ timeout: TIMEOUTS.SHORT });

	// Verify "Your tokens" card is displayed
	const yourTokensCard = dashboardPage.getYourTokensCard();
	await expect(yourTokensCard).toBeVisible({ timeout: TIMEOUTS.SHORT });
	const yourTokensTitle = yourTokensCard.getByText("Your tokens");
	await expect(yourTokensTitle).toBeVisible({ timeout: TIMEOUTS.SHORT });
	// Verify card has a value displayed
	const yourTokensValue = dashboardPage.getCardValue(yourTokensCard);
	await expect(yourTokensValue).toBeVisible({ timeout: TIMEOUTS.SHORT });
	const yourTokensValueText = await yourTokensValue.textContent();
	expect(yourTokensValueText).toBeTruthy();
	expect(yourTokensValueText?.trim().length).toBeGreaterThan(0);

	// Verify "Tokens pending confirmation" card is displayed
	const tokensPendingCard = dashboardPage.getTokensPendingConfirmationCard();
	await expect(tokensPendingCard).toBeVisible({ timeout: TIMEOUTS.SHORT });
	const tokensPendingTitle = tokensPendingCard.getByText(
		"Tokens pending confirmation",
	);
	await expect(tokensPendingTitle).toBeVisible({ timeout: TIMEOUTS.SHORT });
	// Verify card has a value displayed
	const tokensPendingValue = dashboardPage.getCardValue(tokensPendingCard);
	await expect(tokensPendingValue).toBeVisible({ timeout: TIMEOUTS.SHORT });
	const tokensPendingValueText = await tokensPendingValue.textContent();
	expect(tokensPendingValueText).toBeTruthy();
	expect(tokensPendingValueText?.trim().length).toBeGreaterThan(0);

	// Verify "Token Price" card is displayed with correct price
	const tokenPriceCard = dashboardPage.getTokenPriceCard();
	await expect(tokenPriceCard).toBeVisible({ timeout: TIMEOUTS.SHORT });
	const tokenPriceTitle = tokenPriceCard.getByText("Token Price");
	await expect(tokenPriceTitle).toBeVisible({ timeout: TIMEOUTS.SHORT });
	// Verify card has a price value displayed (should start with $)
	const tokenPriceValue = dashboardPage.getCardValue(tokenPriceCard);
	await expect(tokenPriceValue).toBeVisible({ timeout: TIMEOUTS.SHORT });
	const priceText = await tokenPriceValue.textContent();
	expect(priceText).toBeTruthy();
	expect(priceText?.trim()).toMatch(/^\$[\d.]+/);

	// Verify "Remaining Tokens" card is displayed
	const remainingTokensCard = dashboardPage.getRemainingTokensCard();
	await expect(remainingTokensCard).toBeVisible({ timeout: TIMEOUTS.SHORT });
	const remainingTokensTitle =
		remainingTokensCard.getByText("Remaining Tokens");
	await expect(remainingTokensTitle).toBeVisible({ timeout: TIMEOUTS.SHORT });
	// Verify card has a value displayed
	const remainingTokensValue = dashboardPage.getCardValue(remainingTokensCard);
	await expect(remainingTokensValue).toBeVisible({ timeout: TIMEOUTS.SHORT });
	const remainingTokensValueText = await remainingTokensValue.textContent();
	expect(remainingTokensValueText).toBeTruthy();
	expect(remainingTokensValueText?.trim().length).toBeGreaterThan(0);
});
