'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-6: MobileTabBar — Bottom Navigation Tab Bar
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Image,
  FileSpreadsheet,
  Users,
  Bell,
  LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ─── Tab Item Type ──────────────────────────────────────────────────────────────
export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  disabled?: boolean;
}

// ─── Props ──────────────────────────────────────────────────────────────────────
interface MobileTabBarProps {
  tabs: TabItem[];
  className?: string;
}

// ─── Mobile Tab Bar Component ───────────────────────────────────────────────────
export function MobileTabBar({ tabs, className }: MobileTabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t md:hidden',
        'safe-area-pb',
        className
      )}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.disabled ? '#' : tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full relative transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
                tab.disabled && 'opacity-50 pointer-events-none'
              )}
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}

              {/* Icon */}
              <div className="relative">
                <Icon className={cn('w-5 h-5', isActive && 'scale-110 transition-transform')} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={cn('text-[10px] mt-1', isActive && 'font-medium')}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Default Tab Sets ───────────────────────────────────────────────────────────
export const DEFAULT_TABS: TabItem[] = [
  { id: 'home', label: 'Trang chủ', icon: Home, href: '/' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'products', label: 'Sản phẩm', icon: Package, href: '/products' },
  { id: 'analytics', label: 'Phân tích', icon: BarChart3, href: '/analytics' },
  { id: 'settings', label: 'Cài đặt', icon: Settings, href: '/settings' },
];

export const PLANNER_TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'otb', label: 'OTB', icon: FileSpreadsheet, href: '/otb-management' },
  { id: 'wssi', label: 'WSSI', icon: BarChart3, href: '/wssi' },
  { id: 'gallery', label: 'Gallery', icon: Image, href: '/gallery' },
  { id: 'settings', label: 'Cài đặt', icon: Settings, href: '/settings' },
];

export const ADMIN_TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'users', label: 'Người dùng', icon: Users, href: '/admin/users' },
  { id: 'notifications', label: 'Thông báo', icon: Bell, href: '/notifications', badge: 3 },
  { id: 'analytics', label: 'Phân tích', icon: BarChart3, href: '/analytics' },
  { id: 'settings', label: 'Cài đặt', icon: Settings, href: '/settings' },
];

// ─── Tab Bar with Custom Middle Button ──────────────────────────────────────────
interface MobileTabBarWithActionProps {
  tabs: TabItem[];
  centerAction?: {
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
  };
  className?: string;
}

export function MobileTabBarWithAction({
  tabs,
  centerAction,
  className,
}: MobileTabBarWithActionProps) {
  const pathname = usePathname();
  const leftTabs = tabs.slice(0, Math.floor(tabs.length / 2));
  const rightTabs = tabs.slice(Math.floor(tabs.length / 2));

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t md:hidden',
        'safe-area-pb',
        className
      )}
    >
      <div className="flex items-center justify-around h-16 relative">
        {/* Left Tabs */}
        {leftTabs.map((tab) => (
          <TabLink key={tab.id} tab={tab} pathname={pathname} />
        ))}

        {/* Center Action Button */}
        {centerAction && (
          <button
            onClick={centerAction.onClick}
            className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
          >
            {centerAction.icon}
          </button>
        )}

        {/* Right Tabs */}
        {rightTabs.map((tab) => (
          <TabLink key={tab.id} tab={tab} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}

// ─── Tab Link Component ─────────────────────────────────────────────────────────
interface TabLinkProps {
  tab: TabItem;
  pathname: string;
}

function TabLink({ tab, pathname }: TabLinkProps) {
  const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
  const Icon = tab.icon;

  return (
    <Link
      href={tab.disabled ? '#' : tab.href}
      className={cn(
        'flex flex-col items-center justify-center flex-1 h-full relative transition-colors',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        tab.disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
      )}
      <div className="relative">
        <Icon className={cn('w-5 h-5', isActive && 'scale-110 transition-transform')} />
        {tab.badge !== undefined && tab.badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
            {tab.badge > 99 ? '99+' : tab.badge}
          </span>
        )}
      </div>
      <span className={cn('text-[10px] mt-1', isActive && 'font-medium')}>{tab.label}</span>
    </Link>
  );
}

export default MobileTabBar;
