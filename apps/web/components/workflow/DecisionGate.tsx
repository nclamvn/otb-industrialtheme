'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { DecisionGateData, DecisionStatus, DecisionAction } from './types';

interface DecisionGateProps {
  data: DecisionGateData;
  onApprove: (comment?: string) => void;
  onReject: (comment?: string) => void;
  onRequestAlternate?: (comment?: string) => void;
  isLoading?: boolean;
  className?: string;
}

const statusConfig: Record<DecisionStatus, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  pending: {
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  alternate_requested: {
    icon: RefreshCw,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
};

export function DecisionGate({
  data,
  onApprove,
  onReject,
  onRequestAlternate,
  isLoading = false,
  className,
}: DecisionGateProps) {
  const t = useTranslations('decision');
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [expanded, setExpanded] = useState(true);

  const config = statusConfig[data.status];
  const StatusIcon = config.icon;
  const isPending = data.status === 'pending';

  const handleAction = (action: 'approve' | 'reject' | 'alternate') => {
    const trimmedComment = comment.trim() || undefined;
    switch (action) {
      case 'approve':
        onApprove(trimmedComment);
        break;
      case 'reject':
        onReject(trimmedComment);
        break;
      case 'alternate':
        onRequestAlternate?.(trimmedComment);
        break;
    }
    setComment('');
    setShowComment(false);
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 transition-all duration-200',
        config.bgColor,
        config.borderColor,
        isPending && 'shadow-md',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between p-4',
          'hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
          'rounded-t-lg'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-full', config.bgColor)}>
            <StatusIcon className={cn('h-5 w-5', config.color)} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('title')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-neutral-400">
              {data.question}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPending ? 'default' : 'secondary'} className={cn(
            isPending && 'bg-amber-500 hover:bg-amber-600'
          )}>
            {t(data.status === 'alternate_requested' ? 'pending' : data.status)}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Submission Info */}
          {data.submittedBy && (
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={data.submittedBy.avatar} />
                <AvatarFallback>
                  {data.submittedBy.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">
                  {data.submittedBy.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                  {t('submittedAt')}: {formatDate(data.submittedAt)}
                </p>
              </div>
              {data.version && (
                <Badge variant="outline">
                  {t('version')} {data.version}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons - Only show when pending */}
          {isPending && (
            <div className="space-y-3">
              {/* Comment Toggle */}
              <button
                onClick={() => setShowComment(!showComment)}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                {t('comment')}
              </button>

              {/* Comment Input */}
              {showComment && (
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('commentPlaceholder')}
                  className="min-h-[80px] bg-white dark:bg-neutral-900"
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAction('approve')}
                  disabled={isLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t('approve')}
                </Button>
                <Button
                  onClick={() => handleAction('reject')}
                  disabled={isLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('reject')}
                </Button>
                {onRequestAlternate && (
                  <Button
                    onClick={() => handleAction('alternate')}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('alternate')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Status Message for non-pending */}
          {!isPending && (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-lg',
              data.status === 'approved' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
              data.status === 'rejected' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
              data.status === 'alternate_requested' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            )}>
              <StatusIcon className="h-5 w-5" />
              <span className="font-medium">
                {t(data.status === 'alternate_requested' ? 'pending' : data.status)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DecisionGate;
