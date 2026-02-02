'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  GitBranch,
  Upload,
  Download,
  Lock,
  Unlock,
  Settings,
  AlertTriangle,
} from 'lucide-react';

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'viewed'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'commented'
  | 'versioned'
  | 'uploaded'
  | 'downloaded'
  | 'locked'
  | 'unlocked'
  | 'configured'
  | 'alerted';

export interface ActivityUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface ActivityEntity {
  type: 'budget' | 'otb' | 'sku' | 'approval' | 'report' | 'setting';
  id: string;
  name: string;
  link?: string;
}

export interface ActivityChange {
  field: string;
  oldValue?: string | number;
  newValue?: string | number;
}

export interface Activity {
  id: string;
  action: ActivityAction;
  user: ActivityUser;
  entity: ActivityEntity;
  timestamp: Date;
  changes?: ActivityChange[];
  comment?: string;
  metadata?: Record<string, unknown>;
}

interface TimelineItemProps {
  activity: Activity;
  showConnector?: boolean;
  isLast?: boolean;
  compact?: boolean;
  className?: string;
}

const actionConfig: Record<
  ActivityAction,
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; label: string }
> = {
  created: { icon: Plus, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'created' },
  updated: { icon: Pencil, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'updated' },
  deleted: { icon: Trash2, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'deleted' },
  viewed: { icon: Eye, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800', label: 'viewed' },
  submitted: { icon: Send, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30', label: 'submitted' },
  approved: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'approved' },
  rejected: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'rejected' },
  commented: { icon: MessageSquare, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'commented on' },
  versioned: { icon: GitBranch, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30', label: 'created new version of' },
  uploaded: { icon: Upload, color: 'text-teal-500', bgColor: 'bg-teal-100 dark:bg-teal-900/30', label: 'uploaded' },
  downloaded: { icon: Download, color: 'text-teal-500', bgColor: 'bg-teal-100 dark:bg-teal-900/30', label: 'downloaded' },
  locked: { icon: Lock, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', label: 'locked' },
  unlocked: { icon: Unlock, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', label: 'unlocked' },
  configured: { icon: Settings, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800', label: 'configured' },
  alerted: { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'triggered alert for' },
};

const entityTypeLabels: Record<string, string> = {
  budget: 'Budget',
  otb: 'OTB Plan',
  sku: 'SKU',
  approval: 'Approval',
  report: 'Report',
  setting: 'Setting',
};

export function TimelineItem({
  activity,
  showConnector = true,
  isLast = false,
  compact = false,
  className,
}: TimelineItemProps) {
  const config = actionConfig[activity.action];
  const Icon = config.icon;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('relative flex gap-4', className)}>
      {/* Connector line */}
      {showConnector && !isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
      )}

      {/* Icon */}
      <div className={cn('relative z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center', config.bgColor)}>
        <Icon className={cn('w-5 h-5', config.color)} />
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-6', compact && 'pb-4')}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Action description */}
            <p className="text-sm">
              <span className="font-medium">{activity.user.name}</span>
              <span className="text-muted-foreground"> {config.label} </span>
              {activity.entity.link ? (
                <Link
                  href={activity.entity.link}
                  className="font-medium text-[#127749] hover:underline"
                >
                  {activity.entity.name}
                </Link>
              ) : (
                <span className="font-medium">{activity.entity.name}</span>
              )}
            </p>

            {/* Entity type badge */}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] h-5">
                {entityTypeLabels[activity.entity.type]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* User avatar */}
          <Avatar className={cn('shrink-0', compact ? 'w-6 h-6' : 'w-8 h-8')}>
            {activity.user.avatar && <AvatarImage src={activity.user.avatar} alt={activity.user.name} />}
            <AvatarFallback className="text-[10px] bg-[#D7B797]/20 text-[#D7B797]">
              {getInitials(activity.user.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Comment */}
        {activity.comment && (
          <div className="mt-2 p-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            "{activity.comment}"
          </div>
        )}

        {/* Changes */}
        {activity.changes && activity.changes.length > 0 && !compact && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Changes:</p>
            <div className="space-y-0.5">
              {activity.changes.slice(0, 3).map((change, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{change.field}:</span>
                  {change.oldValue !== undefined && (
                    <span className="line-through text-red-500/70">{String(change.oldValue)}</span>
                  )}
                  <span className="text-[#127749]">{String(change.newValue)}</span>
                </div>
              ))}
              {activity.changes.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{activity.changes.length - 3} more changes
                </span>
              )}
            </div>
          </div>
        )}

        {/* Timestamp tooltip */}
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {format(activity.timestamp, 'PPpp')}
        </p>
      </div>
    </div>
  );
}
