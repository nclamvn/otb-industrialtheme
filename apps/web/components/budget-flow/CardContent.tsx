'use client';

import { cn } from '@/lib/utils';
import { BudgetNode, ProductData, SizeData } from './types';
import { getHierarchyColor } from './utils/hierarchy-colors';
import {
  formatCurrency,
  formatPercentage,
  calculateAllocation,
} from './utils/budget-calculations';

interface CardContentProps {
  node: BudgetNode;
  children?: React.ReactNode;
  onProductUpdate?: (productId: string, data: Partial<ProductData>) => void;
  onSizeUpdate?: (productId: string, sizeIndex: number, field: keyof SizeData, value: number) => void;
}

export function CardContent({ node, children, onProductUpdate, onSizeUpdate }: CardContentProps) {
  const colors = getHierarchyColor(node.level);
  const { allocated, remaining, percentage, isOverBudget } = calculateAllocation(node);

  // Budget bar color based on utilization
  const getProgressColor = () => {
    if (percentage > 1) return 'bg-red-500';
    if (percentage > 0.95) return 'bg-amber-500';
    if (percentage > 0.8) return 'bg-emerald-500';
    return 'bg-slate-700';
  };

  return (
    <div className={cn(
      'px-5 py-4 border-t',
      colors.border,
      colors.bg,
    )}>
      {/* Budget Summary Bar */}
      <div className="space-y-3">
        {/* Labels */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">
            Allocated: <span className="font-semibold text-slate-900">{formatCurrency(allocated)}</span>
            <span className="text-slate-400 mx-1">/</span>
            {formatCurrency(node.budget)}
          </span>
          <span className={cn(
            'font-semibold',
            isOverBudget ? 'text-red-600' : 'text-emerald-600'
          )}>
            {isOverBudget ? 'Over: ' : 'Remaining: '}
            {formatCurrency(Math.abs(remaining))}
          </span>
        </div>

        {/* Progress Bar - Minimal, professional */}
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              getProgressColor(),
            )}
            style={{ width: `${Math.min(percentage * 100, 100)}%` }}
          />
        </div>

        {/* Percentage indicator */}
        <div className="flex justify-between text-xs text-slate-400">
          <span>0%</span>
          <span className={cn(
            'font-medium',
            percentage > 0.95 ? 'text-amber-600' : 'text-slate-600'
          )}>
            {formatPercentage(percentage)} utilized
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Children Cards */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default CardContent;
