'use client';

import { cn } from '@/lib/utils';
import { StoreComparisonData } from './types';
import { StorePerformanceCard } from './StorePerformanceCard';
import { TrendingUp, TrendingDown, Equal } from 'lucide-react';

interface StoreComparisonPanelProps {
  data: StoreComparisonData;
  className?: string;
}

const formatPercentage = (value: number) => {
  return `${(Math.abs(value) * 100).toFixed(1)}%`;
};

export function StoreComparisonPanel({
  data,
  className,
}: StoreComparisonPanelProps) {
  const stDiff = data.variance.sellThru;
  const winner = stDiff > 0.01 ? 'REX' : stDiff < -0.01 ? 'TTP' : 'TIE';

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4',
        className
      )}
    >
      {/* SKU Header */}
      <div className="mb-4 pb-3 border-b border-border">
        <div className="font-mono text-sm text-slate-500">{data.sku.code}</div>
        <div className="font-semibold text-slate-900 dark:text-white">
          {data.sku.name}
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* REX */}
        <StorePerformanceCard data={data.rex} showDetails={false} />

        {/* VS Indicator */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-xs text-slate-500 mb-2">Variance</div>
          <div
            className={cn(
              'flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium',
              winner === 'REX'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : winner === 'TTP'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-muted text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            )}
          >
            {winner === 'REX' && <TrendingUp className="w-4 h-4" />}
            {winner === 'TTP' && <TrendingDown className="w-4 h-4" />}
            {winner === 'TIE' && <Equal className="w-4 h-4" />}
            {formatPercentage(stDiff)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {winner === 'REX'
              ? 'REX leads'
              : winner === 'TTP'
                ? 'TTP leads'
                : 'Equal'}
          </div>
        </div>

        {/* TTP */}
        <StorePerformanceCard data={data.ttp} showDetails={false} />
      </div>
    </div>
  );
}

export default StoreComparisonPanel;
