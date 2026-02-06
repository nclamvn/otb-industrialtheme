'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  DollarSign,
  ShoppingBag,
  CheckSquare,
  MoreHorizontal,
} from 'lucide-react';

const bottomNavItems = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'budget', href: '/budget', icon: DollarSign },
  { key: 'otb', href: '/otb-analysis', icon: ShoppingBag },
  { key: 'approvals', href: '/approvals', icon: CheckSquare },
  { key: 'more', href: '#more', icon: MoreHorizontal },
] as const;

interface BottomNavProps {
  onMoreClick?: () => void;
  locale?: string;
}

export function BottomNav({ onMoreClick }: BottomNavProps) {
  const t = useTranslations('navigation');
  const pathname = usePathname();

  // Check if current path matches
  const isActive = (href: string) => {
    if (href === '#more') return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          if (item.key === 'more') {
            return (
              <button
                key={item.key}
                onClick={onMoreClick}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-medium transition-colors',
                  'text-muted-foreground active:text-primary'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{t('more')}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-medium transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-primary'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', active && 'text-primary')} />
                {active && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </div>
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
