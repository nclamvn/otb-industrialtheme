'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FileEdit,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  Ban,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { TicketHistory, TicketHistoryAction } from './types';

interface TicketTimelineProps {
  history: TicketHistory[];
  currentStatus?: string;
  currentAssignee?: { name: string };
  className?: string;
}

const actionIcons: Record<TicketHistoryAction, typeof FileEdit> = {
  created: FileEdit,
  submitted: Send,
  approved: CheckCircle,
  rejected: XCircle,
  updated: RefreshCw,
  cancelled: Ban,
  commented: MessageSquare,
};

const actionColors: Record<TicketHistoryAction, { icon: string; line: string }> = {
  created: {
    icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    line: 'bg-slate-200 dark:bg-slate-700',
  },
  submitted: {
    icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    line: 'bg-blue-200 dark:bg-blue-800',
  },
  approved: {
    icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    line: 'bg-emerald-200 dark:bg-emerald-800',
  },
  rejected: {
    icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    line: 'bg-red-200 dark:bg-red-800',
  },
  updated: {
    icon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    line: 'bg-purple-200 dark:bg-purple-800',
  },
  cancelled: {
    icon: 'bg-slate-100 dark:bg-slate-900 text-slate-500',
    line: 'bg-slate-200 dark:bg-slate-800',
  },
  commented: {
    icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    line: 'bg-amber-200 dark:bg-amber-800',
  },
};

export function TicketTimeline({
  history,
  currentStatus,
  currentAssignee,
  className,
}: TicketTimelineProps) {
  const t = useTranslations('ticket.history');

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const sortedHistory = [...history].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  return (
    <div className={cn('space-y-0', className)}>
      {sortedHistory.map((entry, index) => {
        const isLast = index === sortedHistory.length - 1;
        const Icon = actionIcons[entry.action];
        const colors = actionColors[entry.action];

        return (
          <div key={entry.id} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center z-10',
                  colors.icon
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div className={cn('w-0.5 flex-1 my-1', colors.line)} />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6 flex-1', isLast && 'pb-0')}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {t(entry.action)}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={entry.user.avatar} />
                      <AvatarFallback className="text-[8px]">
                        {entry.user.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-500 dark:text-neutral-400">
                      by {entry.user.name}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>

              {/* Comment */}
              {entry.comment && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg text-sm text-slate-600 dark:text-neutral-300 italic">
                  "{entry.comment}"
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Current status indicator */}
      {currentStatus === 'in_review' && currentAssignee && (
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 animate-pulse">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-amber-600 dark:text-amber-400">
              Waiting for Approval
            </h4>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
              Assigned to: {currentAssignee.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketTimeline;
