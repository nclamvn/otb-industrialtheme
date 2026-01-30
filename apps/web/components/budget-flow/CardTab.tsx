'use client';

import { cn } from '@/lib/utils';
import { CardTabProps, HierarchyLevel } from './types';
import { getHierarchyColor, getStatusColor } from './utils/hierarchy-colors';
import { formatCurrency, formatPercentage } from './utils/budget-calculations';
import {
  ChevronRight,
  ChevronDown,
  Wallet,
  Tag,
  Users,
  Package,
  ShoppingBag,
  Ruler,
} from 'lucide-react';

const LEVEL_ICONS: Record<HierarchyLevel, React.ElementType> = {
  0: Wallet,
  1: Tag,
  2: Users,
  3: Package,
  4: ShoppingBag,
  5: Ruler,
};

export function CardTab({
  node,
  onClick,
  isLast = false,
  isExpanded = false,
}: CardTabProps & { isExpanded?: boolean }) {
  const colors = getHierarchyColor(node.level);
  const statusColors = getStatusColor(node.status);
  const LevelIcon = LEVEL_ICONS[node.level] || Package;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3',
        'py-3 px-4 transition-colors duration-150',
        'hover:bg-slate-50/50',
        'focus:outline-none focus:bg-slate-50',
        'border-b border-slate-100',
      )}
      aria-expanded={isExpanded}
    >
      {/* Left Color Band */}
      <div className={cn(
        'self-stretch rounded-full',
        colors.accent,
        colors.accentWidth,
      )} />

      {/* Icon */}
      <LevelIcon className={cn('w-4 h-4 flex-shrink-0', colors.textMuted)} />

      {/* Name */}
      <span className={cn('font-medium flex-1 text-left', colors.text)}>
        {node.name}
      </span>

      {/* Status dot */}
      <div className="flex items-center gap-1.5">
        <span className={cn('w-1.5 h-1.5 rounded-full', statusColors.dot)} />
        <span className={cn('text-xs', statusColors.badge)}>{node.status}</span>
      </div>

      {/* Budget */}
      <div className="text-right ml-4">
        <div className={cn('font-semibold tabular-nums', colors.text)}>
          {formatCurrency(node.budget)}
        </div>
        <div className={cn('text-xs tabular-nums', colors.textMuted)}>
          {formatPercentage(node.percentage)}
        </div>
      </div>

      {/* Chevron */}
      {isExpanded ? (
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0', colors.textMuted)} />
      ) : (
        <ChevronRight className={cn('w-4 h-4 flex-shrink-0', colors.textMuted)} />
      )}
    </button>
  );
}

export default CardTab;
