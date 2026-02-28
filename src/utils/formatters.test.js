import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, generateSeasons } from './formatters';

describe('formatCurrency', () => {
  it('should format null/undefined as 0', () => {
    expect(formatCurrency(null)).toContain('0');
    expect(formatCurrency(undefined)).toContain('0');
  });

  it('should format VND in abbreviated form', () => {
    expect(formatCurrency(1500000000)).toContain('tỷ');
    expect(formatCurrency(5000000)).toContain('tr');
    expect(formatCurrency(50000)).toContain('K');
  });

  it('should format VND in full form', () => {
    const result = formatCurrency(1000000, { full: true });
    expect(result).toMatch(/₫|VND/);
  });

  it('should format negative values', () => {
    const result = formatCurrency(-5000000);
    expect(result).toContain('-');
    expect(result).toContain('tr');
  });

  it('should format USD', () => {
    const result = formatCurrency(25000000, { currency: 'USD' });
    expect(result).toContain('$');
    expect(result).toContain('K');
  });

  it('should handle string values', () => {
    const result = formatCurrency('5000000');
    expect(result).toContain('tr');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });
});

describe('formatDate', () => {
  it('should format valid date string', () => {
    const result = formatDate('2025-01-15');
    expect(result).toBe('15/01/2025');
  });

  it('should return dash for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('should return dash for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('generateSeasons', () => {
  it('should generate pre and main seasons', () => {
    const result = generateSeasons('SS', 2025);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('pre');
    expect(result[1].type).toBe('main');
    expect(result[0].fiscalYear).toBe(2025);
  });
});
