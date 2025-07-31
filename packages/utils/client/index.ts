'use client';

import Decimal from 'decimal.js';

export * from './dates';
export * from './currencies';

export const copyToClipboard = (text: string) => {
  try {
    navigator?.clipboard?.writeText(text);
  } catch (error) {
    console.error(
      `Failed to copy, navigator is not available: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

export const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

export const formatNumber = (
  num?: number | string | null | Decimal,
  locale: string = 'en-US'
) => {
  if (!num) return 'N/A';
  const decimal = new Decimal(num);
  const asNum = decimal.toNumber();
  if (isNaN(asNum)) return 'N/A';
  return new Intl.NumberFormat(locale).format(asNum);
};
