'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  DollarSign,
  Package,
  User,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { ApprovalLevelCard } from './ApprovalLevelCard';
import { ApprovalCommentDialog } from './ApprovalCommentDialog';
import {
  ApprovalRequest,
  ApprovalLevel,
  APPROVAL_LEVELS,
  APPROVAL_REQUEST_TYPE_CONFIG,
} from './types';

interface ApprovalChainProps {
  request: ApprovalRequest;
  currentUserId?: string;
  canUserApproveLevel?: (level: ApprovalLevel) => boolean;
  onApprove?: (level: ApprovalLevel, comment?: string) => void;
  onReject?: (level: ApprovalLevel, comment: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ApprovalChain({
  request,
  currentUserId,
  canUserApproveLevel,
  onApprove,
  onReject,
  isLoading = false,
  className,
}: ApprovalChainProps) {
  const t = useTranslations('approval');
  const [commentDialog, setCommentDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject';
    level: ApprovalLevel;
  }>({ open: false, action: 'approve', level: 'gmd' });

  const typeConfig = APPROVAL_REQUEST_TYPE_CONFIG[request.type];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleApproveClick = (level: ApprovalLevel) => {
    setCommentDialog({ open: true, action: 'approve', level });
  };

  const handleRejectClick = (level: ApprovalLevel) => {
    setCommentDialog({ open: true, action: 'reject', level });
  };

  const handleCommentSubmit = (comment: string) => {
    if (commentDialog.action === 'approve') {
      onApprove?.(commentDialog.level, comment || undefined);
    } else {
      onReject?.(commentDialog.level, comment);
    }
    setCommentDialog({ ...commentDialog, open: false });
  };

  const getOverallStatusBadge = () => {
    switch (request.status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('status.approved')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {t('status.rejected')}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" />
            {t('status.inProgress')}
          </Badge>
        );
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-card dark:bg-neutral-900',
        'border-border',
        'border border-border',
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center',
                `bg-${typeConfig.color}-100 dark:bg-${typeConfig.color}-900/30`
              )}
            >
              <Package className={`h-6 w-6 text-${typeConfig.color}-600 dark:text-${typeConfig.color}-400`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('chain')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                {request.metadata.season} - {request.entityName}
              </p>
            </div>
          </div>
          {getOverallStatusBadge()}
        </div>

        {/* Request Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {t('requestedBy')}
              </p>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={request.requestedBy.avatar} />
                  <AvatarFallback className="text-xs">
                    {request.requestedBy.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {request.requestedBy.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {t('submittedAt')}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {formatDate(request.requestedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Budget
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {formatCurrency(request.metadata.totalBudget)}
              </p>
            </div>
          </div>

          {request.metadata.skuCount && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  SKUs
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {request.metadata.skuCount}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Steps */}
      <div className="p-6 space-y-4">
        {APPROVAL_LEVELS.map((level, index) => {
          const step = request.steps.find((s) => s.level === level);
          if (!step) return null;

          const isCurrentLevel = request.currentLevel === level && request.status === 'in_progress';
          const canApprove = canUserApproveLevel?.(level) ?? false;

          return (
            <div key={level}>
              <ApprovalLevelCard
                step={step}
                levelIndex={index}
                isCurrentLevel={isCurrentLevel}
                canApprove={canApprove}
                onApprove={() => handleApproveClick(level)}
                onReject={() => handleRejectClick(level)}
                isLoading={isLoading}
              />

              {/* Connector Arrow */}
              {index < APPROVAL_LEVELS.length - 1 && (
                <div className="flex justify-center py-2">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      step.status === 'approved'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                        : 'bg-muted dark:bg-neutral-800 text-slate-400'
                    )}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comment Dialog */}
      <ApprovalCommentDialog
        open={commentDialog.open}
        onOpenChange={(open) => setCommentDialog({ ...commentDialog, open })}
        action={commentDialog.action}
        onSubmit={handleCommentSubmit}
        requireComment={commentDialog.action === 'reject'}
      />
    </div>
  );
}

export default ApprovalChain;
