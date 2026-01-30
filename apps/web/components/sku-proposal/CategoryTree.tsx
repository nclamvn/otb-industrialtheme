'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ProposalCategory,
  BudgetStatus,
  formatCurrency,
  formatPercent,
} from './types';
import {
  ChevronRight,
  ChevronDown,
  Package,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';
import {
  BudgetProgressBar,
  getBudgetHealth,
  getHealthStyles,
  formatBudgetCurrency,
  BudgetLevel,
  getLevelStyles,
} from '@/components/ui/budget';

interface CategoryTreeProps {
  categories: ProposalCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

interface CategoryItemProps {
  category: ProposalCategory;
  isSelected: boolean;
  onSelect: () => void;
  depth?: number;
}

// Map status to unified design system
const STATUS_CONFIG: Record<
  BudgetStatus,
  {
    icon: React.ReactNode;
    borderColor: string;
    label: string;
  }
> = {
  'on-track': {
    icon: <CheckCircle className="w-4 h-4 text-green-600" />,
    borderColor: 'border-l-green-500',
    label: 'On Track',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    borderColor: 'border-l-amber-500',
    label: 'Warning',
  },
  'over-budget': {
    icon: <AlertCircle className="w-4 h-4 text-red-600" />,
    borderColor: 'border-l-red-500',
    label: 'Over Budget',
  },
  'under-budget': {
    icon: <TrendingDown className="w-4 h-4 text-slate-500" />,
    borderColor: 'border-l-slate-400',
    label: 'Under Budget',
  },
};

function CategoryItem({
  category,
  isSelected,
  onSelect,
  depth = 0,
}: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const status = STATUS_CONFIG[category.status];

  // Use unified health system
  const percentage = category.budgetAllocated > 0
    ? category.budgetUsed / category.budgetAllocated
    : 0;
  const health = getBudgetHealth(percentage);
  const healthStyles = getHealthStyles(health);

  // Map depth to level for unified styling
  const level = Math.min(depth + 1, 5) as BudgetLevel;
  const levelStyles = getLevelStyles(level);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <div
        className={cn(
          // Unified: rounded-xl, p-4, border-l-4, shadow-sm, hover:shadow-md
          'rounded-xl border border-slate-200 mb-2 overflow-hidden',
          'shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer',
          'border-l-4',
          status.borderColor,
          isSelected && 'ring-2 ring-amber-200 border-amber-300'
        )}
        style={{ marginLeft: `${depth * 24}px` }}
        onClick={onSelect}
      >
        <div className="p-3">
          <div className="flex items-start gap-3">
            {/* Expand/Collapse */}
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              {hasChildren ? (
                <button
                  onClick={handleToggle}
                  className="p-0.5 hover:bg-slate-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              ) : (
                <Package className="w-4 h-4 text-slate-300" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-900 truncate">
                  {category.name}
                </span>
                {status.icon}
              </div>

              {/* Budget Progress - Using unified component */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {formatCurrency(category.budgetUsed)} /{' '}
                    {formatCurrency(category.budgetAllocated)}
                  </span>
                  <span className={cn('font-medium tabular-nums', healthStyles.text)}>
                    {formatPercent(category.percentUsed)}
                  </span>
                </div>

                {/* Unified progress bar h-2 */}
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', healthStyles.bar)}
                    style={{ width: `${Math.min(category.percentUsed, 100)}%` }}
                  />
                </div>

                {/* Remaining */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {category.productCount} products
                  </span>
                  <span
                    className={cn(
                      'tabular-nums font-medium',
                      category.budgetRemaining >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    {category.budgetRemaining >= 0 ? '+' : ''}
                    {formatCurrency(category.budgetRemaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              isSelected={false}
              onSelect={() => {}}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  categories,
  selectedCategoryId,
  onSelectCategory,
  className,
}: CategoryTreeProps) {
  // Calculate totals
  const totalBudget = categories.reduce((sum, c) => sum + c.budgetAllocated, 0);
  const totalUsed = categories.reduce((sum, c) => sum + c.budgetUsed, 0);
  const totalRemaining = totalBudget - totalUsed;
  const overallPercent = totalBudget > 0 ? totalUsed / totalBudget : 0;

  // Get health styles for overall
  const overallHealth = getBudgetHealth(overallPercent);
  const overallHealthStyles = getHealthStyles(overallHealth);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Summary - Unified card style */}
      <div
        className={cn(
          'rounded-xl border border-slate-200 bg-white overflow-hidden mb-4',
          'shadow-sm border-l-4 border-l-slate-800'
        )}
      >
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Categories</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Budget</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {formatCurrency(totalBudget)}
              </span>
            </div>

            {/* Unified progress bar h-2 */}
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', overallHealthStyles.bar)}
                style={{ width: `${Math.min(overallPercent * 100, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span>Used: {formatCurrency(totalUsed)}</span>
              <span
                className={cn(
                  'font-medium',
                  totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {totalRemaining >= 0 ? 'Remaining' : 'Over'}: {formatCurrency(Math.abs(totalRemaining))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            isSelected={category.id === selectedCategoryId}
            onSelect={() => onSelectCategory(category.id)}
          />
        ))}

        {categories.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No categories available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryTree;
