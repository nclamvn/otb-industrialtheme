'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type TrendDirection = 'up' | 'down' | 'neutral';

interface TrendValueProps {
  value: number;
  direction?: TrendDirection;
  suffix?: string;
  showIcon?: boolean;
  showSign?: boolean;
  size?: 'sm' | 'md' | 'lg';
  inverse?: boolean; // For metrics where down is good (e.g., costs, errors)
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function TrendValue({
  value,
  direction: explicitDirection,
  suffix = '%',
  showIcon = true,
  showSign = true,
  size = 'md',
  inverse = false,
  className,
}: TrendValueProps) {
  // Auto-detect direction if not provided
  const direction = explicitDirection ?? (
    value > 0 ? 'up' : value < 0 ? 'down' : 'neutral'
  );

  // Determine color based on direction and inverse
  const getColor = () => {
    if (direction === 'neutral') return 'text-data-neutral';

    const isPositive = direction === 'up';
    const isGood = inverse ? !isPositive : isPositive;

    return isGood ? 'text-data-positive' : 'text-data-negative';
  };

  // Icon component
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  }[direction];

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  // Format value
  const formattedValue = Math.abs(value).toFixed(1);
  const sign = showSign && value !== 0 ? (value > 0 ? '+' : '-') : '';

  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-medium font-data tabular-nums',
      sizeClasses,
      getColor(),
      className
    )}>
      {showIcon && <TrendIcon className={iconSizes} />}
      <span>{sign}{formattedValue}{suffix}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREND COMPARISON (with vs label)
// ═══════════════════════════════════════════════════════════════════════════════

interface TrendComparisonProps extends Omit<TrendValueProps, 'suffix'> {
  label?: string;
}

export function TrendComparison({
  label = 'vs LY',
  ...props
}: TrendComparisonProps) {
  return (
    <div className="flex items-center gap-2">
      <TrendValue {...props} suffix="%" />
      <span className="text-xs text-content-muted">{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREND DELTA (Shows actual change with arrow)
// ═══════════════════════════════════════════════════════════════════════════════

interface TrendDeltaProps {
  current: number;
  previous: number;
  format?: 'percent' | 'absolute';
  inverse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function TrendDelta({
  current,
  previous,
  format = 'percent',
  inverse = false,
  size = 'md',
  label,
  className,
}: TrendDeltaProps) {
  const delta = current - previous;
  const percentChange = previous !== 0 ? ((delta / previous) * 100) : 0;

  const value = format === 'percent' ? percentChange : delta;
  const suffix = format === 'percent' ? '%' : '';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TrendValue
        value={value}
        suffix={suffix}
        inverse={inverse}
        size={size}
      />
      {label && <span className="text-xs text-content-muted">{label}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { TrendValueProps, TrendDirection, TrendComparisonProps, TrendDeltaProps };
