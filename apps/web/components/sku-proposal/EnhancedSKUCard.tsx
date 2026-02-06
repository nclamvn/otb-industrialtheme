'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProposalProduct, SizeAllocation, formatCurrency, formatPercent } from './types';
import {
  ChevronRight,
  ChevronDown,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Hash,
  DollarSign,
  Percent,
  Minus,
  CheckCircle,
  Info,
  AlertTriangle,
  Ruler,
} from 'lucide-react';

// Status mapping
type SKUStatus = 'draft' | 'verified' | 'warning' | 'error';

const statusConfig: Record<SKUStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'text-slate-600 dark:text-neutral-300 bg-muted/50 border-border',
  },
  verified: {
    label: 'Verified',
    className: 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  },
  warning: {
    label: 'Warning',
    className: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  },
  error: {
    label: 'Over Budget',
    className: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  },
};

// Severity styles
type Severity = 'ok' | 'info' | 'warning' | 'critical';

const severityStyles: Record<Severity, { icon: typeof CheckCircle; color: string; bg: string }> = {
  ok: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
  info: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
  critical: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' },
};

// KPI Item Component
function KPIItem({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: typeof TrendingUp;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-500 dark:text-neutral-400',
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-0.5">
        {label}
      </span>
      <div className="flex items-center gap-1">
        {Icon && <Icon className={cn('w-3.5 h-3.5', trend ? trendColors[trend] : 'text-slate-500 dark:text-neutral-400')} />}
        <span className={cn(
          'text-sm font-semibold tabular-nums',
          trend ? trendColors[trend] : 'text-slate-900 dark:text-neutral-100'
        )}>
          {value}
        </span>
      </div>
      {subValue && (
        <span className="text-[10px] text-slate-400 dark:text-neutral-500">{subValue}</span>
      )}
    </div>
  );
}

// Extended KPIs for SKU
export interface SKUKPIs {
  // Core
  totalUnits: number;
  avgPrice: number;
  marginPercent?: number;

  // Historical
  lyUnits?: number;
  lyVariance?: number; // % change vs last year

  // Size info
  sizeCount: number;
  topSize?: string;
  topSizePercent?: number;

  // Performance
  avgSellThru: number;
  weeksOfCover?: number;
  sellThruRate?: number;

  // Status
  severity: Severity;
}

interface EnhancedSKUCardProps {
  product: ProposalProduct;
  budgetPercent?: number; // % of category budget
  onClick?: () => void;
  isExpanded?: boolean;
  hasChildren?: boolean;
  status?: SKUStatus;
  kpis?: Partial<SKUKPIs>;
}

// Calculate KPIs from product data
function calculateKPIs(product: ProposalProduct, kpisOverride?: Partial<SKUKPIs>): SKUKPIs {
  const sizes = product.sizes || [];

  // Calculate average sell-through
  const avgSellThru = sizes.length > 0
    ? sizes.reduce((sum, s) => sum + (s.sellThruPercent || 0), 0) / sizes.length
    : 0;

  // Find top size
  const topSize = sizes.reduce((max, s) =>
    s.salesMixPercent > (max?.salesMixPercent || 0) ? s : max, sizes[0]);

  // Determine severity based on sell-through
  let severity: Severity = 'ok';
  if (avgSellThru < 30) severity = 'critical';
  else if (avgSellThru < 50) severity = 'warning';
  else if (avgSellThru < 70) severity = 'info';

  return {
    totalUnits: product.totalQty,
    avgPrice: product.unitPrice,
    marginPercent: product.costPrice
      ? ((product.unitPrice - product.costPrice) / product.unitPrice) * 100
      : undefined,
    sizeCount: sizes.length,
    topSize: topSize?.sizeCode,
    topSizePercent: topSize?.salesMixPercent,
    avgSellThru,
    severity,
    ...kpisOverride,
  };
}

// Determine status from product data
function determineStatus(product: ProposalProduct): SKUStatus {
  if (product.hasChanges) return 'draft';
  const kpis = calculateKPIs(product);
  if (kpis.avgSellThru < 30) return 'error';
  if (kpis.avgSellThru < 50) return 'warning';
  return 'verified';
}

export function EnhancedSKUCard({
  product,
  budgetPercent = 0,
  onClick,
  isExpanded = false,
  hasChildren = false,
  status,
  kpis: kpisOverride,
}: EnhancedSKUCardProps) {
  const [showKPIs, setShowKPIs] = useState(false);

  const cardStatus = status || determineStatus(product);
  const statusStyle = statusConfig[cardStatus];
  const kpis = calculateKPIs(product, kpisOverride);
  const SeverityIcon = severityStyles[kpis.severity].icon;

  return (
    <div
      className={cn(
        'w-full text-left',
        'border border-border rounded-xl mb-2',
        'border-l-4 border-l-purple-600 dark:border-l-cyan-500',
        'bg-card',
        'hover:border-border/80 transition-all duration-200',
        'overflow-hidden',
      )}
    >
      {/* Main Card Header */}
      <div
        className={cn(
          'p-3 cursor-pointer',
          'hover:bg-purple-50/30 dark:hover:bg-cyan-950/30',
          'transition-colors duration-150',
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top row: Style Code + Name + Status */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                {product.styleCode}
              </span>
              <span className="font-semibold text-slate-900 dark:text-neutral-100 truncate">
                {product.styleName}
              </span>
              {product.colorName && (
                <span className="text-xs text-slate-400 dark:text-neutral-500">
                  ({product.colorName})
                </span>
              )}
              <span className={cn(
                'px-1.5 py-0.5 text-[10px] font-medium rounded-full border',
                statusStyle.className
              )}>
                {statusStyle.label}
              </span>
            </div>

            {/* Bottom row: Value + percentage */}
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-neutral-100">
                {formatCurrency(product.totalValue)}
              </span>
              {budgetPercent > 0 && (
                <span className="text-sm tabular-nums text-slate-500 dark:text-neutral-400">
                  {formatPercent(budgetPercent)} of budget
                </span>
              )}
              <span className="text-sm text-slate-400 dark:text-neutral-500">
                {product.totalQty} units @ {formatCurrency(product.unitPrice)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* KPI Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowKPIs(!showKPIs);
              }}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                showKPIs
                  ? 'bg-purple-100 dark:bg-cyan-900 text-purple-700 dark:text-cyan-300'
                  : 'text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 hover:bg-muted dark:hover:bg-neutral-800'
              )}
              title="Toggle KPIs"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            {/* Expand/Navigate Chevron */}
            {hasChildren && (
              <div className="p-1.5 text-slate-400 dark:text-neutral-500">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Panel - Collapsible */}
      {showKPIs && (
        <div className="border-t border-slate-100 dark:border-neutral-800 bg-muted/50/50 dark:bg-neutral-900/50 p-3">
          {/* Row 1: Core Metrics */}
          <div className="grid grid-cols-5 gap-3 mb-3">
            <KPIItem
              label="Units"
              value={kpis.totalUnits.toLocaleString()}
              icon={Package}
            />
            <KPIItem
              label="Avg Price"
              value={formatCurrency(kpis.avgPrice)}
              icon={DollarSign}
            />
            <KPIItem
              label="Margin %"
              value={kpis.marginPercent !== undefined ? `${kpis.marginPercent.toFixed(1)}%` : '—'}
              icon={Percent}
              trend={kpis.marginPercent !== undefined ? (kpis.marginPercent >= 50 ? 'up' : kpis.marginPercent >= 30 ? 'neutral' : 'down') : 'neutral'}
            />
            <KPIItem
              label="LY Units"
              value={kpis.lyUnits !== undefined ? kpis.lyUnits.toLocaleString() : '—'}
              icon={Hash}
            />
            <KPIItem
              label="Variance"
              value={kpis.lyVariance !== undefined ? `${kpis.lyVariance > 0 ? '+' : ''}${kpis.lyVariance.toFixed(1)}%` : '—'}
              icon={kpis.lyVariance !== undefined ? (kpis.lyVariance >= 0 ? TrendingUp : TrendingDown) : Minus}
              trend={kpis.lyVariance !== undefined ? (kpis.lyVariance >= 0 ? 'up' : 'down') : 'neutral'}
            />
          </div>

          {/* Row 2: Size & Performance */}
          <div className="grid grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-neutral-800">
            <KPIItem
              label="Sizes"
              value={kpis.sizeCount}
              icon={Ruler}
            />
            <KPIItem
              label="Top Size"
              value={kpis.topSize || '—'}
              subValue={kpis.topSizePercent ? `${kpis.topSizePercent.toFixed(0)}% mix` : undefined}
            />
            <KPIItem
              label="Sell-Thru"
              value={`${kpis.avgSellThru.toFixed(1)}%`}
              icon={SeverityIcon}
              trend={kpis.avgSellThru >= 70 ? 'up' : kpis.avgSellThru >= 50 ? 'neutral' : 'down'}
              className={severityStyles[kpis.severity].color}
            />
            <KPIItem
              label="WoC"
              value={kpis.weeksOfCover !== undefined ? kpis.weeksOfCover.toFixed(1) : '—'}
              subValue="weeks"
            />
            <KPIItem
              label="ST Rate"
              value={kpis.sellThruRate !== undefined ? `${kpis.sellThruRate.toFixed(1)}%` : '—'}
              icon={kpis.sellThruRate !== undefined ? (kpis.sellThruRate >= 50 ? TrendingUp : TrendingDown) : Minus}
              trend={kpis.sellThruRate !== undefined ? (kpis.sellThruRate >= 50 ? 'up' : 'down') : 'neutral'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedSKUCard;
