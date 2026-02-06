'use client';

import React, { memo, useMemo } from 'react';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================
// CURRENCY DISPLAY
// ============================================

interface CurrencyDisplayProps {
  value: number;
  currency?: string;
  locale?: string;
  compact?: boolean;
  className?: string;
}

export const CurrencyDisplay = memo(function CurrencyDisplay({
  value,
  currency = 'VND',
  locale = 'vi-VN',
  compact = false,
  className,
}: CurrencyDisplayProps) {
  const formatted = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...(compact && {
        notation: 'compact',
        compactDisplay: 'short',
      }),
    });
    return formatter.format(value);
  }, [value, currency, locale, compact]);

  return <span className={cn('font-mono tabular-nums', className)}>{formatted}</span>;
});

// ============================================
// NUMBER DISPLAY
// ============================================

interface NumberDisplayProps {
  value: number;
  decimals?: number;
  locale?: string;
  compact?: boolean;
  className?: string;
}

export const NumberDisplay = memo(function NumberDisplay({
  value,
  decimals = 0,
  locale = 'vi-VN',
  compact = false,
  className,
}: NumberDisplayProps) {
  const formatted = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...(compact && {
        notation: 'compact',
        compactDisplay: 'short',
      }),
    });
    return formatter.format(value);
  }, [value, decimals, locale, compact]);

  return <span className={cn('font-mono tabular-nums', className)}>{formatted}</span>;
});

// ============================================
// PERCENTAGE DISPLAY
// ============================================

interface PercentageDisplayProps {
  value: number;
  decimals?: number;
  showSign?: boolean;
  colorize?: boolean;
  className?: string;
}

export const PercentageDisplay = memo(function PercentageDisplay({
  value,
  decimals = 1,
  showSign = false,
  colorize = false,
  className,
}: PercentageDisplayProps) {
  const formatted = useMemo(() => {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  }, [value, decimals, showSign]);

  const colorClass = useMemo(() => {
    if (!colorize) return '';
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  }, [colorize, value]);

  return (
    <span className={cn('font-mono tabular-nums', colorClass, className)}>
      {formatted}
    </span>
  );
});

// ============================================
// DATE DISPLAY
// ============================================

interface DateDisplayProps {
  date: Date | string | number;
  formatString?: string;
  className?: string;
}

export const DateDisplay = memo(function DateDisplay({
  date,
  formatString = 'dd/MM/yyyy',
  className,
}: DateDisplayProps) {
  const formatted = useMemo(() => {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
    return formatDate(dateObj, formatString);
  }, [date, formatString]);

  return <span className={className}>{formatted}</span>;
});

// ============================================
// PERCENTAGE BAR
// ============================================

interface PercentageBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
  className?: string;
}

export const PercentageBar = memo(function PercentageBar({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  variant = 'default',
  className,
}: PercentageBarProps) {
  const percentage = useMemo(() => Math.min(Math.max((value / max) * 100, 0), 100), [value, max]);

  const heightClass = useMemo(() => {
    switch (size) {
      case 'sm': return 'h-1';
      case 'lg': return 'h-4';
      default: return 'h-2';
    }
  }, [size]);

  const colorClass = useMemo(() => {
    switch (variant) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      case 'gradient': return 'bg-gradient-to-r from-blue-500 to-purple-500';
      default: return 'bg-primary';
    }
  }, [variant]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-muted rounded-full overflow-hidden', heightClass)}>
        <div
          className={cn('h-full transition-all duration-300 rounded-full', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium tabular-nums w-12 text-right">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
});

// ============================================
// STATUS BADGE
// ============================================

type StatusType = 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'completed';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge = memo(function StatusBadge({
  status,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = useMemo(() => {
    const configs: Record<StatusType, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      pending: { label: 'Pending', className: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
      approved: { label: 'Approved', className: 'bg-green-50 text-green-800 border-green-200' },
      rejected: { label: 'Rejected', className: 'bg-red-50 text-red-800 border-red-200' },
      active: { label: 'Active', className: 'bg-blue-50 text-blue-800 border-blue-200' },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-600 border-gray-200' },
      completed: { label: 'Completed', className: 'bg-green-50 text-green-800 border-green-200' },
    };
    return configs[status] || configs.draft;
  }, [status]);

  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        sizeClass,
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
});

// ============================================
// TREND INDICATOR
// ============================================

interface TrendIndicatorProps {
  value: number;
  previousValue?: number;
  showPercentage?: boolean;
  className?: string;
}

export const TrendIndicator = memo(function TrendIndicator({
  value,
  previousValue,
  showPercentage = true,
  className,
}: TrendIndicatorProps) {
  const trend = useMemo(() => {
    if (previousValue === undefined || previousValue === 0) {
      return { direction: 'neutral' as const, change: 0 };
    }
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
      change: Math.abs(change),
    };
  }, [value, previousValue]);

  const colorClass = useMemo(() => {
    switch (trend.direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  }, [trend.direction]);

  const icon = useMemo(() => {
    switch (trend.direction) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  }, [trend.direction]);

  return (
    <span className={cn('inline-flex items-center gap-1', colorClass, className)}>
      <span>{icon}</span>
      {showPercentage && <span className="font-mono text-sm">{trend.change.toFixed(1)}%</span>}
    </span>
  );
});
