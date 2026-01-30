'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { Notification, NotificationGroup } from './types';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAllRead?: () => void;
  onMarkRead?: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
  onViewAll?: () => void;
  maxHeight?: string;
  className?: string;
}

export function NotificationPanel({
  notifications,
  onMarkAllRead,
  onMarkRead,
  onNotificationClick,
  onViewAll,
  maxHeight = '400px',
  className,
}: NotificationPanelProps) {
  const t = useTranslations('notification');

  // Group notifications by date
  const groupedNotifications = useMemo((): NotificationGroup[] => {
    const groups: Map<string, Notification[]> = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach((notification) => {
      const notifDate = new Date(notification.timestamp);
      notifDate.setHours(0, 0, 0, 0);

      let dateKey: string;
      if (notifDate.getTime() === today.getTime()) {
        dateKey = t('today');
      } else if (notifDate.getTime() === yesterday.getTime()) {
        dateKey = t('yesterday');
      } else {
        dateKey = new Intl.DateTimeFormat('vi-VN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(notifDate);
      }

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(notification);
    });

    return Array.from(groups.entries()).map(([date, notifs]) => ({
      date,
      notifications: notifs.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ),
    }));
  }, [notifications, t]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (notifications.length === 0) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <Inbox className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-neutral-600" />
        <p className="font-medium text-slate-900 dark:text-white">
          {t('empty')}
        </p>
        <p className="text-sm text-slate-500 dark:text-neutral-400">
          {t('emptyDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-600 dark:text-neutral-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {t('title')}
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            {t('markAllRead')}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea style={{ maxHeight }}>
        <div className="divide-y divide-slate-100 dark:divide-neutral-800">
          {groupedNotifications.map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-neutral-800/50">
                <span className="text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase">
                  {group.date}
                </span>
              </div>

              {/* Notifications */}
              {group.notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={onMarkRead}
                  onClick={onNotificationClick}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          onClick={onViewAll}
        >
          {t('viewAll')}
        </Button>
      </div>
    </div>
  );
}

export default NotificationPanel;
