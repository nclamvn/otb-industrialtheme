// Localized Navigation Utilities - Uses next-intl v4 API
import { Link, redirect, usePathname, useRouter, getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

// Re-export navigation utilities
export { Link, redirect, usePathname, useRouter, getPathname };

const locales = routing.locales;

// Generate localized href
export function getLocalizedHref(href: string, locale: string): string {
  // If href already starts with a locale, return as is
  for (const loc of locales) {
    if (href.startsWith(`/${loc}/`) || href === `/${loc}`) {
      return href;
    }
  }

  // Add locale prefix
  if (href.startsWith('/')) {
    return `/${locale}${href}`;
  }

  return `/${locale}/${href}`;
}

// Remove locale from pathname
export function removeLocaleFromPath(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
    if (pathname === `/${locale}`) {
      return '/';
    }
  }
  return pathname;
}

// Get alternate locale links for SEO
export function getAlternateLinks(pathname: string): { locale: string; href: string }[] {
  const pathWithoutLocale = removeLocaleFromPath(pathname);

  return locales.map((locale) => ({
    locale,
    href: getLocalizedHref(pathWithoutLocale, locale),
  }));
}

// Navigation items with translations
export const navigationItems = [
  { key: 'dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'budget', href: '/budget', icon: 'Wallet' },
  { key: 'otb', href: '/otb', icon: 'ShoppingBag' },
  { key: 'sku', href: '/sku', icon: 'Package' },
  { key: 'approvals', href: '/approvals', icon: 'CheckSquare' },
  { key: 'analytics', href: '/analytics', icon: 'BarChart3' },
  { key: 'reports', href: '/reports', icon: 'FileText' },
  { key: 'masterData', href: '/master-data', icon: 'Database' },
  { key: 'aiAssistant', href: '/ai-assistant', icon: 'Bot' },
  { key: 'predictiveAlerts', href: '/alerts', icon: 'Bell' },
  { key: 'integrations', href: '/integrations', icon: 'Plug' },
  { key: 'apiKeys', href: '/api-keys', icon: 'Key' },
  { key: 'settings', href: '/settings', icon: 'Settings' },
] as const;

// Bottom navigation items for mobile
export const bottomNavItems = [
  { key: 'dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'budget', href: '/budget', icon: 'Wallet' },
  { key: 'otb', href: '/otb', icon: 'ShoppingBag' },
  { key: 'approvals', href: '/approvals', icon: 'CheckSquare' },
  { key: 'settings', href: '/settings', icon: 'Settings' },
] as const;
