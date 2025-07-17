'use client';

import { DateTime, type DateTimeFormatOptions } from 'luxon';

/**
 * Format a date string or date object to a locale string
 * @param date - The date string or date object to format
 * @param format - The format to use for the date string, see DateTimeFormatOptions
 * @returns The formatted date string
 * @example
 * formatDate('2021-01-01') // 'January 1, 2021'
 * formatDate(new Date()) // 'January 1, 2021'
 * formatDate('2021-01-01', DateTime.DATE_FULL) // 'January 1, 2021'
 */
export const formatDate = (
  date: string | Date | DateTime,
  {
    format,
    fromFormat,
    locale,
    relative = false,
  }: {
    format?: DateTimeFormatOptions;
    fromFormat?: string;
    locale?: string | null;
    relative?: boolean;
  } = {}
) => {
  if (!date) return '';
  let formattedDate: DateTime;
  if (typeof date === 'string') {
    if (fromFormat) {
      formattedDate = DateTime.fromFormat(date, fromFormat);
    } else {
      formattedDate = DateTime.fromISO(date);
    }
  } else if (date instanceof DateTime) {
    formattedDate = date;
  } else {
    formattedDate = DateTime.fromJSDate(date);
  }
  if (locale) {
    formattedDate = formattedDate.setLocale(locale);
  }

  return relative
    ? formattedDate.toRelative()
    : formattedDate.toLocaleString(format);
};
