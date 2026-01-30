'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ShoppingBag,
  Calculator,
  Crown,
} from 'lucide-react';
import {
  ApprovalRequest,
  ApprovalLevel,
  ApprovalStatus,
  APPROVAL_LEVEL_CONFIG,
} from './types';

interface ApprovalTimelineProps {
  request: ApprovalRequest;
  className?: string;
}

const levelIcons: Record<ApprovalLevel, typeof ShoppingBag> = {
  gmd: ShoppingBag,
  finance: Calculator,
  ceo: Crown,
};

export function ApprovalTimeline({ request, className }: ApprovalTimelineProps) {
  const t = useTranslations('approval');

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const timelineEvents = [
    // Submission event
    {
      id: 'submit',
      type: 'submit',
      title: 'Submitted for Approval',
      description: `${request.requestedBy.name} submitted ${request.entityName}`,
      timestamp: request.requestedAt,
      icon: <Send className="h-4 w-4" />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      status: 'done' as const,
    },
    // Approval steps
    ...request.steps.map((step) => {
      const config = APPROVAL_LEVEL_CONFIG[step.level];
      const LevelIcon = levelIcons[step.level];
      const isCompleted = step.status === 'approved' || step.status === 'rejected';

      return {
        id: step.id,
        type: 'approval',
        title: `${config.label} Review`,
        description: isCompleted
          ? step.status === 'approved'
            ? `Approved by ${step.approver?.name || config.label}`
            : `Rejected by ${step.approver?.name || config.label}`
          : `Pending ${config.label} approval`,
        timestamp: step.approvedAt,
        icon: <LevelIcon className="h-4 w-4" />,
        iconBg:
          step.status === 'approved'
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : step.status === 'rejected'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-slate-100 dark:bg-neutral-800 text-slate-400',
        status: step.status,
        approver: step.approver,
        comment: step.comment,
      };
    }),
  ];

  return (
    <div className={cn('space-y-0', className)}>
      {timelineEvents.map((event, index) => {
        const isLast = index === timelineEvents.length - 1;
        const isPending = event.status === 'pending';

        return (
          <div key={event.id} className="flex gap-4">
            {/* Timeline Line and Dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center z-10',
                  event.iconBg
                )}
              >
                {event.icon}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 my-1',
                    isPending
                      ? 'bg-slate-200 dark:bg-neutral-700'
                      : event.status === 'rejected'
                      ? 'bg-red-200 dark:bg-red-900/50'
                      : 'bg-emerald-200 dark:bg-emerald-900/50'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6 flex-1', isLast && 'pb-0')}>
              <div className="flex items-start justify-between">
                <div>
                  <h4
                    className={cn(
                      'font-medium',
                      isPending
                        ? 'text-slate-400 dark:text-neutral-500'
                        : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {event.title}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">
                    {event.description}
                  </p>
                </div>
                {event.timestamp && (
                  <span className="text-xs text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                    {formatDate(event.timestamp)}
                  </span>
                )}
              </div>

              {/* Approver info */}
              {'approver' in event && event.approver && event.status !== 'pending' && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={event.approver.avatar} />
                    <AvatarFallback className="text-xs">
                      {event.approver.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-600 dark:text-neutral-300">
                    {event.approver.name}
                  </span>
                  {getStatusIcon(event.status as ApprovalStatus)}
                </div>
              )}

              {/* Comment */}
              {'comment' in event && event.comment && (
                <div className="mt-2 p-2 bg-slate-50 dark:bg-neutral-800 rounded text-sm text-slate-600 dark:text-neutral-300 italic">
                  "{event.comment}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ApprovalTimeline;
