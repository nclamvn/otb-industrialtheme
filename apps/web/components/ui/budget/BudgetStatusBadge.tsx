'use client';

import { cn } from '@/lib/utils';
import { Check, FileEdit, AlertTriangle, XCircle, Lock } from 'lucide-react';
import { BudgetCardStatus } from './types';

interface BudgetStatusBadgeProps {
  status: BudgetCardStatus;
  className?: string;
}

const statusConfig: Record<BudgetCardStatus, {
  icon: typeof Check;
  label: string;
  className: string;
}> = {
  verified: {
    icon: Check,
    label: 'Verified',
    className: 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  },
  draft: {
    icon: FileEdit,
    label: 'Draft',
    className: 'text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    className: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    className: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  },
  locked: {
    icon: Lock,
    label: 'Locked',
    className: 'text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 border-slate-300 dark:border-neutral-600',
  },
};

export function BudgetStatusBadge({ status, className }: BudgetStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
