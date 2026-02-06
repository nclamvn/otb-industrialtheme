'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bell, Settings, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/wssi', label: 'WSSI' },
  { href: '/otb', label: 'OTB' },
  { href: '/kpi', label: 'KPI' },
  { href: '/clearance', label: 'Clearance' },
  { href: '/replenishment', label: 'Repl' },
  { href: '/forecasting', label: 'Forecast' },
];

export function IndustrialHeader() {
  const pathname = usePathname();

  return (
    <header className="h-header bg-surface border-b border-border flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Logo + Nav */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-md text-content">DAFC OTB</span>
        </Link>

        {/* Main Nav */}
        <nav className="flex items-center">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-content border-b-2 border-accent -mb-[1px]'
                    : 'text-content-secondary hover:text-content'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Alerts */}
        <button className="ind-btn ind-btn-ghost ind-btn-icon relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-status-critical text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Settings */}
        <button className="ind-btn ind-btn-ghost ind-btn-icon">
          <Settings className="h-4 w-4" />
        </button>

        {/* User */}
        <button className="ind-btn ind-btn-ghost ind-btn-icon">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
