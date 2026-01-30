'use client';

import { cn } from '@/lib/utils';
import { PriceRangeData, formatPrice } from './types';

interface PriceRangeChartProps {
  data: PriceRangeData[];
  className?: string;
  showValue?: boolean;
}

export function PriceRangeChart({
  data,
  className,
  showValue = true,
}: PriceRangeChartProps) {
  const maxUnits = Math.max(...data.map((d) => d.totalUnits));

  return (
    <div className={cn('rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4', className)}>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
        Price Distribution
      </h4>

      <div className="space-y-4">
        {data.map((item) => {
          const widthPct = maxUnits > 0 ? (item.totalUnits / maxUnits) * 100 : 0;

          return (
            <div key={item.range.id}>
              {/* Label Row */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn('text-sm font-medium', item.range.color)}>
                  {item.range.label}
                </span>
                <span className="text-sm text-slate-500">
                  {item.totalUnits.toLocaleString()} units ({item.percentage.toFixed(1)}%)
                </span>
              </div>

              {/* Bar */}
              <div className="relative h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                <div
                  className={cn(
                    'absolute left-0 top-0 h-full rounded-lg transition-all duration-500',
                    item.range.id === 'budget' && 'bg-green-500',
                    item.range.id === 'mid' && 'bg-blue-500',
                    item.range.id === 'premium' && 'bg-purple-500',
                    item.range.id === 'luxury' && 'bg-amber-500'
                  )}
                  style={{ width: `${widthPct}%` }}
                />
                {showValue && (
                  <div className="absolute inset-0 flex items-center justify-end pr-3">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {formatPrice(item.totalValue)}
                    </span>
                  </div>
                )}
              </div>

              {/* Range Indicator */}
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{formatPrice(item.range.minPrice)}</span>
                <span>
                  {item.range.maxPrice ? formatPrice(item.range.maxPrice) : 'No limit'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        {data.map((item) => (
          <div key={item.range.id} className="flex items-center gap-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                item.range.id === 'budget' && 'bg-green-500',
                item.range.id === 'mid' && 'bg-blue-500',
                item.range.id === 'premium' && 'bg-purple-500',
                item.range.id === 'luxury' && 'bg-amber-500'
              )}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {item.range.label}: {item.skuCount} SKUs
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PriceRangeChart;
