'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Minus,
} from 'lucide-react';
import {
  VarianceResult,
  VarianceLevel,
  getVarianceColors,
  calculateVariance,
  VarianceThresholds,
  DEFAULT_THRESHOLDS,
} from '@/lib/variance-utils';

interface VarianceIndicatorProps {
  // Option 1: Pass pre-calculated variance
  variance?: VarianceResult;
  // Option 2: Pass values to calculate variance
  actual?: number;
  target?: number;
  thresholds?: VarianceThresholds;
  positiveIsGood?: boolean;
  // Display options
  showIcon?: boolean;
  showPercentage?: boolean;
  showAbsolute?: boolean;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    badge: 'text-[10px] px-1.5 py-0.5',
    gap: 'gap-1',
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    badge: 'text-xs px-2 py-1',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-base',
    badge: 'text-sm px-2.5 py-1.5',
    gap: 'gap-2',
  },
};

function getIcon(level: VarianceLevel, direction: string) {
  switch (level) {
    case 'critical':
      return direction === 'over' ? TrendingUp : TrendingDown;
    case 'warning':
      return AlertTriangle;
    case 'minor':
      return AlertCircle;
    case 'positive':
      return TrendingUp;
    default:
      return CheckCircle2;
  }
}

export function VarianceIndicator({
  variance: providedVariance,
  actual,
  target,
  thresholds = DEFAULT_THRESHOLDS,
  positiveIsGood = true,
  showIcon = true,
  showPercentage = true,
  showAbsolute = false,
  showBadge = false,
  size = 'md',
  compact = false,
  className,
}: VarianceIndicatorProps) {
  // Calculate variance if not provided
  const variance = providedVariance ??
    (actual !== undefined && target !== undefined
      ? calculateVariance(actual, target, thresholds, positiveIsGood)
      : null);

  if (!variance) {
    return null;
  }

  const colors = getVarianceColors(variance.level);
  const sizeConfig = sizeClasses[size];
  const Icon = getIcon(variance.level, variance.direction);

  // Don't show anything if on target and compact mode
  if (compact && variance.level === 'on-target') {
    return (
      <span className={cn('flex items-center', sizeConfig.gap, className)}>
        <Minus className={cn(sizeConfig.icon, 'text-gray-400')} />
      </span>
    );
  }

  // Badge style rendering
  if (showBadge) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          sizeConfig.badge,
          sizeConfig.gap,
          colors.bg,
          colors.text,
          colors.border,
          'border',
          className
        )}
      >
        {showIcon && <Icon className={cn(sizeConfig.icon, colors.icon)} />}
        {showPercentage && (
          <span>{variance.formattedPercentage}</span>
        )}
        {showAbsolute && !showPercentage && (
          <span>{variance.formattedAbsolute}</span>
        )}
      </span>
    );
  }

  // Inline style rendering
  return (
    <span
      className={cn(
        'inline-flex items-center',
        sizeConfig.gap,
        colors.text,
        className
      )}
    >
      {showIcon && <Icon className={cn(sizeConfig.icon, colors.icon)} />}
      <span className={cn('font-mono font-medium', sizeConfig.text)}>
        {showPercentage && variance.formattedPercentage}
        {showAbsolute && showPercentage && (
          <span className="text-muted-foreground ml-1">
            ({variance.formattedAbsolute})
          </span>
        )}
        {showAbsolute && !showPercentage && variance.formattedAbsolute}
      </span>
    </span>
  );
}

// Convenience components for specific use cases
export function CriticalVarianceIndicator(props: Omit<VarianceIndicatorProps, 'variance'> & { actual: number; target: number }) {
  return <VarianceIndicator {...props} showBadge size="sm" />;
}

// Table cell wrapper with variance highlighting
interface VarianceCellProps extends VarianceIndicatorProps {
  value: React.ReactNode;
  highlightCell?: boolean;
}

export function VarianceCell({
  value,
  highlightCell = true,
  variance: providedVariance,
  actual,
  target,
  thresholds = DEFAULT_THRESHOLDS,
  positiveIsGood = true,
  className,
  ...indicatorProps
}: VarianceCellProps) {
  const variance = providedVariance ??
    (actual !== undefined && target !== undefined
      ? calculateVariance(actual, target, thresholds, positiveIsGood)
      : null);

  const colors = variance ? getVarianceColors(variance.level) : null;
  const shouldHighlight = highlightCell && variance?.isSignificant;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 px-2 py-1 rounded transition-colors',
        shouldHighlight && colors && colors.bg,
        className
      )}
    >
      <span className="font-mono">{value}</span>
      {variance && (
        <VarianceIndicator
          variance={variance}
          showIcon
          showPercentage
          size="sm"
          compact
          {...indicatorProps}
        />
      )}
    </div>
  );
}
