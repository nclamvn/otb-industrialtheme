'use client';

import { cn } from '@/lib/utils';
import { CardTabProps } from './types';
import { getHierarchyColor, getStatusColor } from './utils/hierarchy-colors';
import { formatCurrency, formatPercentage } from './utils/budget-calculations';
import { ChevronRight, ChevronDown } from 'lucide-react';

export function CardTab({
  node,
  onClick,
  isLast = false,
  isExpanded = false,
  depth = 0,
}: CardTabProps & { isExpanded?: boolean }) {
  const colors = getHierarchyColor(node.level);
  const statusColors = getStatusColor(node.status);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between',
        'px-4 py-3 transition-all duration-200',
        'hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'border-l-4',
        colors.tab,
        'text-white',
        !isLast && 'border-b border-white/20',
      )}
      style={{
        marginLeft: `${depth * 8}px`,
        width: `calc(100% - ${depth * 8}px)`,
      }}
      aria-expanded={isExpanded}
      aria-label={`${node.name} - ${formatCurrency(node.budget)}`}
    >
      {/* Left: Icon + Name */}
      <div className="flex items-center gap-3">
        <span className="text-lg" role="img" aria-hidden>
          {node.icon || colors.icon}
        </span>
        <span className="font-medium truncate max-w-[200px]">
          {node.name}
        </span>
        <span className={cn(
          'px-2 py-0.5 rounded text-xs font-medium',
          statusColors.badge,
        )}>
          {statusColors.icon} {node.status}
        </span>
      </div>

      {/* Right: Budget + Percentage + Chevron */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-semibold">
            {formatCurrency(node.budget)}
          </div>
          <div className="text-xs opacity-80">
            {formatPercentage(node.percentage)}
          </div>
        </div>

        <div className="w-6 h-6 flex items-center justify-center">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
      </div>
    </button>
  );
}

export default CardTab;
