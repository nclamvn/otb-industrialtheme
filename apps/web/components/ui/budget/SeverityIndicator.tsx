'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, Info, AlertTriangle, XCircle, LucideIcon } from 'lucide-react';

export type Severity = 'ok' | 'info' | 'warning' | 'critical';

interface SeverityIndicatorProps {
  severity: Severity;
  label?: string;
  showDot?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const severityConfig: Record<
  Severity,
  {
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
    dot: string;
    label: string;
  }
> = {
  ok: {
    icon: CheckCircle,
    color: 'text-green-700 dark:text-green-300',
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    label: 'OK',
  },
  info: {
    icon: Info,
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    label: 'Info',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    label: 'Warning',
  },
  critical: {
    icon: XCircle,
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    label: 'Critical',
  },
};

const sizeConfig = {
  sm: {
    wrapper: 'px-1.5 py-0.5 text-[10px]',
    icon: 'w-3 h-3',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    wrapper: 'px-2 py-1 text-xs',
    icon: 'w-3.5 h-3.5',
    dot: 'w-2 h-2',
  },
  lg: {
    wrapper: 'px-2.5 py-1.5 text-sm',
    icon: 'w-4 h-4',
    dot: 'w-2.5 h-2.5',
  },
};

export function SeverityIndicator({
  severity,
  label,
  showDot = false,
  showIcon = true,
  size = 'md',
  className,
}: SeverityIndicatorProps) {
  const config = severityConfig[severity];
  const sizes = sizeConfig[size];
  const Icon = config.icon;
  const displayLabel = label ?? config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.bg,
        config.border,
        config.color,
        sizes.wrapper,
        className
      )}
    >
      {showDot && <span className={cn('rounded-full', config.dot, sizes.dot)} />}
      {showIcon && !showDot && <Icon className={sizes.icon} />}
      {displayLabel}
    </span>
  );
}

// Utility function to determine severity from percentage
export function getSeverityFromPercentage(
  value: number,
  thresholds: { ok: number; info: number; warning: number } = { ok: 5, info: 10, warning: 20 }
): Severity {
  const absValue = Math.abs(value);
  if (absValue <= thresholds.ok) return 'ok';
  if (absValue <= thresholds.info) return 'info';
  if (absValue <= thresholds.warning) return 'warning';
  return 'critical';
}

// Utility function to determine severity from sell-through
export function getSeverityFromSellThrough(sellThruPercent: number): Severity {
  if (sellThruPercent >= 70) return 'ok';
  if (sellThruPercent >= 50) return 'info';
  if (sellThruPercent >= 30) return 'warning';
  return 'critical';
}

// Utility function to determine severity from OTB availability
export function getSeverityFromOTB(available: number, total: number): Severity {
  if (total <= 0) return 'critical';
  const percent = (available / total) * 100;
  if (percent >= 30) return 'ok';
  if (percent >= 15) return 'info';
  if (percent >= 5) return 'warning';
  return 'critical';
}

export default SeverityIndicator;
