'use client';

import { formatDate, formatDateTime, getRelativeTime, type Locale } from '@/lib/i18n/config';

interface FormattedDateProps {
  value: Date | string;
  locale: Locale;
  type?: 'date' | 'datetime' | 'relative';
}

export function FormattedDate({
  value,
  locale,
  type = 'date',
}: FormattedDateProps) {
  if (type === 'datetime') {
    return <>{formatDateTime(value, locale)}</>;
  }

  if (type === 'relative') {
    return <>{getRelativeTime(value, locale)}</>;
  }

  return <>{formatDate(value, locale)}</>;
}
