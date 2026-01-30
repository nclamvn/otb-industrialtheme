'use client';

import { cn } from '@/lib/utils';
import { StorePerformanceData, STORE_GROUP_CONFIG } from './types';
import { Building2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StorePerformanceCardProps {
  data: StorePerformanceData;
  showDetails?: boolean;
  className?: string;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  return value.toLocaleString();
};

const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

export function StorePerformanceCard({
  data,
  showDetails = true,
  className,
}: StorePerformanceCardProps) {
  const config = STORE_GROUP_CONFIG[data.storeGroup];

  const TrendIcon =
    data.trend === 'up'
      ? TrendingUp
      : data.trend === 'down'
        ? TrendingDown
        : Minus;

  const trendColor =
    data.trend === 'up'
      ? 'text-green-600'
      : data.trend === 'down'
        ? 'text-red-600'
        : 'text-slate-500';

  return (
    <div
      className={cn(
        'rounded-xl border-2 overflow-hidden',
        'bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all',
        config.borderColor,
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'px-4 py-3 border-b border-slate-200 dark:border-slate-700',
          config.bgColor
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className={cn('w-5 h-5', config.color)} />
            <span className={cn('font-semibold', config.color)}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
            <span className={cn('text-sm font-medium', trendColor)}>
              {data.sellThruChange || formatPercentage(data.sellThruPercent)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Main Metric */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {formatPercentage(data.sellThruPercent)}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Sell-Through
          </div>
        </div>

        {showDetails && (
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900 dark:text-white">
                {data.qtySold.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Sold</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900 dark:text-white">
                {data.qtyOnHand.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">On Hand</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatCurrency(data.salesValue)}
              </div>
              <div className="text-xs text-slate-500">Sales</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StorePerformanceCard;
