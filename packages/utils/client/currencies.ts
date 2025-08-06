import { z } from 'zod';
import { Decimal } from 'decimal.js';

export const formatCurrency = (
  value: string | number | Decimal,
  options: Intl.NumberFormatOptions & {
    locale: string;
    precision?: 'CRYPTO' | 'FIAT';
  } = { locale: 'en-US', precision: 'FIAT' }
) => {
  if (value === undefined || value === null) return value;
  const formated = new Decimal(value).toNumber();

  const locale = options.locale;
  const currency = options.currency;
  try {
    if (Intl) {
      const formatted = new Intl.NumberFormat(locale || 'en-US', {
        ...(currency && { style: 'currency', currency }),
        ...(options.precision === 'CRYPTO'
          ? {
              minimumFractionDigits: 0,
              maximumFractionDigits: 8,
            }
          : {
              minimumFractionDigits: 0,
              maximumFractionDigits: 4,
            }),
        ...options,
      }).format(formated);

      // Remove trailing zeros after decimal point
      return formatted.replace(/\.?0+$/, '');
    }
  } catch {
    const fixedValue = formated.toFixed(options.precision === 'CRYPTO' ? 8 : 4);
    const formatted = currency ? `${currency} ${fixedValue}` : fixedValue;

    // Remove trailing zeros after decimal point
    return formatted.replace(/\.?0+$/, '');
  }
};

export const safeFormatCurrency = (
  paidAmount: { totalAmount: string; currency: string },
  { locale, precision }: { locale: string; precision?: 'CRYPTO' | 'FIAT' } = {
    locale: 'en-US',
    precision: 'FIAT',
  }
) => {
  try {
    return formatCurrency(paidAmount.totalAmount, {
      locale,
      currency: paidAmount.currency,
      precision,
    });
  } catch {
    return `${Decimal(paidAmount.totalAmount).toFixed(
      precision === 'CRYPTO' ? 8 : 4
    )} ${paidAmount.currency}`;
  }
};

/**
 * Parses "CHF 100,000.12" to 100000.12 considering currency and locale, positions ,etc...
 */
export const formatStringCurrencyToNumber = (
  value: string,
  currency: string,
  locale: string
) => {
  // Get the format parts to understand the locale's number formatting
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).formatToParts(12345.67);

  // Extract the decimal and group separators used in this locale
  const decimalSeparator =
    parts.find((part) => part.type === 'decimal')?.value || '.';
  const groupSeparator =
    parts.find((part) => part.type === 'group')?.value || ',';

  // Remove currency symbol, spaces and group separators
  let cleanValue = value
    .replace(/[^0-9\-,.\s]/g, '') // Remove currency symbols and letters
    .replace(/\s/g, '') // Remove spaces
    .replace(new RegExp('\\' + groupSeparator, 'g'), ''); // Remove group separators

  // Replace the decimal separator with a period if it's different
  if (decimalSeparator !== '.') {
    cleanValue = cleanValue.replace(decimalSeparator, '.');
  }

  // Parse the cleaned string to a number
  const numericValue = Number(cleanValue);

  // Return NaN if parsing failed, otherwise return the number
  return isNaN(numericValue) ? NaN : numericValue;
};

export const getAsNumericAmountCurrency = (
  value: number,
  currency: string,
  locale: string = 'en-US'
) => {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
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
    required_error: 'Formatted value is required',
    invalid_type_error: 'Formatted value must be a string',
  }),
  value: z.string({
    required_error: 'Value is required',
    invalid_type_error: 'Value must be a string',
  }),
});

export type NumericAmount = z.infer<typeof NumericAmount>;

export const NumericAmountCurrency = NumericAmount.extend({
  currency: z.string().min(1).max(5),
});

export type NumericAmountCurrency = z.infer<typeof NumericAmountCurrency>;
