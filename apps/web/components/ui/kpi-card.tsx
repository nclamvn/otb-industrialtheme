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
// KPI CARD VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

// Unified design: rounded-xl, p-4, border-l-4, shadow-sm, hover:shadow-md
const kpiCardVariants = cva(
  'bg-white border border-slate-200 rounded-xl relative overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md border-l-4',
  {
    variants: {
      status: {
        default: 'border-l-slate-400',
        critical: 'border-l-red-500',
        warning: 'border-l-amber-500',
        success: 'border-l-green-500',
        info: 'border-l-blue-500',
        // DAFC Brand Variants
        gold: 'border-l-amber-500',
        green: 'border-l-green-500',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
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
  className,
  loading = false,
  onClick,
}: KPICardProps) {
  // Trend icon and color
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'down':
        return <TrendingDown className="w-3.5 h-3.5" />;
      default:
        return <Minus className="w-3.5 h-3.5" />;
    }
  };

  // Unified health-based trend colors
  const getTrendColor = () => {
    if (!trend) return '';

    switch (trend.direction) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-500 bg-slate-50';
    }
  };

  const formatTrendValue = (val: number) => {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn(kpiCardVariants({ status, size }), className)}>
        <div className="space-y-3">
          <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Render icon - Unified: w-10 h-10 rounded-xl icon container
  const renderIcon = () => {
    if (!icon) return null;

    // Check if icon is a LucideIcon component
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return (
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <IconComponent className="w-5 h-5 text-slate-600" />
        </div>
      );
    }

    // Otherwise it's a ReactNode
    return <span className="text-slate-600">{icon}</span>;
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
      {/* Header: Label + Icon */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {renderIcon()}
      </div>

      {/* Value */}
      <div className="mb-1">
        {typeof value === 'string' || typeof value === 'number' ? (
          <span className="text-2xl font-bold tabular-nums text-slate-900">
            {value}
          </span>
        ) : (
          value
        )}
      </div>

      {/* Trend & Subtitle */}
      <div className="flex items-center gap-2">
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
          <span className="text-xs text-slate-400">{trend.label}</span>
        )}
        {subtitle && !trend && (
          <span className="text-xs text-slate-500">{subtitle}</span>
        )}
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
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { KPICardProps, TrendData, KPICardGridProps };
