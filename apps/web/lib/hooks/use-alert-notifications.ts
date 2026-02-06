'use client';

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface Alert {
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
}

interface UseAlertNotificationsOptions {
  enabled?: boolean;
  pollInterval?: number; // in milliseconds
  showCriticalOnly?: boolean;
}

export function useAlertNotifications(options: UseAlertNotificationsOptions = {}) {
  const {
    enabled = true,
    pollInterval = 60000, // Default: check every minute
    showCriticalOnly = false,
  } = options;

  const shownAlertIds = useRef<Set<string>>(new Set());
  const lastCheckTime = useRef<Date>(new Date());

  const getAlertUrl = useCallback((alert: Alert): string => {
    if (!alert.entity) return '/predictive-alerts';
    const urlMapping: Record<string, string> = {
      'SKU': `/sku-proposal/${alert.entity.id}`,
      'OTB': `/otb-analysis/${alert.entity.id}`,
      'BUDGET': `/budget`,
    };
    return urlMapping[alert.entity.type] || '/predictive-alerts';
  }, []);

  const showAlertToast = useCallback((alert: Alert) => {
    const url = getAlertUrl(alert);

    switch (alert.severity) {
      case 'critical':
        toast.error(alert.title, {
          description: alert.message,
          duration: 10000,
          action: {
            label: 'View',
            onClick: () => window.location.href = url,
          },
        });
        break;
      case 'warning':
        if (!showCriticalOnly) {
          toast.warning(alert.title, {
            description: alert.message,
            duration: 8000,
            action: {
              label: 'View',
              onClick: () => window.location.href = url,
            },
          });
        }
        break;
      case 'info':
        if (!showCriticalOnly) {
          toast.info(alert.title, {
            description: alert.message,
            duration: 5000,
          });
        }
        break;
    }
  }, [getAlertUrl, showCriticalOnly]);

  const checkForNewAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/predictive-alerts?limit=20');
      if (!res.ok) return;

      const data = await res.json();
      const alerts: Alert[] = Array.isArray(data) ? data : data.alerts || [];

      // Filter for new alerts (not yet shown)
      const newAlerts = alerts.filter(alert => !shownAlertIds.current.has(alert.id));

      // Show toast for each new alert
      for (const alert of newAlerts) {
        // Only show critical alerts, or all if showCriticalOnly is false
        if (alert.severity === 'critical' || !showCriticalOnly) {
          showAlertToast(alert);
        }
        shownAlertIds.current.add(alert.id);
      }

      // Update last check time
      lastCheckTime.current = new Date();

      // Clean up old alert IDs (keep last 100)
      if (shownAlertIds.current.size > 100) {
        const idsArray = Array.from(shownAlertIds.current);
        shownAlertIds.current = new Set(idsArray.slice(-100));
      }
    } catch (error) {
      console.error('Failed to check for alerts:', error);
    }
  }, [showAlertToast, showCriticalOnly]);

  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkForNewAlerts();

    // Set up polling interval
    const intervalId = setInterval(checkForNewAlerts, pollInterval);

    return () => clearInterval(intervalId);
  }, [enabled, pollInterval, checkForNewAlerts]);

  return {
    checkNow: checkForNewAlerts,
    lastCheckTime: lastCheckTime.current,
    shownCount: shownAlertIds.current.size,
  };
}
