'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  X,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

// Unified design: rounded-xl, p-4, border-l-4, shadow-sm
const alertVariants = cva(
  'relative flex gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm border-l-4',
  {
    variants: {
      variant: {
        critical: 'bg-red-50/50 border-l-red-500 text-red-900',
        warning: 'bg-amber-50/50 border-l-amber-500 text-amber-900',
        success: 'bg-green-50/50 border-l-green-500 text-green-900',
        info: 'bg-blue-50/50 border-l-blue-500 text-blue-900',
        default: 'bg-white border-l-slate-400 text-slate-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AlertCardProps extends VariantProps<typeof alertVariants> {
  title?: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const ALERT_ICONS: Record<string, LucideIcon> = {
  critical: XCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  default: Info,
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AlertCard({
  title,
  description,
  variant = 'default',
  icon,
  action,
  dismissible = false,
  onDismiss,
  className,
}: AlertCardProps) {
  const Icon = icon || ALERT_ICONS[variant || 'default'];

  return (
    <div className={cn(alertVariants({ variant }), className)}>
      {/* Icon */}
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h5 className="font-semibold text-sm mb-1">{title}</h5>
        )}
        <p className="text-sm opacity-90">{description}</p>
        {action && (
          <div className="mt-3">{action}</div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface AlertListProps {
  alerts: Array<{
    id: string;
    variant?: 'critical' | 'warning' | 'success' | 'info' | 'default';
    title?: string;
    description: string;
  }>;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function AlertList({ alerts, onDismiss, className }: AlertListProps) {
  if (alerts.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          variant={alert.variant}
          title={alert.title}
          description={alert.description}
          dismissible={!!onDismiss}
          onDismiss={() => onDismiss?.(alert.id)}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT BANNER (Full-width for page-level alerts)
// ═══════════════════════════════════════════════════════════════════════════════

interface AlertBannerProps extends AlertCardProps {
  fullWidth?: boolean;
}

export function AlertBanner({
  fullWidth = true,
  className,
  ...props
}: AlertBannerProps) {
  return (
    <AlertCard
      {...props}
      className={cn(
        fullWidth && 'rounded-none border-x-0',
        className
      )}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE ALERT (Compact, for use within forms)
// ═══════════════════════════════════════════════════════════════════════════════

interface InlineAlertProps {
  variant?: 'critical' | 'warning' | 'success' | 'info';
  message: string;
  className?: string;
}

export function InlineAlert({ variant = 'info', message, className }: InlineAlertProps) {
  const Icon = ALERT_ICONS[variant];

  // Unified color classes
  const colorClasses = {
    critical: 'text-red-600',
    warning: 'text-amber-600',
    success: 'text-green-600',
    info: 'text-blue-600',
  }[variant];

  return (
    <div className={cn('flex items-center gap-2 text-xs', colorClasses, className)}>
      <Icon className="w-3.5 h-3.5" />
      <span>{message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { AlertCardProps, AlertListProps, AlertBannerProps, InlineAlertProps };
