// Internationalization Configuration
import { routing } from '@/i18n/routing';

export const locales = routing.locales;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = routing.defaultLocale;

// Locale display names
export const localeNames: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

// Locale flags (emoji)
export const localeFlags: Record<Locale, string> = {
  vi: '🇻🇳',
  en: '🇺🇸',
};

// Number formatting
export const numberFormats: Record<Locale, Intl.NumberFormatOptions> = {
  vi: {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  en: {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
};

// Currency formatting
export const currencyFormats: Record<Locale, { currency: string; locale: string }> = {
  vi: {
    currency: 'VND',
    locale: 'vi-VN',
  },
  en: {
    currency: 'USD',
    locale: 'en-US',
  },
};

// Date formatting
export const dateFormats: Record<Locale, Intl.DateTimeFormatOptions> = {
  vi: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
  en: {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  },
};

// DateTime formatting
export const dateTimeFormats: Record<Locale, Intl.DateTimeFormatOptions> = {
  vi: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  en: {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  },
};

// Pathnames for localized routes
export const pathnames = {
  '/': '/',
  '/dashboard': '/dashboard',
  '/budget': '/budget',
  '/otb': '/otb',
  '/sku': '/sku',
  '/approvals': '/approvals',
  '/analytics': '/analytics',
  '/reports': '/reports',
  '/master-data': '/master-data',
  '/settings': '/settings',
  '/ai-assistant': '/ai-assistant',
  '/alerts': '/alerts',
  '/integrations': '/integrations',
  '/api-keys': '/api-keys',
} as const;

// Helper functions
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isValidLocale(segments[0])) {
    return segments[0];
  }
  return null;
}

// Format number based on locale
export function formatNumber(value: number, locale: Locale): string {
  const config = currencyFormats[locale];
  return new Intl.NumberFormat(config.locale, numberFormats[locale]).format(value);
}

// Format currency based on locale
export function formatCurrency(value: number, locale: Locale): string {
  const config = currencyFormats[locale];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: config.currency === 'VND' ? 0 : 2,
    maximumFractionDigits: config.currency === 'VND' ? 0 : 2,
  }).format(value);
}

// Format date based on locale
export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const config = currencyFormats[locale];
  return new Intl.DateTimeFormat(config.locale, dateFormats[locale]).format(d);
}

// Format datetime based on locale
export function formatDateTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const config = currencyFormats[locale];
  return new Intl.DateTimeFormat(config.locale, dateTimeFormats[locale]).format(d);
}

// Get relative time string
export function getRelativeTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffSeconds < 60) {
    return locale === 'vi' ? 'Vừa xong' : 'Just now';
  } else if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, 'minute');
  } else if (diffHours < 24) {
    return rtf.format(-diffHours, 'hour');
  } else if (diffDays < 7) {
    return rtf.format(-diffDays, 'day');
  } else if (diffWeeks < 4) {
    return rtf.format(-diffWeeks, 'week');
  } else if (diffMonths < 12) {
    return rtf.format(-diffMonths, 'month');
  } else {
    return rtf.format(-diffYears, 'year');
  }
}
