'use client';

import { cn } from '@/lib/utils';
import { CardTabProps } from './types';
import {
  getLevelStyles,
  BudgetStatusBadge,
  formatBudgetCurrency,
  formatBudgetPercentage,
  BudgetCardStatus,
  BudgetLevel,
} from '@/components/ui/budget';
import { ChevronRight, ChevronDown } from 'lucide-react';

// Map node status to BudgetCardStatus
function mapStatus(status: string): BudgetCardStatus {
  const statusMap: Record<string, BudgetCardStatus> = {
    draft: 'draft',
    verified: 'verified',
    warning: 'warning',
    error: 'error',
    locked: 'locked',
  };
  return statusMap[status] || 'draft';
}

export function CardTab({
  node,
  onClick,
  isLast = false,
  isExpanded = false,
}: CardTabProps & { isExpanded?: boolean }) {
  // Use unified design system
  const level = Math.min(Math.max(node.level, 1), 5) as BudgetLevel;
  const levelStyles = getLevelStyles(level);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left',
        'p-4 transition-all duration-200', // Unified: p-4 (16px)
        'border border-slate-200 dark:border-neutral-800 rounded-xl mb-2', // Unified: rounded-xl (12px)
        'border-l-4', // Unified: border-l-4 (4px)
        levelStyles.band,
        levelStyles.bg,
        'shadow-sm hover:shadow-md', // Unified: shadow-sm default, shadow-md hover
        'hover:bg-amber-50/50 dark:hover:bg-amber-950/50 hover:border-amber-200 dark:hover:border-amber-800',
        'focus:outline-none focus:bg-amber-50/50 dark:focus:bg-amber-950/50 focus:border-amber-300 dark:focus:border-amber-700',
        'group',
      )}
      aria-expanded={isExpanded}
    >
      <div className="flex items-center gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: Name + Status */}
          <div className="flex items-center gap-2 mb-3">
            <span className="font-semibold text-slate-900 dark:text-neutral-100">
              {node.name}
            </span>
            <BudgetStatusBadge status={mapStatus(node.status)} />
          </div>

          {/* Bottom row: Large amount + percentage */}
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-neutral-100">
              {formatBudgetCurrency(node.budget)}
            </span>
            <span className="text-sm tabular-nums text-slate-500 dark:text-neutral-400">
              {formatBudgetPercentage(node.percentage)} of total
            </span>
          </div>
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400 dark:text-neutral-500 group-hover:text-slate-600 dark:group-hover:text-neutral-300" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400 dark:text-neutral-500 group-hover:text-slate-600 dark:group-hover:text-neutral-300" />
          )}
        </div>
      </div>
    </button>
  );
}

export default CardTab;
