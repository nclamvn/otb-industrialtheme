'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Target,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BudgetProgressBar, getBudgetHealth, getHealthStyles } from '@/components/ui/budget';

interface ForecastItem {
  category: string;
  currentDemand: number;
  predictedDemand: number;
  growth: number;
  stockHealth: 'critical' | 'warning' | 'good';
}

// Demo data generator (will be replaced with real API data)
function generateForecastData(): ForecastItem[] {
  return [
    { category: 'Footwear', currentDemand: 4500, predictedDemand: 5200, growth: 15.5, stockHealth: 'warning' },
    { category: 'Apparel', currentDemand: 3200, predictedDemand: 3400, growth: 6.3, stockHealth: 'good' },
    { category: 'Accessories', currentDemand: 1800, predictedDemand: 2100, growth: 16.7, stockHealth: 'critical' },
    { category: 'Bags', currentDemand: 1200, predictedDemand: 1150, growth: -4.2, stockHealth: 'good' },
  ];
}

const stockHealthConfig = {
  critical: { label: 'Low Stock', color: 'text-red-600 bg-red-50', variant: 'destructive' as const },
  warning: { label: 'Monitor', color: 'text-amber-600 bg-amber-50', variant: 'secondary' as const },
  good: { label: 'Healthy', color: 'text-green-600 bg-green-50', variant: 'outline' as const },
};

export function DemandForecastWidget() {
  const forecastData = useMemo(() => generateForecastData(), []);

  const summary = useMemo(() => {
    const totalCurrent = forecastData.reduce((sum, item) => sum + item.currentDemand, 0);
    const totalPredicted = forecastData.reduce((sum, item) => sum + item.predictedDemand, 0);
    const avgGrowth = ((totalPredicted - totalCurrent) / totalCurrent) * 100;
    const criticalCount = forecastData.filter(item => item.stockHealth === 'critical').length;

    return {
      totalPredicted,
      avgGrowth,
      criticalCount,
      accuracy: 94.2,
    };
  }, [forecastData]);

  // Get health styles for accuracy
  const accuracyHealth = getBudgetHealth(summary.accuracy / 100);
  const accuracyHealthStyles = getHealthStyles(accuracyHealth);

  return (
    <div
      className={cn(
        // Unified: rounded-xl, shadow-sm, hover:shadow-md, border-l-4
        'rounded-xl border border-slate-200 bg-white overflow-hidden',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'border-l-4 border-l-blue-500'
      )}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Unified: w-10 h-10 rounded-xl icon container */}
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Demand Forecast</h3>
              <p className="text-xs text-slate-500">
                Next 30 days prediction
              </p>
            </div>
          </div>
          {summary.criticalCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {summary.criticalCount} Critical
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Summary Stats - Unified rounded-xl cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-slate-500" />
              </div>
              <span className="text-xs text-slate-500">Predicted Demand</span>
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1 tabular-nums">
              {summary.totalPredicted.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center",
                summary.avgGrowth >= 0 ? "bg-green-50" : "bg-red-50"
              )}>
                {summary.avgGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <span className="text-xs text-slate-500">Avg Growth</span>
            </div>
            <p className={cn(
              "text-lg font-bold mt-1 tabular-nums",
              summary.avgGrowth >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {summary.avgGrowth >= 0 ? '+' : ''}{summary.avgGrowth.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Forecast Accuracy - Unified h-2 progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Forecast Accuracy</span>
            <span className={cn("font-medium tabular-nums", accuracyHealthStyles.text)}>{summary.accuracy}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', accuracyHealthStyles.bar)}
              style={{ width: `${summary.accuracy}%` }}
            />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">By Category</p>
          {forecastData.slice(0, 4).map((item) => {
            const healthConfig = stockHealthConfig[item.stockHealth];
            return (
              <div
                key={item.category}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900">{item.category}</span>
                  <Badge variant={healthConfig.variant} className="text-[10px] px-1.5 py-0">
                    {healthConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 tabular-nums">
                    {item.predictedDemand.toLocaleString()}
                  </span>
                  <span className={cn(
                    "text-xs flex items-center tabular-nums",
                    item.growth >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {item.growth >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(item.growth).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* View Full Analysis Link */}
        <Link href="/analytics/demand">
          <Button variant="outline" size="sm" className="w-full mt-2">
            View Full Analysis
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
