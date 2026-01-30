'use client';

import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  LucideIcon,
} from 'lucide-react';

export type Severity = 'ok' | 'info' | 'warning' | 'critical';
export type Trend = 'up' | 'down' | 'neutral';

export interface KPIItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: Trend;
  severity?: Severity;
}

interface KPIGridProps {
  kpis: KPIItem[];
  columns?: 5 | 4 | 3;
  className?: string;
}

const trendConfig: Record<Trend, { icon: LucideIcon; color: string }> = {
  up: { icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
  down: { icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
  neutral: { icon: Minus, color: 'text-slate-500 dark:text-neutral-400' },
};

const severityConfig: Record<Severity, { icon: LucideIcon; color: string; bg: string }> = {
  ok: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
  },
  critical: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950',
  },
};

function KPIItemComponent({ kpi }: { kpi: KPIItem }) {
  const TrendIcon = kpi.trend ? trendConfig[kpi.trend].icon : null;
  const SeverityIcon = kpi.severity ? severityConfig[kpi.severity].icon : null;
  const Icon = kpi.icon || SeverityIcon || TrendIcon;

  const getValueColor = () => {
    if (kpi.severity) return severityConfig[kpi.severity].color;
    if (kpi.trend) return trendConfig[kpi.trend].color;
    return 'text-slate-900 dark:text-neutral-100';
  };

  const getIconColor = () => {
    if (kpi.severity) return severityConfig[kpi.severity].color;
    if (kpi.trend) return trendConfig[kpi.trend].color;
    return 'text-slate-500 dark:text-neutral-400';
  };

  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-0.5">
        {kpi.label}
      </span>
      <div className="flex items-center gap-1">
        {Icon && <Icon className={cn('w-3.5 h-3.5', getIconColor())} />}
        <span className={cn('text-sm font-semibold tabular-nums', getValueColor())}>
          {kpi.value}
        </span>
      </div>
      {kpi.subtext && (
        <span className="text-[10px] text-slate-400 dark:text-neutral-500">
          {kpi.subtext}
        </span>
      )}
    </div>
  );
}

export function KPIGrid({ kpis, columns = 5, className }: KPIGridProps) {
  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {kpis.map((kpi, index) => (
        <KPIItemComponent key={index} kpi={kpi} />
      ))}
    </div>
  );
}

export default KPIGrid;
