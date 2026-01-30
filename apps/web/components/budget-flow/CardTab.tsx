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
  Check,
  AlertTriangle,
  XCircle,
  Lock,
  FileEdit,
} from 'lucide-react';

// Map level to icon component
const LEVEL_ICONS: Record<HierarchyLevel, React.ElementType> = {
  0: Wallet,
  1: Tag,
  2: Users,
  3: Package,
  4: ShoppingBag,
  5: Ruler,
};

// Map status to icon component
const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: FileEdit,
  verified: Check,
  warning: AlertTriangle,
  error: XCircle,
  locked: Lock,
};

export function CardTab({
  node,
  onClick,
  isLast = false,
  isExpanded = false,
  depth = 0,
}: CardTabProps & { isExpanded?: boolean }) {
  const colors = getHierarchyColor(node.level);
  const statusColors = getStatusColor(node.status);

  const LevelIcon = LEVEL_ICONS[node.level] || Package;
  const StatusIcon = STATUS_ICONS[node.status] || FileEdit;

  const isRootLevel = node.level === 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between',
        'px-5 py-4 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
        colors.tab,
        colors.tabHover,
        colors.text,
        !isLast && 'border-b',
        colors.border,
      )}
      aria-expanded={isExpanded}
      aria-label={`${node.name} - ${formatCurrency(node.budget)}`}
    >
      {/* Left: Icon + Name + Status */}
      <div className="flex items-center gap-3">
        {/* Level Icon */}
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg',
          isRootLevel ? 'bg-white/10' : 'bg-slate-100',
        )}>
          <LevelIcon className={cn(
            'w-4 h-4',
            isRootLevel ? 'text-white' : 'text-slate-600'
          )} />
        </div>

        {/* Name */}
        <span className={cn(
          'font-semibold truncate max-w-[240px]',
          colors.text,
        )}>
          {node.name}
        </span>

        {/* Status Badge - Subtle */}
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
          statusColors.badge,
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', statusColors.dot)} />
          {node.status}
        </span>
      </div>

      {/* Right: Budget + Percentage + Chevron */}
      <div className="flex items-center gap-6">
        {/* Budget Info */}
        <div className="text-right">
          <div className={cn('font-bold text-lg', colors.text)}>
            {formatCurrency(node.budget)}
          </div>
          <div className={cn('text-xs', colors.textMuted)}>
            {formatPercentage(node.percentage)} of total
          </div>
        </div>

        {/* Chevron */}
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
          isRootLevel ? 'bg-white/10' : 'bg-slate-100',
        )}>
          {isExpanded ? (
            <ChevronDown className={cn(
              'w-5 h-5',
              isRootLevel ? 'text-white' : 'text-slate-600'
            )} />
          ) : (
            <ChevronRight className={cn(
              'w-5 h-5',
              isRootLevel ? 'text-white' : 'text-slate-600'
            )} />
          )}
        </div>
      </div>
    </button>
  );
}

export default CardTab;
