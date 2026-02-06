'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type ProgressVariant = 'default' | 'success' | 'warning' | 'critical' | 'auto';

interface InlineProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  width?: number | string;
  thresholds?: { warning: number; critical: number };
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE PROGRESS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function InlineProgress({
  value,
  max = 100,
  variant = 'auto',
  showLabel = true,
  showValue = false,
  size = 'sm',
  width = 60,
  thresholds = { warning: 40, critical: 30 },
  className,
}: InlineProgressProps) {
  // Calculate percentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Auto-determine variant based on thresholds
  const getVariant = (): ProgressVariant => {
    if (variant !== 'auto') return variant;

    if (percentage >= 70) return 'success';
    if (percentage >= thresholds.warning) return 'warning';
    return 'critical';
  };

  const resolvedVariant = getVariant();

  // Variant colors
  const variantClasses = {
    default: 'bg-accent',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    critical: 'bg-status-critical',
    auto: 'bg-accent',
  }[resolvedVariant];

  // Size classes
  const heightClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  }[size];

  const textClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  }[size];

  const textColorClasses = {
    success: 'text-status-success',
    warning: 'text-status-warning',
    critical: 'text-status-critical',
    default: 'text-content-secondary',
    auto: 'text-content-secondary',
  }[resolvedVariant];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Progress bar */}
      <div
        className={cn('bg-surface-secondary rounded-full overflow-hidden', heightClasses)}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', variantClasses)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <span className={cn('font-data tabular-nums', textClasses, textColorClasses)}>
          {showValue ? value.toFixed(0) : `${percentage.toFixed(0)}%`}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR (Full width variant)
// ═══════════════════════════════════════════════════════════════════════════════

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  showLabel = false,
  label,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantClasses = {
    default: 'bg-accent',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    critical: 'bg-status-critical',
    auto: 'bg-accent',
  }[variant];

  const heightClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  }[size];

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-xs">
          <span className="text-content-secondary">{label}</span>
          <span className="font-data tabular-nums text-content">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-surface-secondary rounded-full overflow-hidden', heightClasses)}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', variantClasses)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENTED PROGRESS (For OTB usage tracking)
// ═══════════════════════════════════════════════════════════════════════════════

interface SegmentedProgressProps {
  segments: Array<{
    value: number;
    label?: string;
    color?: string;
  }>;
  total?: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SegmentedProgress({
  segments,
  total,
  showLabels = true,
  size = 'md',
  className,
}: SegmentedProgressProps) {
  const calculatedTotal = total ?? segments.reduce((acc, seg) => acc + seg.value, 0);

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  const defaultColors = [
    'bg-accent',
    'bg-status-success',
    'bg-status-warning',
    'bg-status-critical',
    'bg-status-info',
    'bg-ai',
  ];

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className={cn('w-full bg-surface-secondary rounded-full overflow-hidden flex', heightClasses)}>
        {segments.map((segment, index) => {
          const percentage = calculatedTotal > 0 ? (segment.value / calculatedTotal) * 100 : 0;
          const color = segment.color || defaultColors[index % defaultColors.length];
          return (
            <div
              key={index}
              className={cn('h-full first:rounded-l-full last:rounded-r-full', color)}
              style={{ width: `${percentage}%` }}
            />
          );
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between mt-1.5 text-[10px]">
          {segments.map((segment, index) => {
            const color = segment.color || defaultColors[index % defaultColors.length];
            return (
              <div key={index} className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-sm', color)} />
                <span className="text-content-secondary">
                  {segment.label || `Segment ${index + 1}`}
                </span>
                <span className="font-data tabular-nums text-content-muted">
                  {segment.value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { InlineProgressProps, ProgressBarProps, SegmentedProgressProps, ProgressVariant };
