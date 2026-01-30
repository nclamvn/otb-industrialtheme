'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type VarianceType = 'positive' | 'negative' | 'neutral' | 'warning' | 'critical';

interface VarianceIndicatorProps {
  value: number;
  format?: 'percent' | 'absolute' | 'currency';
  showIcon?: boolean;
  showSign?: boolean;
  size?: 'sm' | 'md' | 'lg';
  threshold?: {
    warning?: number;
    critical?: number;
  };
  invertColors?: boolean; // For metrics where negative is good
  tooltip?: string;
  className?: string;
}

const getVarianceType = (
  value: number,
  threshold?: { warning?: number; critical?: number },
  invertColors?: boolean
): VarianceType => {
  const absValue = Math.abs(value);

  // Check thresholds first
  if (threshold?.critical && absValue >= threshold.critical) {
    return 'critical';
  }
  if (threshold?.warning && absValue >= threshold.warning) {
    return 'warning';
  }

  // Base variance type
  if (value > 0.5) return invertColors ? 'negative' : 'positive';
  if (value < -0.5) return invertColors ? 'positive' : 'negative';
  return 'neutral';
};

const formatValue = (
  value: number,
  format: 'percent' | 'absolute' | 'currency',
  showSign: boolean
): string => {
  const sign = showSign && value > 0 ? '+' : '';

  switch (format) {
    case 'percent':
      return `${sign}${value.toFixed(1)}%`;
    case 'currency':
      const formatted = Math.abs(value) >= 1000000
        ? `${(Math.abs(value) / 1000000).toFixed(1)}M`
        : Math.abs(value) >= 1000
        ? `${(Math.abs(value) / 1000).toFixed(1)}K`
        : Math.abs(value).toLocaleString();
      return `${sign}$${formatted}`;
    case 'absolute':
    default:
      return `${sign}${value.toLocaleString()}`;
  }
};

export function VarianceIndicator({
  value,
  format = 'percent',
  showIcon = true,
  showSign = true,
  size = 'md',
  threshold,
  invertColors = false,
  tooltip,
  className,
}: VarianceIndicatorProps) {
  const type = getVarianceType(value, threshold, invertColors);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const colorClasses = {
    positive: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    negative: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    critical: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  };

  const Icon = {
    positive: TrendingUp,
    negative: TrendingDown,
    neutral: Minus,
    warning: AlertTriangle,
    critical: AlertTriangle,
  }[type];

  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size],
        colorClasses[type],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {formatValue(value, format, showSign)}
    </span>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default VarianceIndicator;
