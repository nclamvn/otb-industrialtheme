// i18n Module Index
export {
  locales,
  defaultLocale,
  localeNames,
  localeFlags,
  numberFormats,
  currencyFormats,
  dateFormats,
  dateTimeFormats,
  pathnames,
  isValidLocale,
  getLocaleFromPath,
  formatNumber,
  formatCurrency,
  formatDate,
  formatDateTime,
  getRelativeTime,
  type Locale,
} from './config';

export {
  Link,
  redirect,
  usePathname,
  useRouter,
  getLocalizedHref,
  removeLocaleFromPath,
  getAlternateLinks,
  navigationItems,
  bottomNavItems,
} from './navigation';

export {
  getLocale,
  getLocaleFromCookie,
  getLocaleFromHeader,
  setLocaleCookie,
} from './request';

// Server-side message utilities
export {
  errorMessages,
  aiMessages,
  getErrorMessage,
  getErrorMessageWithParams,
  getAlertTitle,
  getSeverityLabel,
  getActionText,
  type ErrorCode,
} from './server-messages';
