'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Menu, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from './breadcrumb';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { NotificationBell } from '@/components/notifications';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('navigation');

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b bg-background px-3 md:px-4">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">{t('toggleMenu')}</span>
      </Button>

      {/* Breadcrumb */}
      <div className="flex-1">
        <Breadcrumb />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="hidden sm:block">
          <LanguageSwitcher variant="icon" />
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('toggleTheme')}</span>
        </Button>
      </div>
    </header>
  );
}
