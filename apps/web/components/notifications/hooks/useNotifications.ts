'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Notification, NotificationType } from '../types';

interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
  refresh: () => Promise<void>;
}

// Generate demo notifications
function generateDemoNotifications(): Notification[] {
  const now = new Date();

  return [
    {
      id: 'notif-1',
      type: 'approval_requested',
      title: 'Approval Required',
      message: 'SS26 REX OTB Plan needs your approval',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: false,
      link: '/approvals/approval-1',
      metadata: {
        entityType: 'otb_plan',
        entityId: 'budget-1',
        actorName: 'John Doe',
      },
    },
    {
      id: 'notif-2',
      type: 'approval_approved',
      title: 'Approved',
      message: 'Your SKU Proposal was approved by Sarah (GMD)',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      isRead: false,
      link: '/sku-proposal/sku-1',
      metadata: {
        actorName: 'Sarah Johnson',
        actorAvatar: undefined,
      },
    },
    {
      id: 'notif-3',
      type: 'deadline_reminder',
      title: 'Deadline Reminder',
      message: 'FW26 Budget allocation due in 2 days',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      isRead: true,
      link: '/budget-flow/budget-2',
    },
    {
      id: 'notif-4',
      type: 'comment_added',
      title: 'Comment Added',
      message: 'Michael commented on FW26 Budget: "Need to review sizing..."',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
      isRead: true,
      link: '/budget-flow/budget-2',
      metadata: {
        actorName: 'Michael Chen',
      },
    },
    {
      id: 'notif-5',
      type: 'version_created',
      title: 'New Version',
      message: 'Version 3 created for SS26 REX Budget',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isRead: true,
      link: '/budget-flow/budget-1',
    },
    {
      id: 'notif-6',
      type: 'export_ready',
      title: 'Export Ready',
      message: 'Your CSV export is ready to download',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isRead: true,
      link: '/exports/export-1',
    },
  ];
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      const data = generateDemoNotifications();
      setNotifications(data);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        timestamp: new Date(),
        isRead: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    refresh,
  };
}

export default useNotifications;
