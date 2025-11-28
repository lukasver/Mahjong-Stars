/**
 * Test constants and configuration values
 */

export const TIMEOUTS = {
	SHORT: 5000,
	MEDIUM: 10000,
	LONG: 30000,
	VERY_LONG: 60000,
} as const;

export const SELECTORS = {
	// Navigation
	NAV_DASHBOARD: '[href="/dashboard"]',
	NAV_BUY: '[href="/dashboard/buy"]',
	NAV_TRANSACTIONS: '[href="/dashboard/transactions"]',
	NAV_ADMIN: '[href="/admin"]',

	// Common
	LOADING: '[data-testid="loading"]',
	ERROR: '[data-testid="error"]',
} as const;

export const ROUTES = {
	HOME: "/",
	DASHBOARD: "/dashboard",
	BUY: "/dashboard/buy",
	TRANSACTIONS: "/dashboard/transactions",
	ADMIN: "/admin",
	ADMIN_SALES: "/admin/sales",
	ADMIN_USERS: "/admin/users",
	ADMIN_TRANSACTIONS: "/admin/transactions",
} as const;
