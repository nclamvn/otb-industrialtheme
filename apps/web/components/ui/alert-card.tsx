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
// VARIANTS - Compact flat design with left border and watermark icon
// ═══════════════════════════════════════════════════════════════════════════════

const alertVariants = cva(
  'relative flex gap-3 p-3 rounded-xl border border-border bg-card overflow-hidden border-l-4',
  {
    variants: {
      variant: {
        critical: 'border-l-red-500',
        warning: 'border-l-amber-500',
        success: 'border-l-green-500',
        info: 'border-l-blue-500',
        default: 'border-l-slate-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR MAPS
// ═══════════════════════════════════════════════════════════════════════════════

const variantIconBgMap: Record<string, string> = {
  critical: 'bg-red-100 dark:bg-red-950',
  warning: 'bg-amber-100 dark:bg-amber-950',
  success: 'bg-green-100 dark:bg-green-950',
  info: 'bg-blue-100 dark:bg-blue-950',
  default: 'bg-muted',
};

const variantIconColorMap: Record<string, string> = {
  critical: 'text-red-500',
  warning: 'text-amber-500',
  success: 'text-green-500',
  info: 'text-blue-500',
  default: 'text-slate-500',
};

const variantTextColorMap: Record<string, string> = {
  critical: 'text-red-900 dark:text-red-100',
  warning: 'text-amber-900 dark:text-amber-100',
  success: 'text-green-900 dark:text-green-100',
  info: 'text-blue-900 dark:text-blue-100',
  default: 'text-foreground',
};

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
  const variantKey = variant || 'default';

  return (
    <div className={cn(alertVariants({ variant }), className)}>
      {/* Watermark Icon - Top right */}
      <div className="absolute top-2 right-2 pointer-events-none">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          variantIconBgMap[variantKey]
        )}>
          <Icon className={cn('w-5 h-5', variantIconColorMap[variantKey])} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-12 relative z-10">
        {title && (
          <h5 className={cn('font-semibold text-sm mb-0.5', variantTextColorMap[variantKey])}>
            {title}
          </h5>
        )}
        <p className="text-sm text-muted-foreground">{description}</p>
        {action && (
          <div className="mt-2">{action}</div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-14 flex-shrink-0 p-1 rounded hover:bg-muted transition-colors z-20"
        >
          <X className="w-4 h-4 text-muted-foreground" />
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

  return (
    <div className={cn(
      'flex items-center gap-2 text-xs',
      variantTextColorMap[variant],
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      <span>{message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { AlertCardProps, AlertListProps, AlertBannerProps, InlineAlertProps };
