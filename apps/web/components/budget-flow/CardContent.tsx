'use client';

import { cn } from '@/lib/utils';
import { BudgetNode, ProductData, SizeData } from './types';
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

export function CardContent({ node, children }: CardContentProps) {
  const { allocated, remaining, percentage, isOverBudget } = calculateAllocation(node);

  // Only show progress if there are children (allocations)
  const hasAllocations = node.children && node.children.length > 0;

  if (!hasAllocations && !children) {
    return <div className="py-2">{children}</div>;
  }

  return (
    <div className="py-3">
      {/* Compact progress indicator */}
      {hasAllocations && (
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                percentage > 1 ? 'bg-red-400' :
                percentage > 0.95 ? 'bg-amber-400' : 'bg-slate-400'
              )}
              style={{ width: `${Math.min(percentage * 100, 100)}%` }}
            />
          </div>
          <span className="tabular-nums whitespace-nowrap">
            {formatCurrency(allocated)} / {formatCurrency(node.budget)}
          </span>
          {remaining !== 0 && (
            <span className={cn(
              'tabular-nums',
              isOverBudget ? 'text-red-500' : 'text-emerald-500'
            )}>
              {isOverBudget ? '+' : '-'}{formatCurrency(Math.abs(remaining))}
            </span>
          )}
        </div>
      )}

      {/* Children */}
      {children}
    </div>
  );
}

export default CardContent;
