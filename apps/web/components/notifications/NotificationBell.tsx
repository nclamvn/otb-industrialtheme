'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { useNotifications } from './hooks/useNotifications';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleNotificationClick = (notification: { id: string; link?: string }) => {
    markAsRead(notification.id);
    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/notifications');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'min-w-[18px] h-[18px] px-1 text-[10px] font-bold',
                'bg-red-500 text-white rounded-full',
                'animate-in zoom-in-50 duration-200'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0"
        align="end"
        sideOffset={8}
      >
        <NotificationPanel
          notifications={notifications}
          onMarkAllRead={markAllAsRead}
          onMarkRead={markAsRead}
          onNotificationClick={handleNotificationClick}
          onViewAll={handleViewAll}
          maxHeight="400px"
        />
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
