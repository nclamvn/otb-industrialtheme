'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Menu, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from './breadcrumb';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { NotificationBell } from '@/components/notifications';
import { useAIChatStore } from '@/stores/ai-chat-store';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('navigation');
  const { isOpen: isAIChatOpen, toggle: toggleAIChat } = useAIChatStore();

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
        {/* AI Assistant Button */}
        <button
          onClick={toggleAIChat}
          className={`flex items-center justify-center border-2 text-xs transition-all ${
            isAIChatOpen
              ? 'font-extrabold'
              : 'font-bold hover:font-extrabold'
          }`}
          style={{
            width: '26px',
            height: '26px',
            borderColor: '#B8860B',
            color: isAIChatOpen ? '#fff' : '#B8860B',
            backgroundColor: isAIChatOpen ? '#B8860B' : 'transparent',
            // @ts-expect-error CSS custom properties for hover
            '--hover-color': '#8B6914',
          }}
          onMouseEnter={(e) => {
            if (!isAIChatOpen) {
              e.currentTarget.style.color = '#6B4F0A';
              e.currentTarget.style.borderColor = '#6B4F0A';
            }
          }}
          onMouseLeave={(e) => {
            if (!isAIChatOpen) {
              e.currentTarget.style.color = '#B8860B';
              e.currentTarget.style.borderColor = '#B8860B';
            }
          }}
        >
          AI
        </button>

        {/* Language Switcher */}
        <div className="hidden sm:block">
          <LanguageSwitcher variant="icon" />
        </div>

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

        {/* Notifications - Far right */}
        <NotificationBell />
      </div>
    </header>
  );
}
