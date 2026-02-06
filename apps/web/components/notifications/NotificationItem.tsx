'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  GitBranch,
  Download,
  ChevronRight,
} from 'lucide-react';
import { Notification, NotificationType, NOTIFICATION_TYPE_CONFIG } from './types';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  className?: string;
}

const typeIcons: Record<NotificationType, typeof Bell> = {
  approval_requested: Bell,
  approval_approved: CheckCircle,
  approval_rejected: XCircle,
  decision_required: AlertTriangle,
  deadline_reminder: Clock,
  comment_added: MessageSquare,
  version_created: GitBranch,
  export_ready: Download,
};

export function NotificationItem({
  notification,
  onRead,
  onClick,
  className,
}: NotificationItemProps) {
  const t = useTranslations('notification');
  const config = NOTIFICATION_TYPE_CONFIG[notification.type];
  const Icon = typeIcons[notification.type];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return new Intl.DateTimeFormat('vi-VN', {
        month: 'short',
        day: 'numeric',
      }).format(date);
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (minutes > 0) {
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onRead?.(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-3 cursor-pointer transition-colors',
        'hover:bg-muted/50 dark:hover:bg-neutral-800',
        !notification.isRead && 'bg-blue-50/50 dark:bg-blue-950/20',
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          config.bgColor
        )}
      >
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium truncate',
                !notification.isRead
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-neutral-400'
              )}
            >
              {notification.title}
            </p>
            <p className="text-sm text-slate-500 dark:text-neutral-400 line-clamp-2">
              {notification.message}
            </p>
          </div>
          {!notification.isRead && (
            <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-1">
          {notification.metadata?.actorAvatar && (
            <Avatar className="h-4 w-4">
              <AvatarImage src={notification.metadata.actorAvatar} />
              <AvatarFallback className="text-[8px]">
                {notification.metadata.actorName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-xs text-slate-400 dark:text-neutral-500">
            {formatTimeAgo(notification.timestamp)}
          </span>
        </div>
      </div>

      {/* Link arrow */}
      {notification.link && (
        <ChevronRight className="flex-shrink-0 h-5 w-5 text-slate-300 dark:text-neutral-600" />
      )}
    </div>
  );
}

export default NotificationItem;
