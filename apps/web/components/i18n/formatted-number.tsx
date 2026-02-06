'use client';

import { formatNumber, formatCurrency, type Locale } from '@/lib/i18n/config';

interface FormattedNumberProps {
  value: number;
  locale: Locale;
  type?: 'number' | 'currency' | 'percent';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function FormattedNumber({
  value,
  locale,
  type = 'number',
  minimumFractionDigits: _minimumFractionDigits,
  maximumFractionDigits: _maximumFractionDigits,
}: FormattedNumberProps) {
  if (type === 'currency') {
    return <>{formatCurrency(value, locale)}</>;
  }

  if (type === 'percent') {
    const percentValue = value * 100;
    return (
      <>
        {formatNumber(percentValue, locale)}%
      </>
    );
  }

  return <>{formatNumber(value, locale)}</>;
}
