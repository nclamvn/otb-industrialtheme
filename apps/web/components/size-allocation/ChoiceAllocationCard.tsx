'use client';

import { cn } from '@/lib/utils';
import { ChoiceType, CHOICE_CONFIG, ChoiceSummary } from './types';
import { Package, TrendingUp, Percent } from 'lucide-react';

interface ChoiceAllocationCardProps {
  summary: ChoiceSummary;
  className?: string;
  onClick?: () => void;
}

const formatNumber = (value: number) => {
  return value.toLocaleString();
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

export function ChoiceAllocationCard({
  summary,
  className,
  onClick,
}: ChoiceAllocationCardProps) {
  const config = CHOICE_CONFIG[summary.choice];

  return (
    <div
      className={cn(
        'rounded-xl border-2 overflow-hidden cursor-pointer',
        'bg-card hover:border-border/80 transition-all',
        config.borderColor,
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className={cn('px-4 py-3 border-b border-border', config.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className={cn('w-5 h-5', config.color)} />
            <span className={cn('font-semibold', config.color)}>{config.label}</span>
          </div>
          <div
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              config.bgColor,
              config.color
            )}
          >
            {summary.percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Main Metric */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {formatNumber(summary.totalUnits)}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Total Units
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatCurrency(summary.totalValue)}
            </div>
            <div className="text-xs text-slate-500">Value</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Percent className="w-4 h-4" />
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {summary.skuCount}
            </div>
            <div className="text-xs text-slate-500">SKUs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChoiceAllocationCard;
