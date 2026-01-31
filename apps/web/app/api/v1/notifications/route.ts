export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { mockNotifications } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    let notifications;
    let unreadCount;

    try {
      notifications = await prisma.notification.findMany({
        where: {
          userId: session.user.id,
          ...(unreadOnly && { isRead: false }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      unreadCount = await prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      });
    } catch (dbError) {
      console.error('Database error, using mock data:', dbError);
      // Use mock data when database is unavailable
      // Map demo user IDs to mock notification user IDs for testing
      const userIdMap: Record<string, string> = {
        'demo-admin': 'user-1',
        'demo-planner': 'user-2',
        'demo-manager': 'user-3',
        'demo-buyer': 'user-4',
      };
      const mockUserId = userIdMap[session.user.id] || session.user.id;

      notifications = mockNotifications
        .filter(n => {
          if (n.userId !== mockUserId) return false;
          if (unreadOnly && n.isRead) return false;
          return true;
        })
        .slice(0, limit);

      unreadCount = mockNotifications.filter(n => n.userId === mockUserId && !n.isRead).length;
    }

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } else if (notificationIds && notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
