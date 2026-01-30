'use client';

import { cn } from '@/lib/utils';
import { ChoiceSummary, CHOICE_CONFIG, ChoiceType } from './types';
import { ChoiceAllocationCard } from './ChoiceAllocationCard';

interface ChoiceAllocationSummaryProps {
  summaries: ChoiceSummary[];
  className?: string;
  onChoiceClick?: (choice: ChoiceType) => void;
}

export function ChoiceAllocationSummary({
  summaries,
  className,
  onChoiceClick,
}: ChoiceAllocationSummaryProps) {
  // Calculate overall totals
  const totalUnits = summaries.reduce((sum, s) => sum + s.totalUnits, 0);
  const totalValue = summaries.reduce((sum, s) => sum + s.totalValue, 0);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Summary */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Choice Allocation Overview
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {totalUnits.toLocaleString()}
            </div>
            <div className="text-sm text-slate-500">Total Units</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-sm text-slate-500">Total Value</div>
          </div>
        </div>

        {/* Distribution Bar */}
        <div className="mt-4">
          <div className="text-sm text-slate-500 mb-2">Distribution</div>
          <div className="h-4 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700">
            {summaries.map((summary) => (
              <div
                key={summary.choice}
                className={cn(
                  'transition-all',
                  summary.choice === 'A' && 'bg-emerald-500',
                  summary.choice === 'B' && 'bg-amber-500',
                  summary.choice === 'C' && 'bg-sky-500'
                )}
                style={{ width: `${summary.percentage}%` }}
                title={`${CHOICE_CONFIG[summary.choice].label}: ${summary.percentage.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs">
            {summaries.map((summary) => (
              <div key={summary.choice} className="flex items-center gap-1">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    summary.choice === 'A' && 'bg-emerald-500',
                    summary.choice === 'B' && 'bg-amber-500',
                    summary.choice === 'C' && 'bg-sky-500'
                  )}
                />
                <span className={CHOICE_CONFIG[summary.choice].color}>
                  {summary.choice}: {summary.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Choice Cards */}
      <div className="grid grid-cols-3 gap-4">
        {summaries.map((summary) => (
          <ChoiceAllocationCard
            key={summary.choice}
            summary={summary}
            onClick={() => onChoiceClick?.(summary.choice)}
          />
        ))}
      </div>
    </div>
  );
}

export default ChoiceAllocationSummary;
