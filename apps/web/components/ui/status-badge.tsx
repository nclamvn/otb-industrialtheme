'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  XCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Circle,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide rounded border transition-colors',
  {
    variants: {
      status: {
        critical: 'bg-status-critical-muted text-status-critical-text border-status-critical/40',
        warning: 'bg-status-warning-muted text-status-warning-text border-status-warning/40',
        success: 'bg-status-success-muted text-status-success-text border-status-success/40',
        info: 'bg-status-info-muted text-status-info-text border-status-info/40',
        pending: 'bg-surface-secondary text-content-secondary border-border',
        neutral: 'bg-surface-secondary text-content-secondary border-border',
        // DAFC Brand Variants
        gold: 'bg-dafc-gold/15 text-dafc-gold border-dafc-gold/30',
        green: 'bg-dafc-green/15 text-dafc-green-light border-dafc-green/30',
      },
      size: {
        sm: 'h-4 px-1.5 text-[9px]',
        md: 'h-5 px-2 text-[10px]',
        lg: 'h-6 px-2.5 text-xs',
      },
      // DAFC Pill style variant
      shape: {
        default: 'rounded',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      status: 'neutral',
      size: 'md',
      shape: 'default',
    },
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type StatusType = 'critical' | 'warning' | 'success' | 'info' | 'pending' | 'neutral' | 'gold' | 'green';

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  icon?: LucideIcon;
  shape?: 'default' | 'pill';
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<StatusType, { icon: LucideIcon; label: string }> = {
  critical: { icon: XCircle, label: 'Critical' },
  warning: { icon: AlertTriangle, label: 'Warning' },
  success: { icon: CheckCircle, label: 'On Track' },
  info: { icon: Info, label: 'Info' },
  pending: { icon: Clock, label: 'Pending' },
  neutral: { icon: Circle, label: 'Neutral' },
  // DAFC Brand
  gold: { icon: CheckCircle, label: 'Premium' },
  green: { icon: CheckCircle, label: 'Approved' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function StatusBadge({
  status,
  label,
  showIcon = true,
  icon,
  size,
  shape,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = icon || config.icon;
  const displayLabel = label || config.label;

  const iconSize = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  }[size || 'md'];

  return (
    <span className={cn(statusBadgeVariants({ status, size, shape }), className)}>
      {showIcon && <Icon className={iconSize} />}
      {displayLabel}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS DOT (Minimal variant)
// ═══════════════════════════════════════════════════════════════════════════════

interface StatusDotProps {
  status: StatusType;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusDot({ status, pulse = false, size = 'md', className }: StatusDotProps) {
  const dotColors = {
    critical: 'bg-status-critical shadow-[0_0_6px_rgba(248,81,73,0.5)]',
    warning: 'bg-status-warning shadow-[0_0_6px_rgba(210,153,34,0.5)]',
    success: 'bg-status-success shadow-[0_0_6px_rgba(63,185,80,0.5)]',
    info: 'bg-status-info shadow-[0_0_6px_rgba(88,166,255,0.5)]',
    pending: 'bg-content-muted',
    neutral: 'bg-content-muted',
    // DAFC Brand
    gold: 'bg-dafc-gold shadow-[0_0_6px_rgba(215,183,151,0.5)]',
    green: 'bg-dafc-green shadow-[0_0_6px_rgba(18,119,73,0.5)]',
  }[status];

  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeClasses,
        dotColors,
        pulse && 'animate-pulse',
        className
      )}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS INDICATOR (Dot with label)
// ═══════════════════════════════════════════════════════════════════════════════

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({ status, label, pulse = false, className }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label || config.label;

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <StatusDot status={status} pulse={pulse} />
      <span className="text-xs text-content-secondary">{displayLabel}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { StatusBadgeProps, StatusType, StatusDotProps, StatusIndicatorProps };
