'use client';

import { cn } from '@/lib/utils';
import { CostingBreakdown, getMarginStatus } from './types';
import { DollarSign, Truck, FileText, Landmark, TrendingUp, ArrowRight } from 'lucide-react';

interface CostingBreakdownCardProps {
  costing: CostingBreakdown;
  showDetails?: boolean;
  className?: string;
}

const formatCurrency = (value: number, currency: string = 'VND') => {
  if (currency === 'VND') {
    if (value >= 1000000000) {
      return `₫${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `₫${(value / 1000000).toFixed(2)}M`;
    }
    return `₫${value.toLocaleString()}`;
  }
  return `${currency} ${value.toFixed(2)}`;
};

export function CostingBreakdownCard({
  costing,
  showDetails = true,
  className,
}: CostingBreakdownCardProps) {
  const marginStatus = getMarginStatus(costing.grossMargin);

  const getBorderColor = () => {
    if (costing.grossMargin >= 0.6) return 'border-l-green-500';
    if (costing.grossMargin >= 0.5) return 'border-l-blue-500';
    if (costing.grossMargin >= 0.4) return 'border-l-amber-500';
    return 'border-l-red-500';
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border border-border bg-card overflow-hidden border-l-4 hover:border-border/80 transition-all',
        getBorderColor(),
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cost Breakdown</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{costing.skuId}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Cost Flow */}
        <div className="space-y-3">
          {/* Unit Cost */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <DollarSign className="w-4 h-4" />
              Unit Cost
            </div>
            <div className="font-mono font-medium text-slate-900 dark:text-white">
              {costing.unitCostCurrency} {costing.unitCost.toFixed(2)}
            </div>
          </div>

          {showDetails && (
            <>
              {/* Freight & Insurance */}
              <div className="flex items-center justify-between pl-6 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Truck className="w-3 h-3" />
                  Freight + Insurance ({(costing.freightInsurancePct * 100).toFixed(0)}%)
                </div>
                <div className="font-mono text-slate-600 dark:text-slate-400">
                  +{costing.freightInsuranceValue.toFixed(2)}
                </div>
              </div>

              {/* Others Tax */}
              <div className="flex items-center justify-between pl-6 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <FileText className="w-3 h-3" />
                  Others Tax ({(costing.othersTaxPct * 100).toFixed(0)}%)
                </div>
                <div className="font-mono text-slate-600 dark:text-slate-400">
                  +{costing.othersTaxValue.toFixed(2)}
                </div>
              </div>

              {/* Import Tax */}
              <div className="flex items-center justify-between pl-6 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Landmark className="w-3 h-3" />
                  Import Tax ({(costing.importTaxPct * 100).toFixed(0)}%)
                </div>
                <div className="font-mono text-slate-600 dark:text-slate-400">
                  +{costing.importTaxValue.toFixed(2)}
                </div>
              </div>

              <div className="border-t border-dashed border-border my-2" />
            </>
          )}

          {/* Landed Cost (Foreign Currency) */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Landed Cost
            </div>
            <div className="font-mono font-semibold text-slate-900 dark:text-white">
              {costing.unitCostCurrency} {costing.landedCost.toFixed(2)}
            </div>
          </div>

          {/* Exchange Rate Indicator */}
          <div className="flex items-center justify-center text-xs text-slate-400">
            <ArrowRight className="w-3 h-3 mx-2" />
            @ {costing.exchangeRate.toLocaleString()} VND/{costing.unitCostCurrency}
          </div>

          {/* Landed Cost (VND) */}
          <div className="flex items-center justify-between bg-muted/50 -mx-4 px-4 py-3">
            <div className="text-sm font-medium">Landed Cost (VND)</div>
            <div className="font-mono font-bold text-lg text-slate-900 dark:text-white">
              {formatCurrency(costing.landedCostVND)}
            </div>
          </div>

          {/* SRP */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              SRP
            </div>
            <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(costing.srp)}
            </div>
          </div>

          {/* Gross Margin */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              Gross Margin
            </div>
            <div
              className={cn(
                'px-3 py-1 rounded-full font-bold text-lg',
                marginStatus.bgColor,
                marginStatus.color
              )}
            >
              {(costing.grossMargin * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Watermark icon */}
        <DollarSign className="absolute bottom-4 right-4 w-24 h-24 text-muted-foreground opacity-[0.08]" />
      </div>
    </div>
  );
}

export default CostingBreakdownCard;
