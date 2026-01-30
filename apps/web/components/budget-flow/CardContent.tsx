'use client';

import { cn } from '@/lib/utils';
import { BudgetNode, ProductData, SizeData } from './types';
import { getHierarchyColor } from './utils/hierarchy-colors';
import {
  formatCurrency,
  formatPercentage,
  calculateAllocation,
  getBudgetHealthColor,
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

  return (
    <div className={cn(
      'p-4 space-y-4',
      colors.bg,
    )}>
      {/* Budget Summary Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={colors.text}>
            Allocated: {formatCurrency(allocated)} / {formatCurrency(node.budget)}
          </span>
          <span className={cn(
            'font-medium',
            isOverBudget ? 'text-red-600' : 'text-green-600'
          )}>
            {isOverBudget ? 'Over: ' : 'Remaining: '}
            {formatCurrency(Math.abs(remaining))}
          </span>
        </div>

        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              getBudgetHealthColor(percentage),
            )}
            style={{ width: `${Math.min(percentage * 100, 100)}%` }}
          />
          {isOverBudget && (
            <div
              className="absolute top-0 right-0 h-full bg-red-500 opacity-50"
              style={{ width: `${(percentage - 1) * 100}%` }}
            />
          )}
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span className="font-medium">{formatPercentage(percentage)}</span>
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
