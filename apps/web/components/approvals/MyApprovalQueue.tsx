'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Inbox,
  Clock,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  DollarSign,
} from 'lucide-react';
import {
  ApprovalRequest,
  PRIORITY_CONFIG,
  APPROVAL_REQUEST_TYPE_CONFIG,
} from './types';

interface MyApprovalQueueProps {
  requests: ApprovalRequest[];
  onView?: (request: ApprovalRequest) => void;
  onApprove?: (request: ApprovalRequest) => void;
  onReject?: (request: ApprovalRequest) => void;
  maxHeight?: string;
  className?: string;
}

export function MyApprovalQueue({
  requests,
  onView,
  onApprove,
  onReject,
  maxHeight = '400px',
  className,
}: MyApprovalQueueProps) {
  const t = useTranslations('approval');

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  const formatDeadline = (date?: Date) => {
    if (!date) return null;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (diff < 0) return { text: 'Overdue', urgent: true };
    if (hours < 24) return { text: `Today ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`, urgent: true };
    return {
      text: date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' }),
      urgent: false,
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const pendingRequests = requests.filter((r) => r.status === 'in_progress');

  if (pendingRequests.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            {t('myQueue')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 dark:text-neutral-400">
            <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No pending approvals</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            {t('myQueue')}
          </CardTitle>
          <Badge variant="secondary">
            {t('pendingCount', { count: pendingRequests.length })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="divide-y divide-slate-200 dark:divide-neutral-700">
            {pendingRequests.map((request) => {
              const priorityConfig = PRIORITY_CONFIG[request.priority];
              const typeConfig = APPROVAL_REQUEST_TYPE_CONFIG[request.type];
              const currentStep = request.steps.find(
                (s) => s.level === request.currentLevel
              );
              const deadline = formatDeadline(currentStep?.deadline);

              return (
                <div
                  key={request.id}
                  className={cn(
                    'p-4 hover:bg-muted/50 dark:hover:bg-neutral-800 transition-colors',
                    request.priority === 'high' && 'border-l-4 border-red-500'
                  )}
                >
                  {/* Priority Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        priorityConfig.color,
                        priorityConfig.bgColor,
                        priorityConfig.borderColor
                      )}
                    >
                      {request.priority === 'high' && '🔴 '}
                      {request.priority === 'medium' && '🟡 '}
                      {request.priority === 'normal' && '🟢 '}
                      {t(`priority.${request.priority}`)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {typeConfig.label}
                    </Badge>
                  </div>

                  {/* Request Title */}
                  <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                    {request.metadata.season} {request.metadata.brand} - {request.entityName}
                  </h4>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-neutral-400 mb-3">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(request.metadata.totalBudget)}
                    </span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={request.requestedBy.avatar} />
                        <AvatarFallback className="text-[8px]">
                          {request.requestedBy.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {request.requestedBy.name}
                    </span>
                    <span>|</span>
                    <span>{formatTimeAgo(request.requestedAt)}</span>
                  </div>

                  {/* Deadline */}
                  {deadline && (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-sm mb-3',
                        deadline.urgent
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-500 dark:text-neutral-400'
                      )}
                    >
                      {deadline.urgent ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      <span>{t('deadline')}: {deadline.text}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView?.(request)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('actions.view')}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => onApprove?.(request)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {t('actions.approve')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onReject?.(request)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {t('actions.reject')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default MyApprovalQueue;
