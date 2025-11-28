/**
 * Test data generators and mock data
 */

/**
 * Generate mock transaction data
 */
export function generateMockTransaction(
	overrides?: Partial<{
		id: string;
		amount: string;
		status: string;
		createdAt: string;
	}>,
): {
	id: string;
	amount: string;
	status: string;
	createdAt: string;
} {
	return {
		id: overrides?.id || `tx-${Date.now()}`,
		amount: overrides?.amount || "100",
		status: overrides?.status || "PENDING",
		createdAt: overrides?.createdAt || new Date().toISOString(),
	};
}

/**
 * Generate mock sale data
 */
export function generateMockSale(
	overrides?: Partial<{
		id: string;
		name: string;
		isActive: boolean;
	}>,
): {
	id: string;
	name: string;
	isActive: boolean;
} {
	return {
		id: overrides?.id || `sale-${Date.now()}`,
		name: overrides?.name || "Test Sale",
		isActive: overrides?.isActive ?? true,
	};
}
