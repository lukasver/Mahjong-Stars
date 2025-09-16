import { Decimal } from "decimal.js";
import { z } from "zod";

export const formatCurrency = (
	value: string | number | Decimal,
	options: Intl.NumberFormatOptions & {
		locale: string;
		precision?: "CRYPTO" | "FIAT" | number;
	} = { locale: "en-US", precision: "FIAT" },
) => {
	if (value === undefined || value === null) return value;
	let toFormat: number = NaN;
	try {
		toFormat = new Decimal(value).toNumber();
	} catch {
		toFormat = formatStringCurrencyToNumber(
			String(value),
			options.currency,
			options.locale,
		);
	}

	const locale = options.locale;
	const currency = options.currency;
	try {
		if (!options.precision) {
			throw "format as crypto";
		}
		if (Intl) {
			const formatted = new Intl.NumberFormat(locale || "en-US", {
				...(currency && { style: "currency", currency }),
				...(options.precision === "CRYPTO"
					? {
							minimumFractionDigits: 0,
							maximumFractionDigits: 8,
						}
					: {
							minimumFractionDigits: 0,
							maximumFractionDigits:
								typeof options.precision === "number" ? options.precision : 4,
						}),
				...options,
			}).format(toFormat);

			return formatted;
		}
	} catch {
		if (Number.isNaN(toFormat)) {
			return "NaN";
		}
		const fixedValue = formatToDigits(toFormat);
		const formatted = currency ? `${currency} ${fixedValue}` : fixedValue;

		return formatted;
	}
};

export const safeFormatCurrency = (
	paidAmount: { totalAmount: string; currency: string },
	{
		locale,
		precision,
	}: { locale: string; precision?: "CRYPTO" | "FIAT" | number } = {
		locale: "en-US",
		precision: "FIAT",
	},
) => {
	try {
		return formatCurrency(paidAmount.totalAmount, {
			locale,
			currency: paidAmount.currency,
			precision,
		});
	} catch {
		return `${formatToDigits(paidAmount.totalAmount, precision)} ${paidAmount.currency}`;
	}
};

const formatToDigits = (
	v: string | number,
	_precision: "CRYPTO" | "FIAT" | number = 0,
) => {
	const precision =
		{
			CRYPTO: 8,
			FIAT: 4,
		}[_precision] || (_precision as number);
	if (!precision) {
		return Decimal(v).toSignificantDigits().toString();
	} else {
		return Decimal(v).toFixed(precision);
	}
};

/**
 * Parses "CHF 100,000.12" to 100000.12 considering currency and locale, positions ,etc...
 */
export const formatStringCurrencyToNumber = (
	value: string,
	currency: string | undefined,
	locale: string,
) => {
	// Get the format parts to understand the locale's number formatting
	const parts = new Intl.NumberFormat(locale, {
		...(currency && { style: "currency", currency }),
	}).formatToParts(12345.67);

	// Extract the decimal and group separators used in this locale
	const decimalSeparator =
		parts.find((part) => part.type === "decimal")?.value || ".";
	const groupSeparator =
		parts.find((part) => part.type === "group")?.value || ",";

	// Remove currency symbol, spaces and group separators
	let cleanValue = value
		.replace(/[^0-9\-,.\s]/g, "") // Remove currency symbols and letters
		.replace(/\s/g, "") // Remove spaces
		.replace(new RegExp("\\" + groupSeparator, "g"), ""); // Remove group separators

	// Replace the decimal separator with a period if it's different
	if (decimalSeparator !== ".") {
		cleanValue = cleanValue.replace(decimalSeparator, ".");
	}

	// Parse the cleaned string to a number
	const numericValue = Number(cleanValue);

	// Return NaN if parsing failed, otherwise return the number
	return isNaN(numericValue) ? NaN : numericValue;
};

export const getAsNumericAmountCurrency = (
	value: number,
	currency: string,
	locale: string = "en-US",
) => {
	const formatted = new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
	}).format(value);
	return NumericAmountCurrency.parse({
		value: value.toString(),
		currency,
		float: value,
		formatted,
	});
};

export const NumericAmount = z.object({
	// Since prisma rounds JSON numeric values if they are flots
	// This is a workaround to ensure that the value is a number when parsing
	float: z.coerce.number().nullable(),
	formatted: z.string({
		required_error: "Formatted value is required",
		invalid_type_error: "Formatted value must be a string",
	}),
	value: z.string({
		required_error: "Value is required",
		invalid_type_error: "Value must be a string",
	}),
});

export type NumericAmount = z.infer<typeof NumericAmount>;

export const NumericAmountCurrency = NumericAmount.extend({
	currency: z.string().min(1).max(5),
});

export type NumericAmountCurrency = z.infer<typeof NumericAmountCurrency>;
