'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode, BudgetKPIs } from './types';
import {
  getLevelStyles,
  BudgetStatusBadge,
  formatBudgetCurrency,
  formatBudgetPercentage,
  BudgetCardStatus,
  BudgetLevel,
} from '@/components/ui/budget';
import {
  ChevronRight,
  ChevronDown,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Target,
  Layers,
  AlertTriangle,
  CheckCircle,
  Info,
  Minus,
} from 'lucide-react';

// Map node status to BudgetCardStatus
function mapStatus(status: string): BudgetCardStatus {
  const statusMap: Record<string, BudgetCardStatus> = {
    draft: 'draft',
    verified: 'verified',
    warning: 'warning',
    error: 'error',
    locked: 'locked',
  };
  return statusMap[status] || 'draft';
}

// Gap severity colors
const gapSeverityStyles = {
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

interface EnhancedBudgetCardProps {
  node: BudgetNode;
  onClick?: () => void;
  isExpanded?: boolean;
  hasChildren?: boolean;
}

export function EnhancedBudgetCard({
  node,
  onClick,
  isExpanded = false,
  hasChildren = false,
}: EnhancedBudgetCardProps) {
  const [showKPIs, setShowKPIs] = useState(false);

  const level = Math.min(Math.max(node.level, 1), 5) as BudgetLevel;
  const levelStyles = getLevelStyles(level);

  // Calculate KPIs if not provided
  const kpis: BudgetKPIs = node.kpis || {
    gap: node.budget - node.allocated,
    gapPercent: node.budget > 0 ? ((node.budget - node.allocated) / node.budget) * 100 : 0,
    gapSeverity: 'ok',
  };

  // Determine gap severity if not provided
  if (!node.kpis?.gapSeverity) {
    const absGapPercent = Math.abs(kpis.gapPercent);
    if (absGapPercent <= 5) kpis.gapSeverity = 'ok';
    else if (absGapPercent <= 10) kpis.gapSeverity = 'info';
    else if (absGapPercent <= 20) kpis.gapSeverity = 'warning';
    else kpis.gapSeverity = 'critical';
  }

  const GapIcon = gapSeverityStyles[kpis.gapSeverity].icon;

  return (
    <div
      className={cn(
        'w-full text-left',
        'border border-slate-200 dark:border-neutral-800 rounded-xl mb-2',
        'border-l-4',
        levelStyles.band,
        levelStyles.bg,
        'shadow-sm hover:shadow-md transition-all duration-200',
        'overflow-hidden',
      )}
    >
      {/* Main Card Header */}
      <div
        className={cn(
          'p-3 cursor-pointer',
          'hover:bg-amber-50/30 dark:hover:bg-amber-950/30',
          'transition-colors duration-150',
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top row: Name + Status */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900 dark:text-neutral-100 truncate">
                {node.name}
              </span>
              <BudgetStatusBadge status={mapStatus(node.status)} />
            </div>

            {/* Bottom row: Amount + percentage */}
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-neutral-100">
                {formatBudgetCurrency(node.budget)}
              </span>
              <span className="text-sm tabular-nums text-slate-500 dark:text-neutral-400">
                {formatBudgetPercentage(node.percentage)} of total
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
                  ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                  : 'text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
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
        <div className="border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 p-3">
          {/* Row 1: Core Budget Metrics */}
          <div className="grid grid-cols-5 gap-3 mb-3">
            <KPIItem
              label="Allocated"
              value={formatBudgetCurrency(node.allocated)}
            />
            <KPIItem
              label="Remaining"
              value={formatBudgetCurrency(kpis.gap)}
              trend={kpis.gap >= 0 ? 'neutral' : 'down'}
            />
            <KPIItem
              label="Gap %"
              value={`${kpis.gapPercent.toFixed(1)}%`}
              icon={GapIcon}
              className={gapSeverityStyles[kpis.gapSeverity].color}
            />
            <KPIItem
              label="LY Variance"
              value={kpis.lastYearVariance !== undefined ? `${kpis.lastYearVariance > 0 ? '+' : ''}${kpis.lastYearVariance.toFixed(1)}%` : '—'}
              icon={kpis.lastYearVariance !== undefined ? (kpis.lastYearVariance >= 0 ? TrendingUp : TrendingDown) : Minus}
              trend={kpis.lastYearVariance !== undefined ? (kpis.lastYearVariance >= 0 ? 'up' : 'down') : 'neutral'}
            />
            <KPIItem
              label="Confidence"
              value={kpis.systemConfidence !== undefined ? `${kpis.systemConfidence}%` : '—'}
              icon={Target}
            />
          </div>

          {/* Row 2: Performance Metrics */}
          <div className="grid grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-neutral-800">
            <KPIItem
              label="SKUs"
              value={kpis.skuCount ?? '—'}
              icon={Package}
            />
            <KPIItem
              label="Sell-Thru"
              value={kpis.sellThruPercent !== undefined ? `${kpis.sellThruPercent.toFixed(1)}%` : '—'}
              icon={TrendingUp}
              trend={kpis.sellThruPercent !== undefined ? (kpis.sellThruPercent >= 50 ? 'up' : 'down') : 'neutral'}
            />
            <KPIItem
              label="WoC"
              value={kpis.weeksOfCover !== undefined ? kpis.weeksOfCover.toFixed(1) : '—'}
              subValue="weeks"
            />
            <KPIItem
              label="Growth"
              value={kpis.growthPercent !== undefined ? `${kpis.growthPercent > 0 ? '+' : ''}${kpis.growthPercent.toFixed(1)}%` : '—'}
              icon={kpis.growthPercent !== undefined ? (kpis.growthPercent >= 0 ? TrendingUp : TrendingDown) : Minus}
              trend={kpis.growthPercent !== undefined ? (kpis.growthPercent >= 0 ? 'up' : 'down') : 'neutral'}
            />
            <KPIItem
              label="Children"
              value={kpis.childrenCount ?? node.children?.length ?? '—'}
              icon={Layers}
              subValue={kpis.childrenWithGaps ? `${kpis.childrenWithGaps} gaps` : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedBudgetCard;
