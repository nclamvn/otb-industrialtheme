'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LucideIcon, Home, ShoppingBag, BarChart3, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface NavItem {
  label: string;
  labelVi: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface MobileBottomNavProps {
  items?: NavItem[];
  locale?: 'en' | 'vi';
  className?: string;
}

// ════════════════════════════════════════
// Default Nav Items
// ════════════════════════════════════════

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Home', labelVi: 'Trang chủ', href: '/', icon: Home },
  { label: 'OTB', labelVi: 'OTB', href: '/otb-plans', icon: ShoppingBag },
  { label: 'Reports', labelVi: 'Báo cáo', href: '/reports', icon: BarChart3 },
  { label: 'Alerts', labelVi: 'Thông báo', href: '/notifications', icon: Bell },
  { label: 'Profile', labelVi: 'Cá nhân', href: '/profile', icon: User },
];

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function MobileBottomNav({
  items = DEFAULT_NAV_ITEMS,
  locale = 'vi',
  className,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-background/95 backdrop-blur-lg border-t border-border',
        'safe-area-pb',
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full relative',
                'transition-colors touch-manipulation',
                isActive ? 'text-[#B8860B]' : 'text-muted-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-12 h-1 rounded-full bg-[#B8860B]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] font-medium mt-1">
                {locale === 'vi' ? item.labelVi : item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
export type { NavItem, MobileBottomNavProps };
