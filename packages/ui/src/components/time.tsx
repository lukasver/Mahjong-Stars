'use client';

import { formatDate } from '@mjs/utils/client';
import { DateTime } from 'luxon';

export type TimeProps = {
  date: string | DateTime | Date;
  format?: Intl.DateTimeFormatOptions;
  locale?: string;
  className?: string;
  relative?: boolean;
};

/**
 * This is used to avoid hydration issues on NextJS due to locale differences between server & client time
 * should always be imported with NextJS Dynamic import and avoid SSR
 * @example const Time = dynamic(() => import("@smat/ui/components/time"), { ssr: false, loading: () => <Skeleton className="h-4 w-full" />, })
 * @param date should be an ISO string date or a Luxon DateTime object
 * @param locale optional locale string to format the date in a specific locale
 * @returns formated date as string
 */
export const Time: React.FC<TimeProps> = ({
  date,
  format = DateTime.DATETIME_MED,
  locale,
  relative,
  ...props
}) => {
  if (!date || typeof window === 'undefined') return null;

  const formatedDate = formatDate(date, { locale, format, relative });

  return <time {...props}>{formatedDate}</time>;
};
