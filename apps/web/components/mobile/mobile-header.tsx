'use client';

import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Menu, Bell, Moon, Sun, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileHeaderProps {
  onMenuClick: () => void;
  onSearchClick?: () => void;
  title?: string;
}

export function MobileHeader({ onMenuClick, onSearchClick, title }: MobileHeaderProps) {
  const t = useTranslations('common');
  const tNav = useTranslations('navigation');
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4 md:hidden">
      {/* Menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">{t('menu') || 'Menu'}</span>
      </Button>

      {/* Title */}
      <div className="flex-1 truncate">
        <h1 className="text-base font-semibold truncate">
          {title || t('appName')}
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Search button */}
        {onSearchClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onSearchClick}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">{t('search')}</span>
          </Button>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">{tNav('notifications') || 'Notifications'}</span>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{tNav('toggleTheme')}</span>
        </Button>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {session?.user?.name ? getInitials(session.user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
              {tNav('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
