// Server-side locale request utilities
import { cookies, headers } from 'next/headers';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { locales, defaultLocale, type Locale } from './config';

const LOCALE_COOKIE = 'NEXT_LOCALE';

// Get locale from cookie
export async function getLocaleFromCookie(): Promise<Locale | null> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE);

  if (localeCookie && locales.includes(localeCookie.value as Locale)) {
    return localeCookie.value as Locale;
  }

  return null;
}

// Get locale from Accept-Language header
export async function getLocaleFromHeader(): Promise<Locale> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  const negotiatorHeaders = { 'accept-language': acceptLanguage };
  const negotiator = new Negotiator({ headers: negotiatorHeaders });
  const languages = negotiator.languages();

  try {
    return match(languages, locales, defaultLocale) as Locale;
  } catch {
    return defaultLocale;
  }
}

// Get the current locale (cookie > header > default)
export async function getLocale(): Promise<Locale> {
  const cookieLocale = await getLocaleFromCookie();
  if (cookieLocale) {
    return cookieLocale;
  }

  return getLocaleFromHeader();
}

// Set locale cookie
export async function setLocaleCookie(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
}
