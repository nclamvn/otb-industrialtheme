'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  RotateCw,
  PieChart,
  Layers,
  Minus,
  CheckCircle,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { formatBudgetCurrency } from '@/components/ui/budget';

// Status mapping
type OTBStatus = 'draft' | 'verified' | 'warning' | 'error';

const statusConfig: Record<OTBStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'text-slate-600 dark:text-neutral-300 bg-muted/50 border-border',
  },
  verified: {
    label: 'On Track',
    className: 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  },
  warning: {
    label: 'Low OTB',
    className: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  },
  error: {
    label: 'Exhausted',
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

// OTB Data interface
export interface OTBNodeData {
  id: string;
  name: string;
  level: number; // 1-5 hierarchy levels

  // Core OTB values
  totalBudget: number;
  otbAmount: number;        // Open-to-Buy
  committed: number;        // Already committed POs
  available: number;        // otbAmount - committed
  receipts: number;         // Expected receipts
  gap: number;              // Budget gap

  // Inventory metrics
  skuCount?: number;
  orderCount?: number;      // PO count
  leadTime?: number;        // Avg lead time in days
  turnRate?: number;        // Inventory turnover
  gmroi?: number;           // Gross Margin ROI

  // Status
  status?: OTBStatus;
  allocPercent?: number;    // % of parent allocation

  // Hierarchy
  children?: OTBNodeData[];
}

// Extended KPIs
export interface OTBKPIs {
  otb: number;
  committed: number;
  available: number;
  receipts: number;
  gap: number;
  gapPercent: number;

  skuCount?: number;
  orderCount?: number;
  leadTime?: number;
  turnRate?: number;
  gmroi?: number;

  severity: Severity;
}

interface EnhancedOTBCardProps {
  node: OTBNodeData;
  onClick?: () => void;
  isExpanded?: boolean;
  hasChildren?: boolean;
}

// Level styles for hierarchy
const levelStyles: Record<number, { band: string; bg: string }> = {
  1: { band: 'border-l-blue-600 dark:border-l-emerald-500', bg: 'bg-card' },
  2: { band: 'border-l-purple-600 dark:border-l-cyan-500', bg: 'bg-muted/50 dark:bg-neutral-900' },
  3: { band: 'border-l-teal-600 dark:border-l-violet-500', bg: 'bg-card' },
  4: { band: 'border-l-amber-500 dark:border-l-orange-500', bg: 'bg-muted/50 dark:bg-neutral-900' },
  5: { band: 'border-l-rose-500 dark:border-l-pink-500', bg: 'bg-card' },
};

// Calculate KPIs from node data
function calculateKPIs(node: OTBNodeData): OTBKPIs {
  const gapPercent = node.totalBudget > 0
    ? (node.gap / node.totalBudget) * 100
    : 0;

  // Determine severity
  let severity: Severity = 'ok';
  const availablePercent = node.totalBudget > 0
    ? (node.available / node.totalBudget) * 100
    : 0;

  if (availablePercent <= 5 || node.available < 0) severity = 'critical';
  else if (availablePercent <= 15) severity = 'warning';
  else if (availablePercent <= 30) severity = 'info';

  return {
    otb: node.otbAmount,
    committed: node.committed,
    available: node.available,
    receipts: node.receipts,
    gap: node.gap,
    gapPercent,
    skuCount: node.skuCount,
    orderCount: node.orderCount,
    leadTime: node.leadTime,
    turnRate: node.turnRate,
    gmroi: node.gmroi,
    severity,
  };
}

// Determine status from node data
function determineStatus(node: OTBNodeData): OTBStatus {
  if (node.status) return node.status;

  const availablePercent = node.totalBudget > 0
    ? (node.available / node.totalBudget) * 100
    : 0;

  if (availablePercent <= 5 || node.available < 0) return 'error';
  if (availablePercent <= 15) return 'warning';
  return 'verified';
}

export function EnhancedOTBCard({
  node,
  onClick,
  isExpanded = false,
  hasChildren = false,
}: EnhancedOTBCardProps) {
  const [showKPIs, setShowKPIs] = useState(false);

  const level = Math.min(Math.max(node.level, 1), 5);
  const levelStyle = levelStyles[level] || levelStyles[1];

  const cardStatus = determineStatus(node);
  const statusStyle = statusConfig[cardStatus];
  const kpis = calculateKPIs(node);
  const SeverityIcon = severityStyles[kpis.severity].icon;

  return (
    <div
      className={cn(
        'w-full text-left',
        'border border-border rounded-xl mb-2',
        'border-l-4',
        levelStyle.band,
        levelStyle.bg,
        'hover:border-border/80 transition-all duration-200',
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
              <span className={cn(
                'px-1.5 py-0.5 text-[10px] font-medium rounded-full border',
                statusStyle.className
              )}>
                {statusStyle.label}
              </span>
            </div>

            {/* Bottom row: OTB Amount + percentage */}
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-neutral-100">
                {formatCompactCurrency(node.otbAmount)}
              </span>
              <span className="text-sm tabular-nums text-slate-500 dark:text-neutral-400">
                OTB
              </span>
              {node.allocPercent !== undefined && (
                <span className="text-sm tabular-nums text-slate-400 dark:text-neutral-500">
                  {node.allocPercent.toFixed(1)}% alloc
                </span>
              )}
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
          {/* Row 1: Core OTB Metrics */}
          <div className="grid grid-cols-5 gap-3 mb-3">
            <KPIItem
              label="OTB"
              value={formatCompactCurrency(kpis.otb)}
              icon={DollarSign}
            />
            <KPIItem
              label="Committed"
              value={formatCompactCurrency(kpis.committed)}
              icon={ShoppingCart}
            />
            <KPIItem
              label="Available"
              value={formatCompactCurrency(kpis.available)}
              icon={SeverityIcon}
              trend={kpis.available > 0 ? (kpis.severity === 'ok' ? 'up' : 'neutral') : 'down'}
              className={severityStyles[kpis.severity].color}
            />
            <KPIItem
              label="Receipt"
              value={formatCompactCurrency(kpis.receipts)}
              icon={Package}
            />
            <KPIItem
              label="Gap"
              value={`${kpis.gapPercent >= 0 ? '+' : ''}${kpis.gapPercent.toFixed(1)}%`}
              icon={kpis.gap >= 0 ? TrendingUp : TrendingDown}
              trend={kpis.gap >= 0 ? 'up' : 'down'}
            />
          </div>

          {/* Row 2: Performance Metrics */}
          <div className="grid grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-neutral-800">
            <KPIItem
              label="SKUs"
              value={kpis.skuCount ?? '—'}
              icon={Layers}
            />
            <KPIItem
              label="Orders"
              value={kpis.orderCount ?? '—'}
              icon={ShoppingCart}
              subValue="POs"
            />
            <KPIItem
              label="Lead Time"
              value={kpis.leadTime !== undefined ? `${kpis.leadTime}d` : '—'}
              icon={Clock}
              subValue="avg"
            />
            <KPIItem
              label="Turn Rate"
              value={kpis.turnRate !== undefined ? `${kpis.turnRate.toFixed(1)}x` : '—'}
              icon={RotateCw}
              trend={kpis.turnRate !== undefined ? (kpis.turnRate >= 4 ? 'up' : kpis.turnRate >= 2 ? 'neutral' : 'down') : 'neutral'}
            />
            <KPIItem
              label="GMROI"
              value={kpis.gmroi !== undefined ? `${kpis.gmroi.toFixed(1)}` : '—'}
              icon={PieChart}
              trend={kpis.gmroi !== undefined ? (kpis.gmroi >= 2 ? 'up' : kpis.gmroi >= 1 ? 'neutral' : 'down') : 'neutral'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedOTBCard;
