'use client';

import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  ChevronRight,
  X,
  Bell,
} from 'lucide-react';
import { useState } from 'react';

type AlertSeverity = 'critical' | 'warning' | 'success' | 'info';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  timestamp: Date;
  actionLabel?: string;
  actionUrl?: string;
  dismissible?: boolean;
}

interface DAFCAlertsPanelProps {
  alerts: Alert[];
  title?: string;
  maxVisible?: number;
  onAlertClick?: (alert: Alert) => void;
  onDismiss?: (alertId: string) => void;
  className?: string;
}

// Unified severity config with border-l-4 styling
const severityConfig: Record<AlertSeverity, {
  icon: typeof AlertTriangle;
  bgClass: string;
  borderClass: string;
  iconClass: string;
  glowClass: string;
  badgeClass: string;
}> = {
  critical: {
    icon: AlertCircle,
    bgClass: 'bg-red-50 dark:bg-red-950',
    borderClass: 'border-l-red-500',
    iconClass: 'text-red-600',
    glowClass: 'glow-critical',
    badgeClass: 'bg-red-50 dark:bg-red-950 text-red-700 border border-red-200',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 dark:bg-amber-950',
    borderClass: 'border-l-amber-500',
    iconClass: 'text-amber-600',
    glowClass: 'glow-warning',
    badgeClass: 'bg-amber-50 dark:bg-amber-950 text-amber-700 border border-amber-200',
  },
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-950',
    borderClass: 'border-l-green-500',
    iconClass: 'text-green-600',
    glowClass: 'glow-success',
    badgeClass: 'bg-green-50 dark:bg-green-950 text-green-700 border border-green-200',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-950',
    borderClass: 'border-l-blue-500',
    iconClass: 'text-blue-600',
    glowClass: 'glow-info',
    badgeClass: 'bg-blue-50 dark:bg-blue-950 text-blue-700 border border-blue-200',
  },
};

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const AlertItem = ({
  alert,
  onDismiss,
  onClick,
}: {
  alert: Alert;
  onDismiss?: () => void;
  onClick?: () => void;
}) => {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        // Flat design: rounded-xl, border-l-4, no shadow
        'relative p-3 rounded-xl border border-border bg-card',
        'border-l-4 hover:border-border/80 transition-all duration-200',
        config.borderClass,
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Unified: rounded-xl icon container */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
          config.bgClass
        )}>
          <Icon className={cn('h-4 w-4', config.iconClass)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-neutral-100">
              {alert.title}
            </h4>
            {alert.dismissible && onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="p-1 rounded-full hover:bg-muted dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
            {alert.description}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-neutral-500">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(alert.timestamp)}
            </span>
            {alert.actionLabel && (
              <button className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-0.5">
                {alert.actionLabel}
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function DAFCAlertsPanel({
  alerts,
  title = 'Active Alerts',
  maxVisible = 5,
  onAlertClick,
  onDismiss,
  className,
}: DAFCAlertsPanelProps) {
  const [showAll, setShowAll] = useState(false);

  // Sort by severity (critical first) then by timestamp
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const visibleAlerts = showAll ? sortedAlerts : sortedAlerts.slice(0, maxVisible);
  const hasMore = sortedAlerts.length > maxVisible;

  // Count by severity
  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
    success: alerts.filter((a) => a.severity === 'success').length,
  };

  return (
    <div
      className={cn(
        // Flat design: rounded-xl, no shadow, border-l-4
        'rounded-xl border border-border bg-card overflow-hidden',
        'hover:border-border/80 transition-all duration-200',
        'border-l-4 border-l-amber-500',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Unified: w-10 h-10 rounded-xl icon container */}
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-neutral-100">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Severity counts - unified badge styling */}
          <div className="flex items-center gap-2">
            {counts.critical > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950 text-red-700 border border-red-200">{counts.critical}</span>
            )}
            {counts.warning > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950 text-amber-700 border border-amber-200">{counts.warning}</span>
            )}
            {counts.info > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 border border-blue-200">{counts.info}</span>
            )}
          </div>
        </div>
      </div>

      {/* Alerts list */}
      <div className="p-4 space-y-2">
        {visibleAlerts.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-neutral-400">No active alerts</p>
          </div>
        ) : (
          <>
            {visibleAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={alert.dismissible && onDismiss ? () => onDismiss(alert.id) : undefined}
                onClick={onAlertClick ? () => onAlertClick(alert) : undefined}
              />
            ))}

            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-2 text-center text-xs font-semibold uppercase tracking-wide text-amber-600 hover:text-amber-700 transition-colors"
              >
                {showAll ? 'Show Less' : `Show ${sortedAlerts.length - maxVisible} More`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DAFCAlertsPanel;
