'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TrendValue, type TrendDirection } from './trend-value';
import { StatusBadge, type StatusType } from './status-badge';
import { ProgressBar } from './inline-progress';
import type { LucideIcon } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface MetricCardProps {
  title: string;
  value: string | number;

  // Optional elements
  subtitle?: string;
  trend?: {
    value: number;
    direction?: TrendDirection;
    label?: string;
  };
  status?: StatusType;
  progress?: {
    value: number;
    max?: number;
    label?: string;
  };
  icon?: LucideIcon;

  // Styling
  className?: string;
  valueClassName?: string;

  // Interaction
  onClick?: () => void;
  loading?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  status,
  progress,
  icon: Icon,
  className,
  valueClassName,
  onClick,
  loading = false,
}: MetricCardProps) {
  // Map status to unified border colors
  const statusBorderMap: Record<string, string> = {
    critical: 'border-l-red-500',
    warning: 'border-l-amber-500',
    success: 'border-l-green-500',
    info: 'border-l-blue-500',
  };

  if (loading) {
    return (
      <div className={cn(
        // Unified: rounded-xl, shadow-sm, border-l-4
        'bg-white border border-slate-200 rounded-xl p-4 border-l-4 border-l-slate-400',
        'shadow-sm',
        className
      )}>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 w-10 bg-slate-200 rounded-xl animate-pulse" />
          </div>
          <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Unified: rounded-xl, p-4, shadow-sm, hover:shadow-md, border-l-4
        'bg-white border border-slate-200 rounded-xl p-4',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'border-l-4',
        status ? statusBorderMap[status] : 'border-l-slate-400',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {status && <StatusBadge status={status} size="sm" showIcon={false} />}
        </div>
        {/* Unified: w-10 h-10 rounded-xl icon container */}
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>

      {/* Value */}
      <div className={cn('text-2xl font-bold tabular-nums text-slate-900 mb-2', valueClassName)}>
        {value}
      </div>

      {/* Progress (if provided) */}
      {progress && (
        <div className="mb-2">
          <ProgressBar
            value={progress.value}
            max={progress.max}
            showLabel
            label={progress.label}
            size="sm"
          />
        </div>
      )}

      {/* Footer: Trend or Subtitle */}
      {(trend || subtitle) && (
        <div className="flex items-center gap-2">
          {trend && (
            <>
              <TrendValue
                value={trend.value}
                direction={trend.direction}
                size="sm"
              />
              {trend.label && (
                <span className="text-xs text-slate-400">{trend.label}</span>
              )}
            </>
          )}
          {!trend && subtitle && (
            <span className="text-xs text-slate-500">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC CARD GRID
// ═══════════════════════════════════════════════════════════════════════════════

interface MetricCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function MetricCardGrid({
  children,
  columns = 4,
  className,
}: MetricCardGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT METRIC (For use in tables or dense layouts)
// ═══════════════════════════════════════════════════════════════════════════════

interface CompactMetricProps {
  label: string;
  value: string | number;
  trend?: number;
  className?: string;
}

export function CompactMetric({ label, value, trend, className }: CompactMetricProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-slate-900">{value}</span>
        {trend !== undefined && (
          <TrendValue value={trend} size="sm" showIcon={false} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { MetricCardProps, MetricCardGridProps, CompactMetricProps };
