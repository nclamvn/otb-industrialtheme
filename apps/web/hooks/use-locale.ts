'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition, useCallback } from 'react';
import { locales, type Locale, localeNames, localeFlags } from '@/lib/i18n/config';

export function useLocale() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Extract locale from pathname
  const currentLocale = ((): Locale => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
      return segments[0] as Locale;
    }
    return 'vi'; // Default locale
  })();

  // Switch to a different locale
  const switchLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === currentLocale) return;

      // Replace the locale in the pathname
      const segments = pathname.split('/').filter(Boolean);
      if (locales.includes(segments[0] as Locale)) {
        segments[0] = newLocale;
      } else {
        segments.unshift(newLocale);
      }

      const newPath = '/' + segments.join('/');

      // Set cookie for middleware
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

      startTransition(() => {
        router.push(newPath);
        router.refresh();
      });
    },
    [currentLocale, pathname, router]
  );

  // Get localized path
  const getLocalizedPath = useCallback(
    (path: string): string => {
      if (path.startsWith('/')) {
        // Check if path already has locale
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
          return path;
        }
        return `/${currentLocale}${path}`;
      }
      return `/${currentLocale}/${path}`;
    },
    [currentLocale]
  );

  // Get path without locale
  const getPathWithoutLocale = useCallback((path: string): string => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
      return '/' + segments.slice(1).join('/') || '/';
    }
    return path;
  }, []);

  return {
    locale: currentLocale,
    locales,
    localeName: localeNames[currentLocale],
    localeFlag: localeFlags[currentLocale],
    isPending,
    switchLocale,
    getLocalizedPath,
    getPathWithoutLocale,
  };
}
