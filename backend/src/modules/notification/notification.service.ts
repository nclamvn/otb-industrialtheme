import { Injectable } from '@nestjs/common';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private notifications: Notification[] = [];
  private idCounter = 0;

  async create(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
    const notification: Notification = {
      ...data,
      id: `notif_${++this.idCounter}`,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.push(notification);
    return notification;
  }

  async findByUser(userId: string, options?: { unreadOnly?: boolean }): Promise<Notification[]> {
    let results = this.notifications.filter((n) => n.userId === userId);
    if (options?.unreadOnly) {
      results = results.filter((n) => !n.read);
    }
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notif = this.notifications.find((n) => n.id === notificationId && n.userId === userId);
    if (notif) {
      notif.read = true;
    }
    return notif || null;
  }

  async markAllAsRead(userId: string): Promise<number> {
    let count = 0;
    this.notifications.forEach((n) => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });
    return count;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifications.filter((n) => n.userId === userId && !n.read).length;
  }

  async delete(notificationId: string, userId: string): Promise<boolean> {
    const idx = this.notifications.findIndex((n) => n.id === notificationId && n.userId === userId);
    if (idx >= 0) {
      this.notifications.splice(idx, 1);
      return true;
    }
    return false;
  }
}
