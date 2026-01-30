'use client';

import Link from 'next/link';
import {
  Plus,
  FileText,
  Package,
  DollarSign,
  Upload,
  Search,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

// Icon mapping for server component compatibility
const iconMap: Record<string, LucideIcon> = {
  Plus,
  FileText,
  Package,
  DollarSign,
  Upload,
  Search,
  Settings,
  Users,
};

export type QuickActionIconName = keyof typeof iconMap;

export interface QuickAction {
  href: string;
  icon: QuickActionIconName;
  title: string;
  description: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  description?: string;
}

// Unified color classes
const colorClasses = {
  default: 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300',
  primary: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  secondary: 'bg-slate-50 dark:bg-neutral-900 text-slate-600 dark:text-neutral-300',
  success: 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400',
  warning: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
};

export function QuickActions({
  actions,
  title,
  description,
}: QuickActionsProps) {
  const t = useTranslations('dashboard');
  const displayTitle = title || t('quickActions');
  const displayDescription = description || t('commonTasks');

  return (
    <div
      className={cn(
        // Unified: rounded-xl, shadow-sm, border-l-4
        'rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden',
        'shadow-sm border-l-4 border-l-slate-600'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{displayTitle}</h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400">{displayDescription}</p>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="grid gap-3">
          {actions.map((action) => {
            const Icon = iconMap[action.icon] || Plus;
            const iconColorClass = colorClasses[action.color || 'primary'];

            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  // Unified: rounded-xl, shadow-sm, hover:shadow-md
                  'flex items-center gap-3 rounded-xl border border-slate-200 dark:border-neutral-800 p-3',
                  'shadow-sm hover:shadow-md transition-all duration-200 group'
                )}
              >
                {/* Unified: w-10 h-10 rounded-xl icon container */}
                <div
                  className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                    iconColorClass
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100 truncate">{action.title}</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
