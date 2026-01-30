'use client';

import { cn } from '@/lib/utils';
import { getBudgetHealth, getHealthStyles, formatBudgetCurrency, formatBudgetPercentage } from './budget-utils';

interface BudgetProgressBarProps {
  budget: number;
  allocated: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BudgetProgressBar({
  budget,
  allocated,
  showLabels = true,
  size = 'md',
  className,
}: BudgetProgressBarProps) {
  const percentage = budget > 0 ? allocated / budget : 0;
  const remaining = budget - allocated;
  const health = getBudgetHealth(percentage);
  const healthStyles = getHealthStyles(health);

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-neutral-300">
            Allocated: {formatBudgetCurrency(allocated)} / {formatBudgetCurrency(budget)}
          </span>
          <span className={cn('font-medium', healthStyles.text)}>
            {remaining >= 0 ? 'Remaining: ' : 'Over: '}
            {formatBudgetCurrency(Math.abs(remaining))}
          </span>
        </div>
      )}

      <div className={cn('w-full bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', healthStyles.bar)}
          style={{ width: `${Math.min(percentage * 100, 100)}%` }}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between text-xs text-slate-500 dark:text-neutral-400">
          <span>0%</span>
          <span className="font-medium">{formatBudgetPercentage(percentage)}</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}
