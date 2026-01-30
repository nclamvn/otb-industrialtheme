'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShoppingBag,
  Calculator,
  Crown,
  MessageSquare,
} from 'lucide-react';
import {
  ApprovalStep,
  ApprovalLevel,
  ApprovalStatus,
  APPROVAL_LEVEL_CONFIG,
} from './types';

interface ApprovalLevelCardProps {
  step: ApprovalStep;
  levelIndex: number;
  isCurrentLevel: boolean;
  canApprove: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
  className?: string;
}

const levelIcons: Record<ApprovalLevel, typeof ShoppingBag> = {
  gmd: ShoppingBag,
  finance: Calculator,
  ceo: Crown,
};

const statusConfig: Record<ApprovalStatus, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  label: string;
}> = {
  pending: {
    icon: Clock,
    color: 'text-slate-400 dark:text-neutral-500',
    bgColor: 'bg-slate-100 dark:bg-neutral-800',
    label: 'Pending',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    label: 'Approved',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    label: 'Rejected',
  },
  skipped: {
    icon: Clock,
    color: 'text-slate-400 dark:text-neutral-500',
    bgColor: 'bg-slate-50 dark:bg-neutral-900',
    label: 'Skipped',
  },
};

export function ApprovalLevelCard({
  step,
  levelIndex,
  isCurrentLevel,
  canApprove,
  onApprove,
  onReject,
  isLoading = false,
  className,
}: ApprovalLevelCardProps) {
  const t = useTranslations('approval');
  const config = APPROVAL_LEVEL_CONFIG[step.level];
  const status = statusConfig[step.status];
  const LevelIcon = levelIcons[step.level];
  const StatusIcon = status.icon;

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const isDeadlineSoon = (deadline?: Date) => {
    if (!deadline) return false;
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return diff > 0 && diff < 24 * 60 * 60 * 1000; // Within 24 hours
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 p-4 transition-all',
        isCurrentLevel
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-md'
          : step.status === 'approved'
          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10'
          : step.status === 'rejected'
          ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10'
          : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              step.status === 'approved'
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                : step.status === 'rejected'
                ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                : isCurrentLevel
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-400'
            )}
          >
            <LevelIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {t('level')} {levelIndex + 1}: {t(`levels.${step.level}`)}
            </h4>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              {config.fullLabel}
            </p>
          </div>
        </div>

        <Badge
          variant={isCurrentLevel ? 'default' : 'secondary'}
          className={cn(
            step.status === 'approved' && 'bg-emerald-500 hover:bg-emerald-600',
            step.status === 'rejected' && 'bg-red-500 hover:bg-red-600',
            isCurrentLevel && step.status === 'pending' && 'bg-blue-500 hover:bg-blue-600'
          )}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {isCurrentLevel && step.status === 'pending' ? 'Current' : t(`status.${step.status}`)}
        </Badge>
      </div>

      {/* Approver Info */}
      {step.approver && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src={step.approver.avatar} />
            <AvatarFallback>
              {step.approver.name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-slate-900 dark:text-white">
              {step.approver.name}
            </p>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              {step.approver.role}
            </p>
          </div>
        </div>
      )}

      {/* Status Details */}
      {step.status === 'approved' && step.approvedAt && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 mb-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Approved on {formatDate(step.approvedAt)}</span>
        </div>
      )}

      {step.status === 'rejected' && step.approvedAt && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-2">
          <XCircle className="h-4 w-4" />
          <span>Rejected on {formatDate(step.approvedAt)}</span>
        </div>
      )}

      {step.status === 'pending' && !isCurrentLevel && (
        <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-neutral-500 mb-2">
          <Clock className="h-4 w-4" />
          <span>{t('waitingFor')} previous approval</span>
        </div>
      )}

      {isCurrentLevel && step.status === 'pending' && (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-2">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>Waiting for approval</span>
        </div>
      )}

      {/* Deadline Warning */}
      {step.deadline && step.status === 'pending' && (
        <div
          className={cn(
            'flex items-center gap-2 text-sm mb-3 p-2 rounded',
            isDeadlineSoon(step.deadline)
              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
              : 'text-slate-500 dark:text-neutral-400'
          )}
        >
          <AlertTriangle className={cn('h-4 w-4', isDeadlineSoon(step.deadline) && 'animate-pulse')} />
          <span>{t('deadline')}: {formatDate(step.deadline)}</span>
        </div>
      )}

      {/* Comment */}
      {step.comment && (
        <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg text-sm">
          <MessageSquare className="h-4 w-4 mt-0.5 text-slate-400" />
          <p className="text-slate-600 dark:text-neutral-300 italic">
            "{step.comment}"
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {isCurrentLevel && canApprove && step.status === 'pending' && (
        <div className="flex gap-3 mt-4">
          <Button
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t('actions.approve')}
          </Button>
          <Button
            onClick={onReject}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {t('actions.reject')}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ApprovalLevelCard;
