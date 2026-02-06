'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// ACCENT COLOR TYPES & MAPS
// ═══════════════════════════════════════════════════════════════════════════════

type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'amber' | 'cyan' | 'pink' | 'default';

const accentBorderMap: Record<AccentColor, string> = {
  blue: 'border-l-blue-500',
  purple: 'border-l-purple-500',
  green: 'border-l-green-500',
  orange: 'border-l-orange-500',
  red: 'border-l-red-500',
  amber: 'border-l-amber-500',
  cyan: 'border-l-cyan-500',
  pink: 'border-l-pink-500',
  default: 'border-l-slate-400',
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
  default: 'bg-muted',
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
  default: 'text-slate-500',
};

// Map status to accent color
const statusToAccent: Record<string, AccentColor> = {
  default: 'default',
  critical: 'red',
  warning: 'amber',
  success: 'green',
  info: 'blue',
  gold: 'amber',
};

// ═══════════════════════════════════════════════════════════════════════════════
// KPI CARD VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

const kpiCardVariants = cva(
  'relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-border/80 border-l-4',
  {
    variants: {
      status: {
        default: 'border-l-slate-400',
        critical: 'border-l-red-500',
        warning: 'border-l-amber-500',
        success: 'border-l-green-500',
        info: 'border-l-blue-500',
        gold: 'border-l-amber-500',
        green: 'border-l-green-500',
      },
      size: {
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4',
      },
    },
    defaultVariants: {
      status: 'default',
      size: 'md',
    },
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  label?: string;
}

interface KPICardProps extends VariantProps<typeof kpiCardVariants> {
  label: string;
  value: string | number | React.ReactNode;
  trend?: TrendData;
  icon?: LucideIcon | React.ReactNode;
  subtitle?: string;
  accent?: AccentColor;
  className?: string;
  loading?: boolean;
  onClick?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function KPICard({
  label,
  value,
  trend,
  status,
  size,
  icon,
  subtitle,
  accent,
  className,
  loading = false,
  onClick,
}: KPICardProps) {
  // Determine accent color from status or prop
  const accentColor: AccentColor = accent || (status ? statusToAccent[status] || 'default' : 'default');

  // Trend icon and color
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  // Unified health-based trend colors
  const getTrendColor = () => {
    if (!trend) return '';

    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'down':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
      default:
        return 'text-slate-500 dark:text-slate-400 bg-muted/50 dark:bg-slate-900';
    }
  };

  const formatTrendValue = (val: number) => {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn(kpiCardVariants({ status: 'default', size }), className)}>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          <div className="h-7 w-20 bg-muted rounded animate-pulse" />
          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Render watermark icon - Large, faded into background
  const renderWatermarkIcon = () => {
    if (!icon) return null;

    // Check if icon is a LucideIcon component
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return (
        <div className="absolute -right-4 -bottom-4 pointer-events-none">
          <IconComponent className={cn('w-24 h-24 opacity-[0.08]', accentIconColorMap[accentColor])} />
        </div>
      );
    }

    // Otherwise it's a ReactNode - render as large watermark
    return (
      <div className="absolute -right-4 -bottom-4 pointer-events-none">
        <span className={cn('text-[96px] leading-none opacity-[0.08]', accentIconColorMap[accentColor])}>{icon}</span>
      </div>
    );
  };

  return (
    <div
      className={cn(
        kpiCardVariants({ status, size }),
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Watermark Icon */}
      {renderWatermarkIcon()}

      {/* Content */}
      <div className="relative z-10">
        {/* Label */}
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
          {label}
        </span>

        {/* Value */}
        <div className={cn('mb-1', icon && 'pr-14')}>
          {typeof value === 'string' || typeof value === 'number' ? (
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {value}
            </span>
          ) : (
            value
          )}
        </div>

        {/* Trend & Subtitle */}
        <div className="flex items-center gap-2 flex-wrap">
          {trend && (
            <span className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium',
              getTrendColor()
            )}>
              {getTrendIcon()}
              <span className="tabular-nums">{formatTrendValue(trend.value)}</span>
            </span>
          )}
          {trend?.label && (
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          )}
          {subtitle && !trend && (
            <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI CARD GRID
// ═══════════════════════════════════════════════════════════════════════════════

interface KPICardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function KPICardGrid({
  children,
  columns = 4,
  className
}: KPICardGridProps) {
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
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { KPICardProps, TrendData, KPICardGridProps, AccentColor };
