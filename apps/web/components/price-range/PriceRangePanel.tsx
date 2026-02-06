'use client';

import { cn } from '@/lib/utils';
import { PriceRangeAnalysis, formatPrice } from './types';
import { PriceRangeCard } from './PriceRangeCard';
import { PriceRangeChart } from './PriceRangeChart';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PriceRangePanelProps {
  analysis: PriceRangeAnalysis;
  className?: string;
  onRangeClick?: (rangeId: string) => void;
}

export function PriceRangePanel({
  analysis,
  className,
  onRangeClick,
}: PriceRangePanelProps) {
  const getDistributionBadge = () => {
    switch (analysis.priceDistribution) {
      case 'balanced':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <Minus className="w-3 h-3 mr-1" />
            Balanced
          </Badge>
        );
      case 'low-heavy':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <TrendingDown className="w-3 h-3 mr-1" />
            Low-Heavy
          </Badge>
        );
      case 'high-heavy':
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            <TrendingUp className="w-3 h-3 mr-1" />
            High-Heavy
          </Badge>
        );
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Price Range Analysis
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {analysis.seasonName}
            {analysis.categoryName && ` • ${analysis.categoryName}`}
            {analysis.brandName && ` • ${analysis.brandName}`}
          </p>
        </div>
        {getDistributionBadge()}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {analysis.totalSKUs}
          </div>
          <div className="text-sm text-slate-500">Total SKUs</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {analysis.totalUnits.toLocaleString()}
          </div>
          <div className="text-sm text-slate-500">Total Units</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatPrice(analysis.totalValue)}
          </div>
          <div className="text-sm text-slate-500">Total Value</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatPrice(analysis.avgPrice)}
          </div>
          <div className="text-sm text-slate-500">Avg Price</div>
        </div>
      </div>

      {/* Recommendation */}
      {analysis.recommendation && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Recommendation
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {analysis.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <PriceRangeChart data={analysis.ranges} />

      {/* Range Cards */}
      <div className="grid grid-cols-4 gap-4">
        {analysis.ranges.map((range) => (
          <PriceRangeCard
            key={range.range.id}
            data={range}
            onClick={() => onRangeClick?.(range.range.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default PriceRangePanel;
