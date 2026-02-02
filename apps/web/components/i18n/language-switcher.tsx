'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  locale?: string;
  variant?: 'default' | 'compact' | 'icon';
}

export function LanguageSwitcher({ locale: propLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const intlLocale = useLocale();

  const currentLocale = (propLocale || intlLocale) as Locale;

  // Sync localStorage with cookie on mount
  useEffect(() => {
    const storedLocale = localStorage.getItem('locale');
    if (storedLocale && storedLocale !== currentLocale) {
      // If localStorage differs, update cookie and refresh
      document.cookie = `NEXT_LOCALE=${storedLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      router.refresh();
    }
  }, []);

  const switchToLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale || isPending) return;

    // Persist to both cookie and localStorage
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    localStorage.setItem('locale', newLocale);

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md p-0.5',
        'transition-all duration-200',
        isPending && 'opacity-50 cursor-wait'
      )}
    >
      <button
        onClick={() => switchToLocale('en')}
        disabled={isPending}
        className={cn(
          'px-2 py-1 text-xs rounded transition-all duration-200',
          currentLocale === 'en'
            ? 'text-foreground font-bold'
            : 'text-muted-foreground font-normal hover:font-bold hover:text-foreground'
        )}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-muted-foreground/50 text-xs select-none">|</span>
      <button
        onClick={() => switchToLocale('vi')}
        disabled={isPending}
        className={cn(
          'px-2 py-1 text-xs rounded transition-all duration-200',
          currentLocale === 'vi'
            ? 'text-foreground font-bold'
            : 'text-muted-foreground font-normal hover:font-bold hover:text-foreground'
        )}
        aria-label="Switch to Vietnamese"
      >
        VN
      </button>
    </div>
  );
}
