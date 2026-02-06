// lib/utils/number-helpers.ts
// Safe number conversion utilities for Prisma Decimal and other types

/**
 * Safely convert Prisma Decimal or any value to a number.
 * Handles: number, string, null, undefined, Prisma Decimal objects
 * @param value - The value to convert
 * @param defaultValue - Default value if conversion fails (default: 0)
 * @returns A number
 */
export function toNumber(value: unknown, defaultValue: number = 0): number {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return defaultValue;
  }

  // Already a number
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }

  // String - parse it
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

  // Handle BigInt
  if (typeof value === 'bigint') {
    return Number(value);
  }

  // Last resort - try Number()
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
 * Format number with thousands separator
 */
export function formatNumber(value: unknown): string {
  const num = toNumber(value);
  return new Intl.NumberFormat('vi-VN').format(num);
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
