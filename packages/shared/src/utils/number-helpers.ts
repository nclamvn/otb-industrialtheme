/**
 * Safely convert Prisma Decimal or any value to a number.
 * Handles: number, string, null, undefined, Prisma Decimal objects
 */
export function toNumber(value: unknown, defaultValue: number = 0): number {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  // Handle Prisma Decimal objects (they have a toNumber method)
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    try {
      const num = (value as { toNumber: () => number }).toNumber();
      return isNaN(num) ? defaultValue : num;
    } catch {
      return defaultValue;
    }
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  const converted = Number(value);
  return isNaN(converted) ? defaultValue : converted;
}

/**
 * Safely convert to integer
 */
export function toInt(value: unknown, defaultValue: number = 0): number {
  return Math.round(toNumber(value, defaultValue));
}

/**
 * Format number as currency (VND)
 */
export function formatCurrencyVND(value: unknown): string {
  const num = toNumber(value);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format number as currency (USD)
 */
export function formatCurrencyUSD(value: unknown): string {
  const num = toNumber(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: unknown, locale: string = 'vi-VN'): string {
  const num = toNumber(value);
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format as percentage
 */
export function formatPercent(value: unknown, decimals: number = 1): string {
  const num = toNumber(value);
  return `${num.toFixed(decimals)}%`;
}

/**
 * Safely calculate percentage
 */
export function calculatePercent(
  part: unknown,
  total: unknown,
  decimals: number = 2
): number {
  const partNum = toNumber(part);
  const totalNum = toNumber(total);

  if (totalNum === 0) return 0;

  const percent = (partNum / totalNum) * 100;
  const multiplier = Math.pow(10, decimals);
  return Math.round(percent * multiplier) / multiplier;
}

/**
 * Round to decimal places
 */
export function roundTo(value: unknown, decimals: number = 2): number {
  const num = toNumber(value);
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
}
