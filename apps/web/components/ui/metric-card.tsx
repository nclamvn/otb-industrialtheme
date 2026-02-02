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

type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'amber' | 'cyan' | 'pink';

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

  // Accent color for left border and icon
  accent?: AccentColor;

  // Styling
  className?: string;
  valueClassName?: string;

  // Interaction
  onClick?: () => void;
  loading?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCENT COLOR MAPS
// ═══════════════════════════════════════════════════════════════════════════════

const accentBorderMap: Record<AccentColor, string> = {
  blue: 'border-l-blue-500',
  purple: 'border-l-purple-500',
  green: 'border-l-green-500',
  orange: 'border-l-orange-500',
  red: 'border-l-red-500',
  amber: 'border-l-amber-500',
  cyan: 'border-l-cyan-500',
  pink: 'border-l-pink-500',
};

const accentIconBgMap: Record<AccentColor, string> = {
  blue: 'bg-blue-100 dark:bg-blue-950',
  purple: 'bg-purple-100 dark:bg-purple-950',
  green: 'bg-green-100 dark:bg-green-950',
  orange: 'bg-orange-100 dark:bg-orange-950',
  red: 'bg-red-100 dark:bg-red-950',
  amber: 'bg-amber-100 dark:bg-amber-950',
  cyan: 'bg-cyan-100 dark:bg-cyan-950',
  pink: 'bg-pink-100 dark:bg-pink-950',
};

const accentIconColorMap: Record<AccentColor, string> = {
  blue: 'text-blue-500',
  purple: 'text-purple-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  red: 'text-red-500',
  amber: 'text-amber-500',
  cyan: 'text-cyan-500',
  pink: 'text-pink-500',
};

// Map status to accent color
const statusToAccent: Record<string, AccentColor> = {
  critical: 'red',
  warning: 'amber',
  success: 'green',
  info: 'blue',
};

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
  accent,
  className,
  valueClassName,
  onClick,
  loading = false,
}: MetricCardProps) {
  // Determine accent color from status or prop
  const accentColor: AccentColor = accent || (status ? statusToAccent[status] : 'blue');

  if (loading) {
    return (
      <div className={cn(
        'relative bg-card border border-border rounded-xl p-3 border-l-4 border-l-slate-300 overflow-hidden',
        className
      )}>
        <div className="space-y-2">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          <div className="h-7 w-28 bg-muted rounded animate-pulse" />
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative bg-card border border-border rounded-xl p-3 overflow-hidden',
        'hover:border-border/80 transition-all duration-200',
        'border-l-4',
        accentBorderMap[accentColor],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Watermark Icon - Large, faded into background */}
      {Icon && (
        <div className="absolute -right-4 -bottom-4 pointer-events-none">
          <Icon className={cn('w-24 h-24 opacity-[0.08]', accentIconColorMap[accentColor])} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {status && <StatusBadge status={status} size="sm" showIcon={false} />}
        </div>

        {/* Value */}
        <div className={cn(
          'text-2xl font-bold tabular-nums text-foreground mb-1',
          Icon && 'pr-14', // Make room for watermark icon
          valueClassName
        )}>
          {value}
        </div>

        {/* Progress (if provided) */}
        {progress && (
          <div className="mb-1">
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
          <div className="flex items-center gap-2 flex-wrap">
            {trend && (
              <>
                <TrendValue
                  value={trend.value}
                  direction={trend.direction}
                  size="sm"
                />
                {trend.label && (
                  <span className="text-xs text-muted-foreground">{trend.label}</span>
                )}
              </>
            )}
            {!trend && subtitle && (
              <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
            )}
          </div>
        )}
      </div>
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
    <div className={cn('grid gap-3', gridCols[columns], className)}>
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
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
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

export type { MetricCardProps, MetricCardGridProps, CompactMetricProps, AccentColor };
