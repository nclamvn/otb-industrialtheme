import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { routing } from './routing';

export default getRequestConfig(async () => {
  let locale = routing.defaultLocale;

  // Priority: Cookie > Default
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
    if (localeCookie && routing.locales.includes(localeCookie as 'vi' | 'en')) {
      locale = localeCookie as 'vi' | 'en';
    }
  } catch {
    // Cookies might not be available in some contexts
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: locale === 'vi' ? 'Asia/Ho_Chi_Minh' : 'America/New_York',
    now: new Date(),
  };
});
