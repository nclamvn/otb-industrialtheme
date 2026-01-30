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
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ApprovalCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'approve' | 'reject';
  onSubmit: (comment: string) => void;
  requireComment?: boolean;
  isLoading?: boolean;
}

export function ApprovalCommentDialog({
  open,
  onOpenChange,
  action,
  onSubmit,
  requireComment = false,
  isLoading = false,
}: ApprovalCommentDialogProps) {
  const t = useTranslations('approval');
  const tCommon = useTranslations('common');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (requireComment && !comment.trim()) {
      setError(t('commentRequired'));
      return;
    }
    onSubmit(comment.trim());
    setComment('');
    setError('');
  };

  const handleClose = () => {
    setComment('');
    setError('');
    onOpenChange(false);
  };

  const isApprove = action === 'approve';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isApprove
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              )}
            >
              {isApprove ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <DialogTitle>
                {isApprove ? t('confirmApprove') : t('confirmReject')}
              </DialogTitle>
              <DialogDescription>
                {isApprove
                  ? 'This will move the request to the next approval level.'
                  : 'The submitter will be notified to make revisions.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comment">
              Comment {requireComment && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                isApprove
                  ? 'Optional: Add a comment...'
                  : 'Please provide a reason for rejection...'
              }
              className={cn(
                'min-h-[100px]',
                error && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              isApprove
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {isApprove ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t('actions.approve')}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                {t('actions.reject')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApprovalCommentDialog;
