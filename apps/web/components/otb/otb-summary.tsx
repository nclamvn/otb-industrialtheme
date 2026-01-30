'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Target,
} from 'lucide-react';
import {
  BudgetProgressBar,
  BudgetStatusBadge,
  getBudgetHealth,
  getHealthStyles,
  formatBudgetCurrency,
  formatBudgetPercentage,
} from '@/components/ui/budget';

// Format compact currency
const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatBudgetCurrency(value);
};

interface OTBSummaryData {
  totalBudget: number;
  plannedSales: number;
  plannedMarkdowns: number;
  plannedEOMInventory: number;
  bomInventory: number;
  onOrder: number;
  actualSales?: number;
  actualReceipts?: number;
}

interface OTBSummaryProps {
  data: OTBSummaryData;
  period?: string;
  className?: string;
}

export function OTBSummary({ data, period = 'Current Period', className }: OTBSummaryProps) {
  const calculations = useMemo(() => {
    // OTB = Planned Sales + Planned Markdowns + Planned EOM Inventory - BOM Inventory - On Order
    const otb =
      data.plannedSales +
      data.plannedMarkdowns +
      data.plannedEOMInventory -
      data.bomInventory -
      data.onOrder;

    const budgetUtilization = data.totalBudget > 0 ? otb / data.totalBudget : 0;
    const isOverBudget = otb > data.totalBudget;
    const variance = data.totalBudget - otb;

    // Actual vs Planned (if actual data available)
    const salesVariance = data.actualSales
      ? data.actualSales - data.plannedSales
      : 0;
    const salesVariancePercent = data.plannedSales > 0 && data.actualSales
      ? (salesVariance / data.plannedSales) * 100
      : 0;

    // Inventory turnover
    const avgInventory = (data.bomInventory + data.plannedEOMInventory) / 2;
    const turnover = avgInventory > 0 ? data.plannedSales / avgInventory : 0;

    // Weeks of supply
    const weeksOfSupply = data.plannedSales > 0
      ? (data.plannedEOMInventory / (data.plannedSales / 4))
      : 0;

    return {
      otb,
      budgetUtilization,
      isOverBudget,
      variance,
      salesVariance,
      salesVariancePercent,
      turnover,
      weeksOfSupply,
      status: isOverBudget ? 'over' : budgetUtilization < 0.8 ? 'under' : 'optimal',
    };
  }, [data]);

  // Map status to unified design system
  const health = getBudgetHealth(calculations.budgetUtilization);
  const healthStyles = getHealthStyles(health);

  const statusConfig = {
    over: {
      badge: 'error' as const,
      icon: AlertTriangle,
      label: 'Over Budget',
      borderColor: 'border-l-red-500',
    },
    under: {
      badge: 'warning' as const,
      icon: TrendingDown,
      label: 'Under-utilized',
      borderColor: 'border-l-amber-500',
    },
    optimal: {
      badge: 'verified' as const,
      icon: CheckCircle,
      label: 'On Track',
      borderColor: 'border-l-green-500',
    },
  };

  const currentStatus = statusConfig[calculations.status];
  const StatusIcon = currentStatus.icon;

  return (
    <div
      className={cn(
        // Unified: rounded-xl, p-4, shadow-sm, hover:shadow-md, border-l-4
        'rounded-xl border border-slate-200 bg-white overflow-hidden',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'border-l-4',
        currentStatus.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">OTB Summary</h3>
            <p className="text-xs text-slate-500">{period}</p>
          </div>
          <BudgetStatusBadge status={currentStatus.badge} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-2 space-y-4">
        {/* Main OTB Display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">
              {formatCompactCurrency(calculations.otb)}
            </p>
            <p className="text-sm text-slate-500">Open-To-Buy</p>
          </div>
          <div className="text-right">
            <p className={cn(
              'text-lg font-semibold tabular-nums',
              healthStyles.text
            )}>
              {calculations.variance >= 0 ? '+' : ''}{formatCompactCurrency(calculations.variance)}
            </p>
            <p className="text-sm text-slate-500">vs Budget</p>
          </div>
        </div>

        {/* Progress Bar using unified component */}
        <BudgetProgressBar
          budget={data.totalBudget}
          allocated={calculations.otb}
          size="md"
        />

        {/* Quick Stats Grid - Unified card style */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: DollarSign, label: 'Budget', value: data.totalBudget },
            { icon: TrendingUp, label: 'Planned Sales', value: data.plannedSales },
            { icon: Package, label: 'Inventory', value: data.bomInventory },
            { icon: ShoppingCart, label: 'On Order', value: data.onOrder },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl"
            >
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
                <item.icon className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-sm font-semibold text-slate-900 tabular-nums">
                  {formatCompactCurrency(item.value)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="flex justify-between text-sm pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="font-semibold text-slate-900 tabular-nums">{calculations.turnover.toFixed(1)}x</p>
            <p className="text-xs text-slate-500">Turnover</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 tabular-nums">{calculations.weeksOfSupply.toFixed(1)}</p>
            <p className="text-xs text-slate-500">WOS</p>
          </div>
          <div className="text-center">
            <p className={cn(
              'font-semibold tabular-nums',
              data.actualSales && calculations.salesVariancePercent >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {data.actualSales ? `${calculations.salesVariancePercent >= 0 ? '+' : ''}${calculations.salesVariancePercent.toFixed(1)}%` : 'N/A'}
            </p>
            <p className="text-xs text-slate-500">Sales Var.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for lists - Updated with unified design
export function OTBSummaryCompact({
  otb,
  budget,
  status = 'optimal',
  className,
}: {
  otb: number;
  budget: number;
  status?: 'over' | 'under' | 'optimal';
  className?: string;
}) {
  const utilization = budget > 0 ? otb / budget : 0;
  const health = getBudgetHealth(utilization);
  const healthStyles = getHealthStyles(health);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-900 tabular-nums">
            {formatCompactCurrency(otb)}
          </span>
          <span className="text-xs text-slate-500 tabular-nums">
            {formatBudgetPercentage(utilization)}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', healthStyles.bar)}
            style={{ width: `${Math.min(utilization * 100, 100)}%` }}
          />
        </div>
      </div>
      {status === 'over' ? (
        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
      ) : status === 'under' ? (
        <TrendingDown className="h-4 w-4 text-amber-500 flex-shrink-0" />
      ) : (
        <Target className="h-4 w-4 text-green-500 flex-shrink-0" />
      )}
    </div>
  );
}
