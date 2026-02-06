'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  User,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: 'budget' | 'otb' | 'sku' | 'approval' | 'system' | 'user';
  action: string;
  description: string;
  timestamp: Date;
  status?: 'success' | 'warning' | 'error' | 'pending';
  user?: string;
  link?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxHeight?: string;
}

const typeIcons: Record<string, LucideIcon> = {
  budget: DollarSign,
  otb: FileText,
  sku: Package,
  approval: CheckCircle2,
  system: AlertCircle,
  user: User,
};

const statusColors: Record<string, string> = {
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  pending: 'text-blue-600',
};

const statusBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  success: 'default',
  warning: 'secondary',
  error: 'destructive',
  pending: 'outline',
};

export function ActivityFeed({ activities, maxHeight = '400px' }: ActivityFeedProps) {
  const t = useTranslations('dashboard');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recentActivity')}</CardTitle>
        <CardDescription>{t('latestUpdates')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="pr-4" style={{ height: maxHeight }}>
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = typeIcons[activity.type] || Clock;
              const iconColor = activity.status
                ? statusColors[activity.status]
                : 'text-muted-foreground';

              return (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0',
                    activity.link && 'cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2'
                  )}
                  onClick={() => {
                    if (activity.link) {
                      window.location.href = activity.link;
                    }
                  }}
                >
                  <div className="mt-0.5">
                    <Icon className={cn('h-5 w-5', iconColor)} />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{activity.action}</p>
                      {activity.status && (
                        <Badge
                          variant={statusBadgeVariants[activity.status]}
                          className="shrink-0 text-xs"
                        >
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.user && (
                        <>
                          <span>{activity.user}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noRecentActivity')}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
