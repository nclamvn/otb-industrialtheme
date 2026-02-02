'use client';

import { cn } from '@/lib/utils';
import { PriceRangeData, formatPrice } from './types';
import { DollarSign, Package, TrendingUp, Percent } from 'lucide-react';

interface PriceRangeCardProps {
  data: PriceRangeData;
  className?: string;
  onClick?: () => void;
}

export function PriceRangeCard({
  data,
  className,
  onClick,
}: PriceRangeCardProps) {
  const { range } = data;

  const getRangeLabel = () => {
    if (range.maxPrice === null) {
      return `${formatPrice(range.minPrice)}+`;
    }
    return `${formatPrice(range.minPrice)} - ${formatPrice(range.maxPrice)}`;
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden cursor-pointer',
        'bg-card hover:border-border/80 transition-all',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className={cn('px-4 py-3 border-b border-border', range.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className={cn('w-5 h-5', range.color)} />
            <span className={cn('font-semibold', range.color)}>{range.label}</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {getRangeLabel()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Main Metric */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {data.skuCount}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            SKUs ({data.percentage.toFixed(1)}%)
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Package className="w-4 h-4" />
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {data.totalUnits.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">Units</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatPrice(data.totalValue)}
            </div>
            <div className="text-xs text-slate-500">Value</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
          <div className="text-center">
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              {data.sellThruPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">Sell-Through</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {data.marginPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">Margin</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceRangeCard;
