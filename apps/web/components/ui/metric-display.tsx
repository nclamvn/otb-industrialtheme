'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricDisplayProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MetricDisplay({
  label,
  value,
  change,
  changeLabel = 'vs previous',
  trend,
  format = 'number',
  size = 'md',
  className,
}: MetricDisplayProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'currency':
        if (val >= 1000000) {
          return `$${(val / 1000000).toFixed(1)}M`;
        }
        if (val >= 1000) {
          return `$${(val / 1000).toFixed(0)}K`;
        }
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const sizes = {
    sm: { label: 'text-xs', value: 'text-lg', change: 'text-xs' },
    md: { label: 'text-xs', value: 'text-2xl', change: 'text-sm' },
    lg: { label: 'text-sm', value: 'text-4xl', change: 'text-sm' },
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className={cn('font-medium text-muted-foreground uppercase tracking-wider', sizes[size].label)}>
        {label}
      </span>
      <span className={cn('font-bold text-foreground tracking-tight font-metric', sizes[size].value)}>
        {formatValue(value)}
      </span>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1', trendColor, sizes[size].change)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="font-medium">
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
