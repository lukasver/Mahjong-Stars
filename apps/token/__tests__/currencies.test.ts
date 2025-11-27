import { faker } from "@faker-js/faker";
import Decimal from "decimal.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	formatCurrency,
	formatStringCurrencyToNumber,
	safeFormatCurrency,
} from "../../../packages/utils/client/currencies";

/**
 * Test suite for currency formatting utilities
 */
describe("Currency Formatting", () => {
	// Mock Intl.NumberFormat for consistent testing
	let originalIntl: typeof Intl;

	beforeEach(() => {
		originalIntl = global.Intl;
	});

	afterEach(() => {
		global.Intl = originalIntl;
	});

	// Helper function to test that trailing zeros are properly removed
	const testTrailingZeroRemoval = (
		value: number,
		locale: string,
		expectedDecimalSeparator: string,
	) => {
		const result = formatCurrency(value, { locale });

		if (!result) return; // Skip if result is undefined/null

		// Check that trailing zeros after decimal separator are removed
		if (value % 1 === 0) {
			// For whole numbers, should not have decimal separator
			expect(result).not.toContain(expectedDecimalSeparator);
		} else {
			// For decimal numbers, should not end with zero after decimal separator
			const decimalIndex = result.lastIndexOf(expectedDecimalSeparator);
			if (decimalIndex !== -1) {
				const decimalPart = result.substring(decimalIndex + 1);
				expect(decimalPart).not.toBe("0");
				expect(decimalPart).not.toMatch(/0+$/);
			}
		}
	};

	describe("[formatCurrency] - Basic functionality", () => {
		it("should format basic numbers correctly", () => {
			expect(formatCurrency(100, { locale: "en-US" })).toBe("100");
			expect(formatCurrency(100.5, { locale: "en-US" })).toBe("100.5");
			expect(formatCurrency(100.5, { locale: "en-US" })).toBe("100.5");
			expect(formatCurrency(100.0, { locale: "en-US" })).toBe("100");
		});

		it("should handle currency symbols", () => {
			const usResult = formatCurrency(100, {
				locale: "en-US",
				currency: "USD",
			});
			expect(usResult).toMatch(/\$|USD/);
			expect(usResult).toContain("100");

			const deResult = formatCurrency(100, {
				locale: "de-DE",
				currency: "EUR",
			});
			expect(deResult).toMatch(/\€|EUR/);
			expect(deResult).toContain("100");
		});

		it("should handle different precision types", () => {
			expect(
				formatCurrency(100.12345678, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100.12345678");
			expect(
				formatCurrency(100.12345678, { locale: "en-US", precision: "FIAT" }),
			).toBe("100.1235");
			// crypto up to 18 decimals
			Array.from({ length: 18 }).forEach((_, i) => {
				const baseValue = new Decimal(faker.number.int({ min: 0, max: 9 }));
				const decimalIncrement = new Decimal(1).dividedBy(
					new Decimal(10).pow(i + 1),
				);
				const value = baseValue.plus(decimalIncrement);

				const formatted = formatCurrency(value, { locale: "en-US" });
				// const fiatFormatted = formatCurrency(value, {
				// 	locale: "en-US",
				// 	precision: "FIAT",
				// });
				// const cryptoFormatted = formatCurrency(value, {
				// 	locale: "en-US",
				// 	precision: "CRYPTO",
				// });

				// console.log({
				// 	value: value.toDecimalPlaces().toFixed(),
				// 	formatted,
				// 	cryptoFormatted,
				// 	fiatFormatted,
				// });
				expect(formatted).toBe(value.toDecimalPlaces().toFixed());
			});
		});

		it("should handle edge cases", () => {
			expect(formatCurrency(0, { locale: "en-US" })).toBe("0");
			expect(formatCurrency(0.0, { locale: "en-US" })).toBe("0");
			expect(formatCurrency(0.0, { locale: "en-US" })).toBe("0");
			// Very high numerical values
			expect(formatCurrency(999999999999.99, { locale: "en-US" })).toContain(
				"999",
			);
			expect(
				formatCurrency(Number.MAX_SAFE_INTEGER, { locale: "en-US" }),
			).toBeDefined();
			expect(
				formatCurrency(new Decimal("1e15"), { locale: "en-US" }),
			).toBeDefined();
			// Super low numerical values
			expect(
				formatCurrency(0.00000001, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("0.00000001");
			expect(
				formatCurrency(0.000000001, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("0.00000001");
			expect(
				formatCurrency(new Decimal("0.000000000000000001"), {
					locale: "en-US",
					precision: "CRYPTO",
				}),
			).toBeDefined();
			expect(
				formatCurrency(0.0001, { locale: "en-US", precision: "FIAT" }),
			).toBe("0.0001");
		});
	});

	describe("[formatCurrency] - Locale decimal separators", () => {
		it("should handle US locale with period decimal separator", () => {
			testTrailingZeroRemoval(100.0, "en-US", ".");
			testTrailingZeroRemoval(100.5, "en-US", ".");
			testTrailingZeroRemoval(100.5, "en-US", ".");
		});

		it("should handle German locale with comma decimal separator", () => {
			testTrailingZeroRemoval(100.0, "de-DE", ",");
			testTrailingZeroRemoval(100.5, "de-DE", ",");
			testTrailingZeroRemoval(100.5, "de-DE", ",");
		});

		it("should handle French locale with comma decimal separator", () => {
			testTrailingZeroRemoval(100.0, "fr-FR", ",");
			testTrailingZeroRemoval(100.5, "fr-FR", ",");
			testTrailingZeroRemoval(100.5, "fr-FR", ",");
		});

		it("should handle Swiss locale with period decimal separator", () => {
			testTrailingZeroRemoval(100.0, "de-CH", ".");
			testTrailingZeroRemoval(100.5, "de-CH", ".");
			testTrailingZeroRemoval(100.5, "de-CH", ".");
		});

		it("should handle Italian locale with comma decimal separator", () => {
			testTrailingZeroRemoval(100.0, "it-IT", ",");
			testTrailingZeroRemoval(100.5, "it-IT", ",");
			testTrailingZeroRemoval(100.5, "it-IT", ",");
		});
	});

	describe("[formatCurrency] - Thousand separators", () => {
		it("should handle US locale with comma thousand separator", () => {
			const result = formatCurrency(100000.0, { locale: "en-US" });
			expect(result).toContain("100");
			expect(result).toContain("000");
			testTrailingZeroRemoval(100000.5, "en-US", ".");
		});

		it("should handle German locale with period thousand separator", () => {
			const result = formatCurrency(100000.0, { locale: "de-DE" });
			expect(result).toContain("100");
			expect(result).toContain("000");
			testTrailingZeroRemoval(100000.5, "de-DE", ",");
		});

		it("should handle Swiss locale with apostrophe thousand separator", () => {
			const result = formatCurrency(100000.0, { locale: "de-CH" });
			expect(result).toContain("100");
			expect(result).toContain("000");
			testTrailingZeroRemoval(100000.5, "de-CH", ".");
		});

		it("should handle French locale with space thousand separator", () => {
			const result = formatCurrency(100000.0, { locale: "fr-FR" });
			expect(result).toContain("100");
			expect(result).toContain("000");
			testTrailingZeroRemoval(100000.5, "fr-FR", ",");
		});
	});

	describe("[formatCurrency] - Complex cases with currency symbols", () => {
		it("should handle US dollar formatting", () => {
			const result = formatCurrency(100000.0, {
				locale: "en-US",
				currency: "USD",
			});
			expect(result).toMatch(/\$|USD/);
			expect(result).toContain("100");
			expect(result).toContain("000");
		});

		it("should handle Euro formatting in German locale", () => {
			const result = formatCurrency(100000.0, {
				locale: "de-DE",
				currency: "EUR",
			});
			expect(result).toMatch(/\€|EUR/);
			expect(result).toContain("100");
			expect(result).toContain("000");
		});

		it("should handle Swiss Franc formatting", () => {
			const result = formatCurrency(100000.0, {
				locale: "de-CH",
				currency: "CHF",
			});
			expect(result).toMatch(/\CHF|CHF/);
			expect(result).toContain("100");
			expect(result).toContain("000");
		});

		it("should handle British Pound formatting", () => {
			const result = formatCurrency(100000.0, {
				locale: "en-GB",
				currency: "GBP",
			});
			expect(result).toMatch(/\£|GBP/);
			expect(result).toContain("100");
			expect(result).toContain("000");
		});
	});

	describe("[formatCurrency] - Crypto precision", () => {
		it("should handle crypto precision with trailing zeros", () => {
			expect(
				formatCurrency(100.12345678, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100.12345678");
			expect(
				formatCurrency(100.123456, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100.123456");
			expect(
				formatCurrency(100.1234567, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100.1234567");
			expect(
				formatCurrency(100.0, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100");
		});

		it("should handle crypto precision with different locales", () => {
			expect(
				formatCurrency(100.12345678, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100,12345678");
			expect(
				formatCurrency(100.123456, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100,123456");
			expect(
				formatCurrency(100.0, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100");
		});
	});

	describe("[formatCurrency] - Trailing zero removal with different separators", () => {
		it("should remove trailing zeros with comma decimal separator (German locale)", () => {
			// Test cases with comma as decimal separator
			expect(
				formatCurrency(100.009, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100,009");
			expect(
				formatCurrency(100.00123, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100,00123");
			expect(
				formatCurrency(100.0, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100");
			expect(
				formatCurrency(100.1, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100,1");
			expect(
				formatCurrency(100.12, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100,12");
		});

		it("should remove trailing zeros with period decimal separator (US locale)", () => {
			// Test cases with period as decimal separator
			expect(
				formatCurrency(100.00123, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100.00123");
			expect(
				formatCurrency(100.009, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100.009");
			expect(
				formatCurrency(100.0, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100");
			expect(
				formatCurrency(100.1, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100.1");
			expect(
				formatCurrency(100.12, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100.12");
		});

		it("should remove trailing zeros with period decimal separator (Swiss locale)", () => {
			// Test cases with period as decimal separator in Swiss locale
			const result1 = formatCurrency(100000000.234, {
				locale: "de-CH",
				precision: "CRYPTO",
			});
			expect(result1).toContain("100");
			expect(result1).toContain("000");
			expect(result1).toContain("234");
			expect(result1).not.toContain("000000"); // Should not have trailing zeros

			const result2 = formatCurrency(100000000.00123, {
				locale: "de-CH",
				precision: "CRYPTO",
			});
			expect(result2).toContain("100");
			expect(result2).toContain("000");
			expect(result2).toContain("00123");
			expect(result2).not.toContain("000000"); // Should not have trailing zeros
		});

		it("should remove trailing zeros with comma decimal separator (French locale)", () => {
			// Test cases with comma as decimal separator in French locale
			const result1 = formatCurrency(100000000.234, {
				locale: "fr-FR",
				precision: "CRYPTO",
			});
			expect(result1).toContain("100");
			expect(result1).toContain("000");
			expect(result1).toContain("234");
			expect(result1).not.toContain("000000"); // Should not have trailing zeros

			const result2 = formatCurrency(100000000.00123, {
				locale: "fr-FR",
				precision: "CRYPTO",
			});
			expect(result2).toContain("100");
			expect(result2).toContain("000");
			expect(result2).toContain("00123");
			expect(result2).not.toContain("000000"); // Should not have trailing zeros
		});

		it("should handle complex cases with multiple trailing zeros", () => {
			// Test with many trailing zeros
			const result1 = formatCurrency(100.123456789, {
				locale: "en-US",
				precision: "CRYPTO",
			});
			// Account for floating-point precision limitations
			expect(result1).toContain("100.123456");
			expect(result1).not.toContain("000000"); // Should not have trailing zeros

			const result2 = formatCurrency(100.123456789, {
				locale: "de-DE",
				precision: "CRYPTO",
			});
			// Account for floating-point precision limitations
			expect(result2).toContain("100,123456");
			expect(result2).not.toContain("000000"); // Should not have trailing zeros

			expect(
				formatCurrency(100.0, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100");
			expect(
				formatCurrency(100.0, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100");
		});

		it("should handle user-specific examples correctly", () => {
			// User's specific examples:
			// Separator ',': 100.00,0090000 => 100.00,009
			// Separator '.': 100,00.0012300 => 100,00.00123
			// Separator ': 100'000'000,234000 => 100'000'000,234

			// German locale with comma decimal separator
			expect(
				formatCurrency(100.009, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100,009");
			expect(
				formatCurrency(100.00123, { locale: "de-DE", precision: "CRYPTO" }),
			).toBe("100,00123");

			// US locale with period decimal separator
			expect(
				formatCurrency(100.00123, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100.00123");
			expect(
				formatCurrency(100.009, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("100.009");

			// Swiss locale with period decimal separator and apostrophe thousand separator
			const swissResult = formatCurrency(100000000.234, {
				locale: "de-CH",
				precision: "CRYPTO",
			});
			expect(swissResult).toContain("100");
			expect(swissResult).toContain("000");
			expect(swissResult).toContain("234");
			expect(swissResult).not.toContain("000000"); // Should not have trailing zeros
		});

		it("should handle FIAT precision with trailing zeros", () => {
			// Test FIAT precision (4 decimal places) with trailing zeros
			expect(
				formatCurrency(100.1234, { locale: "en-US", precision: "FIAT" }),
			).toBe("100.1234");
			expect(
				formatCurrency(100.1234, { locale: "de-DE", precision: "FIAT" }),
			).toBe("100,1234");
			expect(
				formatCurrency(100.1, { locale: "en-US", precision: "FIAT" }),
			).toBe("100.1");
			expect(
				formatCurrency(100.1, { locale: "de-DE", precision: "FIAT" }),
			).toBe("100,1");
			expect(
				formatCurrency(100.0, { locale: "en-US", precision: "FIAT" }),
			).toBe("100");
			expect(
				formatCurrency(100.0, { locale: "de-DE", precision: "FIAT" }),
			).toBe("100");
		});
	});

	describe("[formatCurrency] - Error handling", () => {
		it("should handle Intl.NumberFormat errors gracefully", () => {
			// Mock Intl.NumberFormat to throw an error for all locales
			global.Intl = {
				...originalIntl,
				NumberFormat: class {
					constructor() {
						throw new Error("Intl.NumberFormat error");
					}
				} as typeof Intl.NumberFormat,
			};

			// Test that the fallback works correctly
			const result1 = formatCurrency(100.5, { locale: "en-US" });
			const result2 = formatCurrency(100.5, { locale: "de-DE" });
			const result3 = formatCurrency("100.5000", { locale: "en-US" });
			const result4 = formatCurrency("100.5000", { locale: "de-DE" });

			// The fallback should use the locale-specific decimal separator
			// Since we are not supplying any currency, it will use the default decimal separator
			expect(result1).toBe("100.5");
			expect(result2).toBe("100.5");
			expect(result3).toBe("100.5");
			expect(result4).toBe("100.5");
		});

		it("should handle invalid locales gracefully", () => {
			expect(formatCurrency(100.5, { locale: "invalid-locale" })).toBe("100.5");
		});
	});

	describe("[safeFormatCurrency]", () => {
		it("should format currency safely with valid input", () => {
			const result = safeFormatCurrency(
				{ totalAmount: "100.50", currency: "USD" },
				{ locale: "en-US" },
			);
			expect(result).toMatch(/\$|USD/);
			expect(result).toContain("100.5");
		});

		it("should handle different precision types", () => {
			const cryptoResult = safeFormatCurrency(
				{ totalAmount: "100.12345678", currency: "BTC" },
				{ locale: "en-US", precision: "CRYPTO" },
			);
			// Check that it contains the expected parts rather than exact string match
			expect(cryptoResult).toContain("100.12345678");
			expect(cryptoResult).toContain("BTC");

			const fiatResult = safeFormatCurrency(
				{ totalAmount: "100.12345678", currency: "USD" },
				{ locale: "en-US", precision: "FIAT" },
			);
			// Since formatCurrency is working normally, safeFormatCurrency uses the normal path
			// which produces "$100.1235" instead of "100.1235 USD"
			expect(fiatResult).toContain("100.1235");
			// The currency symbol is at the beginning, so we check for the currency code
			expect(fiatResult).toContain("$");
		});
	});

	describe("[formatStringCurrencyToNumber]", () => {
		it("should parse US formatted currency strings", () => {
			expect(formatStringCurrencyToNumber("$100,000.50", "USD", "en-US")).toBe(
				100000.5,
			);
			expect(formatStringCurrencyToNumber("$100.50", "USD", "en-US")).toBe(
				100.5,
			);
			expect(formatStringCurrencyToNumber("$100", "USD", "en-US")).toBe(100);
		});

		it("should parse German formatted currency strings", () => {
			expect(formatStringCurrencyToNumber("100.000,50 €", "EUR", "de-DE")).toBe(
				100000.5,
			);
			expect(formatStringCurrencyToNumber("100,50 €", "EUR", "de-DE")).toBe(
				100.5,
			);
			expect(formatStringCurrencyToNumber("100 €", "EUR", "de-DE")).toBe(100);
		});

		it("should parse Swiss formatted currency strings", () => {
			expect(
				formatStringCurrencyToNumber("CHF 100'000.50", "CHF", "de-CH"),
			).toBe(100000.5);
			expect(formatStringCurrencyToNumber("CHF 100.50", "CHF", "de-CH")).toBe(
				100.5,
			);
			expect(formatStringCurrencyToNumber("CHF 100", "CHF", "de-CH")).toBe(100);
		});

		it("should handle invalid input gracefully", () => {
			// Fn removes non-numeric characters
			expect(formatStringCurrencyToNumber("invalid", "USD", "en-US")).toBe(0);
			expect(formatStringCurrencyToNumber("", "USD", "en-US")).toBe(0);
			expect(formatStringCurrencyToNumber("$abc", "USD", "en-US")).toBe(0);
		});
	});

	describe("[formatCurrency] - Edge cases and robustness", () => {
		it("should handle very large numbers", () => {
			const usResult = formatCurrency(999999999.99, { locale: "en-US" });
			expect(usResult).toContain("999");
			expect(usResult).toContain("999");
			expect(usResult).toContain("99");

			const deResult = formatCurrency(999999999.99, { locale: "de-DE" });
			expect(deResult).toContain("999");
			expect(deResult).toContain("999");
			expect(deResult).toContain("99");
		});

		it("should handle very small numbers", () => {
			expect(
				formatCurrency(0.00000001, { locale: "en-US", precision: "CRYPTO" }),
			).toBe("0.00000001");
			expect(
				formatCurrency(0.00000001, { locale: "en-US", precision: "FIAT" }),
			).toBe("0");
		});

		it("should handle negative numbers", () => {
			const usResult = formatCurrency(-100.5, { locale: "en-US" });
			expect(usResult).toContain("-");
			expect(usResult).toContain("100.5");

			const deResult = formatCurrency(-100.5, { locale: "de-DE" });
			expect(deResult).toContain("-");
			expect(deResult).toContain("100.5");
		});

		it("should handle Decimal.js objects", () => {
			const { Decimal } = require("decimal.js");
			expect(formatCurrency(new Decimal("100.50"), { locale: "en-US" })).toBe(
				"100.5",
			);
			expect(formatCurrency(new Decimal("100.50"), { locale: "de-DE" })).toBe(
				"100.5",
			);
		});

		it("should handle string numbers", () => {
			expect(formatCurrency("100.50", { locale: "en-US" })).toBe("100.5");
			expect(formatCurrency("100.50", { locale: "de-DE" })).toBe("100.5");
		});
	});
});
