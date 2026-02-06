import prisma from '@/lib/prisma';
import { NotificationType, NotificationPriority } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  referenceUrl?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Create a notification
export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type as NotificationType,
      priority: (input.priority || 'MEDIUM') as NotificationPriority,
      title: input.title,
      message: input.message,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      referenceUrl: input.referenceUrl,
    },
  });

  // TODO: Send email notification if enabled
  // await sendEmailNotification(input);

  return notification;
}

// Get notifications for a user
export async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  const { unreadOnly = false, limit = 20, offset = 0 } = options || {};

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { isRead: false }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return {
    notifications,
    unreadCount,
    hasMore: notifications.length === limit,
  };
}

// Mark notification as read
export async function markAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

// Mark all notifications as read for a user
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

// Delete old notifications (cleanup)
export async function deleteOldNotifications(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      isRead: true,
    },
  });
}

// Bulk create notifications for multiple users
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationInput, 'userId'>
) {
  const notifications = userIds.map((userId) => ({
    userId,
    type: notification.type as NotificationType,
    priority: (notification.priority || 'MEDIUM') as NotificationPriority,
    title: notification.title,
    message: notification.message,
    referenceId: notification.referenceId,
    referenceType: notification.referenceType,
    referenceUrl: notification.referenceUrl,
  }));

  return prisma.notification.createMany({
    data: notifications,
  });
}

// Get notification type display info
export function getNotificationTypeInfo(type: NotificationType): {
  icon: string;
  color: string;
  category: string;
} {
  const typeMap: Record<
    NotificationType,
    { icon: string; color: string; category: string }
  > = {
    BUDGET_SUBMITTED: {
      icon: 'file-text',
      color: 'blue',
      category: 'Budget',
    },
    BUDGET_APPROVED: {
      icon: 'check-circle',
      color: 'green',
      category: 'Budget',
    },
    BUDGET_REJECTED: {
      icon: 'x-circle',
      color: 'red',
      category: 'Budget',
    },
    OTB_SUBMITTED: {
      icon: 'bar-chart-2',
      color: 'blue',
      category: 'OTB',
    },
    OTB_APPROVED: {
      icon: 'check-circle',
      color: 'green',
      category: 'OTB',
    },
    OTB_REJECTED: {
      icon: 'x-circle',
      color: 'red',
      category: 'OTB',
    },
    OTB_COMMENT: {
      icon: 'message-square',
      color: 'purple',
      category: 'OTB',
    },
    SKU_UPLOADED: {
      icon: 'upload',
      color: 'blue',
      category: 'SKU',
    },
    SKU_VALIDATED: {
      icon: 'check-square',
      color: 'green',
      category: 'SKU',
    },
    SKU_APPROVED: {
      icon: 'check-circle',
      color: 'green',
      category: 'SKU',
    },
    WORKFLOW_ASSIGNED: {
      icon: 'user-check',
      color: 'orange',
      category: 'Workflow',
    },
    WORKFLOW_REMINDER: {
      icon: 'bell',
      color: 'yellow',
      category: 'Workflow',
    },
    SLA_WARNING: {
      icon: 'alert-triangle',
      color: 'yellow',
      category: 'SLA',
    },
    SLA_BREACHED: {
      icon: 'alert-circle',
      color: 'red',
      category: 'SLA',
    },
    SYSTEM_ALERT: {
      icon: 'info',
      color: 'gray',
      category: 'System',
    },
  };

  return typeMap[type] || { icon: 'bell', color: 'gray', category: 'Other' };
}

// Get priority display info
export function getPriorityInfo(priority: NotificationPriority): {
  label: string;
  color: string;
  sortOrder: number;
} {
  const priorityMap: Record<
    NotificationPriority,
    { label: string; color: string; sortOrder: number }
  > = {
    LOW: { label: 'Low', color: 'gray', sortOrder: 1 },
    MEDIUM: { label: 'Medium', color: 'blue', sortOrder: 2 },
    HIGH: { label: 'High', color: 'orange', sortOrder: 3 },
    CRITICAL: { label: 'Critical', color: 'red', sortOrder: 4 },
  };

  return priorityMap[priority];
}

// Format notification time
export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
