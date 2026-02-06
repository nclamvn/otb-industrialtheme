// Real-time Module Index
export * from './events';

import { prisma } from '@/lib/prisma';
import { RealtimeNotificationType } from '@prisma/client';
import {
  REALTIME_EVENTS,
  NotificationEvent,
  getUserChannel,
} from './events';

// In-memory store for server-side event emission
// In production, use Redis pub/sub for scaling
type EventHandler = (event: string, data: unknown) => void;
const eventHandlers = new Map<string, Set<EventHandler>>();

// Subscribe to a channel
export function subscribeToChannel(channel: string, handler: EventHandler): () => void {
  if (!eventHandlers.has(channel)) {
    eventHandlers.set(channel, new Set());
  }
  eventHandlers.get(channel)!.add(handler);

  // Return unsubscribe function
  return () => {
    eventHandlers.get(channel)?.delete(handler);
  };
}

// Emit event to a channel
export function emitToChannel(channel: string, event: string, data: unknown): void {
  const handlers = eventHandlers.get(channel);
  if (handlers) {
    handlers.forEach((handler) => handler(event, data));
  }
}

// Emit to user
export function emitToUser(userId: string, event: string, data: unknown): void {
  emitToChannel(getUserChannel(userId), event, data);
}

// Create and emit notification
export async function createAndEmitNotification(params: {
  userId: string;
  type: RealtimeNotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}): Promise<void> {
  // Create notification in database
  const notification = await prisma.realtimeNotification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      entityType: params.entityType,
      entityId: params.entityId,
      actionUrl: params.actionUrl,
    },
  });

  // Emit to user channel
  const event: NotificationEvent = {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    entityType: notification.entityType || undefined,
    entityId: notification.entityId || undefined,
    actionUrl: notification.actionUrl || undefined,
  };

  emitToUser(params.userId, REALTIME_EVENTS.NOTIFICATION_NEW, event);
}

// Get unread notifications for user
export async function getUnreadNotifications(userId: string, limit: number = 50) {
  return prisma.realtimeNotification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  await prisma.realtimeNotification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  emitToUser(userId, REALTIME_EVENTS.NOTIFICATION_READ, { id: notificationId });
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await prisma.realtimeNotification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  emitToUser(userId, REALTIME_EVENTS.NOTIFICATION_CLEAR, {});
}

// Get notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.realtimeNotification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}
