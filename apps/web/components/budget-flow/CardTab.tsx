'use client';

import { cn } from '@/lib/utils';
import { CardTabProps, HierarchyLevel } from './types';
import { getHierarchyColor, getStatusColor } from './utils/hierarchy-colors';
import { formatCurrency, formatPercentage } from './utils/budget-calculations';
import { ChevronRight, ChevronDown } from 'lucide-react';

export function CardTab({
  node,
  onClick,
  isLast = false,
  isExpanded = false,
}: CardTabProps & { isExpanded?: boolean }) {
  const colors = getHierarchyColor(node.level);
  const statusColors = getStatusColor(node.status);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left',
        'p-5 transition-all duration-200',
        'bg-white border border-slate-200 rounded-xl mb-2',
        'hover:bg-amber-50/50 hover:border-amber-200',
        'focus:outline-none focus:bg-amber-50/50 focus:border-amber-300',
        'group',
      )}
      aria-expanded={isExpanded}
    >
      <div className="flex items-start gap-4">
        {/* Left Color Band */}
        <div className={cn(
          'w-1 self-stretch rounded-full flex-shrink-0',
          colors.accent,
        )} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: Name + Status */}
          <div className="flex items-center gap-2 mb-3">
            <span className={cn('font-medium', colors.text)}>
              {node.name}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full', statusColors.dot)} />
              <span className={cn('text-xs', statusColors.badge)}>{node.status}</span>
            </div>
          </div>

          {/* Bottom row: Large amount */}
          <div className="flex items-baseline justify-between">
            <span className={cn('text-2xl font-bold tracking-tight tabular-nums', colors.text)}>
              {formatCurrency(node.budget)}
            </span>
            <span className={cn('text-sm tabular-nums', colors.textMuted)}>
              {formatPercentage(node.percentage)} of total
            </span>
          </div>
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 pt-1">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
          )}
        </div>
      </div>
    </button>
  );
}

export default CardTab;
