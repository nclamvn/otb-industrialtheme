'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Tag,
} from 'lucide-react';
import { DecisionGateData } from './types';

interface DecisionGateModalProps {
  data: DecisionGateData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (comment?: string) => void;
  onReject: (comment?: string) => void;
  onRequestAlternate?: (comment?: string) => void;
  isLoading?: boolean;
  summaryData?: {
    totalBudget?: number;
    allocatedBudget?: number;
    itemCount?: number;
    changes?: Array<{
      field: string;
      oldValue: string;
      newValue: string;
    }>;
  };
}

export function DecisionGateModal({
  data,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onRequestAlternate,
  isLoading = false,
  summaryData,
}: DecisionGateModalProps) {
  const t = useTranslations('decision');
  const tCommon = useTranslations('common');
  const [comment, setComment] = useState('');
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);

  if (!data) return null;

  const handleConfirm = () => {
    const trimmedComment = comment.trim() || undefined;
    if (confirmAction === 'approve') {
      onApprove(trimmedComment);
    } else if (confirmAction === 'reject') {
      onReject(trimmedComment);
    }
    setComment('');
    setConfirmAction(null);
    onOpenChange(false);
  };

  const handleAlternate = () => {
    const trimmedComment = comment.trim() || undefined;
    onRequestAlternate?.(trimmedComment);
    setComment('');
    onOpenChange(false);
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-xl">{t('title')}</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {data.question}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Submission Info */}
            <div className="grid grid-cols-2 gap-4">
              {data.submittedBy && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-neutral-800 rounded-lg">
                  <User className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                      {t('submittedBy')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={data.submittedBy.avatar} />
                        <AvatarFallback className="text-xs">
                          {data.submittedBy.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {data.submittedBy.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {data.submittedAt && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-neutral-800 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                      {t('submittedAt')}
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                      {formatDate(data.submittedAt)}
                    </p>
                  </div>
                </div>
              )}

              {data.version && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-neutral-800 rounded-lg">
                  <Tag className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                      {t('version')}
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                      {data.version}
                    </p>
                  </div>
                </div>
              )}

              {summaryData?.itemCount !== undefined && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-neutral-800 rounded-lg">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                      Items
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                      {summaryData.itemCount} SKUs
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Budget Summary */}
            {summaryData && (summaryData.totalBudget || summaryData.allocatedBudget) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    Budget Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {summaryData.totalBudget !== undefined && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Total Budget
                        </p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                          {formatCurrency(summaryData.totalBudget)}
                        </p>
                      </div>
                    )}
                    {summaryData.allocatedBudget !== undefined && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          Allocated
                        </p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                          {formatCurrency(summaryData.allocatedBudget)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Changes Summary */}
            {summaryData?.changes && summaryData.changes.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    Recent Changes
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {summaryData.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-neutral-800 rounded-lg text-sm"
                      >
                        <span className="text-slate-600 dark:text-neutral-400">
                          {change.field}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-500 line-through">
                            {change.oldValue}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {change.newValue}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Comment */}
            <Separator />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-neutral-300">
                {t('comment')}
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('commentPlaceholder')}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-3">
            {onRequestAlternate && (
              <Button
                variant="outline"
                onClick={handleAlternate}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('alternate')}
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setConfirmAction('reject')}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {t('reject')}
            </Button>
            <Button
              onClick={() => setConfirmAction('approve')}
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t('approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'approve' ? t('confirmApprove') : t('confirmReject')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'approve'
                ? 'This action will approve the submitted plan and move to the next workflow step.'
                : 'This action will reject the plan and require revisions.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                confirmAction === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {tCommon('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DecisionGateModal;
