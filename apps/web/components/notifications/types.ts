/**
 * Notification Types
 */

export type NotificationType =
  | 'approval_requested'
  | 'approval_approved'
  | 'approval_rejected'
  | 'decision_required'
  | 'deadline_reminder'
  | 'comment_added'
  | 'version_created'
  | 'export_ready';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
  metadata?: {
    entityType?: string;
    entityId?: string;
    actorName?: string;
    actorAvatar?: string;
  };
}

export interface NotificationGroup {
  date: string; // "Today", "Yesterday", "Jan 28, 2026"
  notifications: Notification[];
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
}> = {
  approval_requested: {
    icon: 'Bell',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    label: 'Approval Required',
  },
  approval_approved: {
    icon: 'CheckCircle',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    label: 'Approved',
  },
  approval_rejected: {
    icon: 'XCircle',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    label: 'Rejected',
  },
  decision_required: {
    icon: 'AlertTriangle',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    label: 'Decision Required',
  },
  deadline_reminder: {
    icon: 'Clock',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    label: 'Deadline Reminder',
  },
  comment_added: {
    icon: 'MessageSquare',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    label: 'Comment Added',
  },
  version_created: {
    icon: 'GitBranch',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    label: 'New Version',
  },
  export_ready: {
    icon: 'Download',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    label: 'Export Ready',
  },
};
