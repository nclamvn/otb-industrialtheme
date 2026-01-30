'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { BudgetStatusBadge } from '@/components/ui/budget';

interface ProactiveAlert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  entity?: {
    type: string;
    id: string;
    name: string;
  };
  metric?: {
    current: number;
    threshold: number;
    unit: string;
  };
  createdAt: string;
  actionRequired: boolean;
}

interface AlertSummary {
  critical: number;
  warning: number;
  info: number;
  total: number;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50',
    borderColor: 'border-l-red-500',
    badge: 'destructive' as const,
    label: 'Critical',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-600 bg-amber-50',
    borderColor: 'border-l-amber-500',
    badge: 'secondary' as const,
    label: 'Warning',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 bg-blue-50',
    borderColor: 'border-l-blue-500',
    badge: 'outline' as const,
    label: 'Info',
  },
};

export function ProactiveAlertsWidget() {
  const _t = useTranslations('dashboard');
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary>({ critical: 0, warning: 0, info: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/predictive-alerts?limit=10');
      if (res.ok) {
        const data = await res.json();
        // Handle both array and object responses
        if (Array.isArray(data)) {
          setAlerts(data.slice(0, 5));
          setSummary({
            critical: data.filter((a: ProactiveAlert) => a.severity === 'critical').length,
            warning: data.filter((a: ProactiveAlert) => a.severity === 'warning').length,
            info: data.filter((a: ProactiveAlert) => a.severity === 'info').length,
            total: data.length,
          });
        } else if (data.alerts) {
          setAlerts(data.alerts.slice(0, 5));
          setSummary(data.summary || { critical: 0, warning: 0, info: 0, total: 0 });
        }
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getAlertUrl = (alert: ProactiveAlert): string => {
    if (!alert.entity) return '/predictive-alerts';
    const urlMapping: Record<string, string> = {
      'SKU': `/sku-proposal/${alert.entity.id}`,
      'OTB': `/otb-analysis/${alert.entity.id}`,
      'BUDGET': `/budget`,
    };
    return urlMapping[alert.entity.type] || '/predictive-alerts';
  };

  return (
    <div
      className={cn(
        // Unified: rounded-xl, shadow-sm, hover:shadow-md, border-l-4
        'rounded-xl border border-slate-200 bg-white overflow-hidden',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'border-l-4 border-l-amber-500'
      )}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Unified: w-10 h-10 rounded-xl icon container */}
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center relative">
              <Bell className="h-5 w-5 text-amber-600" />
              {summary.critical > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {summary.critical}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Proactive Alerts</h3>
              <p className="text-xs text-slate-500">
                {summary.total > 0 ? `${summary.total} alerts detected` : 'No active alerts'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAlerts}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Summary badges */}
        {summary.total > 0 && (
          <div className="flex gap-2 mt-3">
            {summary.critical > 0 && (
              <Badge variant="destructive" className="text-xs">
                {summary.critical} Critical
              </Badge>
            )}
            {summary.warning > 0 && (
              <Badge variant="secondary" className="text-xs">
                {summary.warning} Warning
              </Badge>
            )}
            {summary.info > 0 && (
              <Badge variant="outline" className="text-xs">
                {summary.info} Info
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;

                return (
                  <Link
                    key={alert.id}
                    href={getAlertUrl(alert)}
                    className={cn(
                      // Unified: rounded-xl, border-l-4, shadow-sm, hover:shadow-md
                      'block p-3 rounded-xl border border-slate-200 bg-white',
                      'border-l-4 shadow-sm hover:shadow-md transition-all duration-200',
                      config.borderColor
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{alert.title}</p>
                          <Badge variant={config.badge} className="shrink-0 text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {alert.message}
                        </p>
                        {alert.metric && (
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="text-slate-500">Current:</span>
                            <span className={cn(
                              'font-medium tabular-nums',
                              alert.severity === 'critical' && 'text-red-600'
                            )}>
                              {alert.metric.current.toLocaleString()} {alert.metric.unit}
                            </span>
                            <span className="text-slate-500">/ Threshold:</span>
                            <span className="tabular-nums">{alert.metric.threshold.toLocaleString()} {alert.metric.unit}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                          <span>View details</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {alerts.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
                  <p className="text-sm font-medium text-green-600">All Clear!</p>
                  <p className="text-xs mt-1">No anomalies detected</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Last checked: {lastRefresh.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {alerts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link href="/predictive-alerts">
              <Button variant="outline" size="sm" className="w-full">
                View All Alerts
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
