'use client';

import { useState, useCallback } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Check,
  X,
  AlertTriangle,
  MessageSquare,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export type DecisionType = 'approve' | 'reject' | 'request_changes' | 'escalate' | 'defer';

export interface DecisionOption {
  type: DecisionType;
  label: string;
  description?: string;
  icon: React.ReactNode;
  color: string;
  requiresComment?: boolean;
}

export interface DecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  itemName?: string;
  options?: DecisionOption[];
  onDecision: (decision: DecisionType, comment: string) => Promise<void>;
  isLoading?: boolean;
  defaultComment?: string;
  showCommentField?: boolean;
  commentRequired?: boolean;
  commentPlaceholder?: string;
}

const DEFAULT_OPTIONS: DecisionOption[] = [
  {
    type: 'approve',
    label: 'Approve',
    description: 'Approve and proceed to next stage',
    icon: <ThumbsUp className="h-4 w-4" />,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800',
    requiresComment: false,
  },
  {
    type: 'request_changes',
    label: 'Request Changes',
    description: 'Send back for revisions',
    icon: <RotateCcw className="h-4 w-4" />,
    color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800',
    requiresComment: true,
  },
  {
    type: 'reject',
    label: 'Reject',
    description: 'Decline this submission',
    icon: <ThumbsDown className="h-4 w-4" />,
    color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800',
    requiresComment: true,
  },
];

export function DecisionDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  options = DEFAULT_OPTIONS,
  onDecision,
  isLoading = false,
  defaultComment = '',
  showCommentField = true,
  commentRequired = false,
  commentPlaceholder = 'Add a comment or feedback...',
}: DecisionDialogProps) {
  const [selectedDecision, setSelectedDecision] = useState<DecisionType | null>(null);
  const [comment, setComment] = useState(defaultComment);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = options.find((o) => o.type === selectedDecision);
  const isCommentRequired = commentRequired || selectedOption?.requiresComment;

  const handleSubmit = useCallback(async () => {
    if (!selectedDecision) {
      setError('Please select a decision');
      return;
    }

    if (isCommentRequired && !comment.trim()) {
      setError('Please provide a comment');
      return;
    }

    setError(null);

    try {
      await onDecision(selectedDecision, comment.trim());
      // Reset state on success
      setSelectedDecision(null);
      setComment('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision');
    }
  }, [selectedDecision, comment, isCommentRequired, onDecision, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setSelectedDecision(null);
      setComment('');
      setError(null);
      onOpenChange(false);
    }
  }, [isLoading, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
          {itemName && (
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{itemName}</p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Decision Options */}
          <div className="space-y-2">
            <Label>Select Decision</Label>
            <RadioGroup
              value={selectedDecision || ''}
              onValueChange={(value) => {
                setSelectedDecision(value as DecisionType);
                setError(null);
              }}
              className="space-y-2"
            >
              {options.map((option) => (
                <label
                  key={option.type}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                    selectedDecision === option.type
                      ? option.color
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <RadioGroupItem value={option.type} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                      {option.requiresComment && (
                        <span className="text-xs text-muted-foreground">(comment required)</span>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Comment Field */}
          {showCommentField && (
            <div className="space-y-2">
              <Label htmlFor="decision-comment">
                Comment {isCommentRequired && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="decision-comment"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setError(null);
                }}
                placeholder={commentPlaceholder}
                rows={3}
                className={cn(
                  isCommentRequired && !comment.trim() && error
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                )}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedDecision}
            className={cn(
              selectedOption?.type === 'approve' &&
                'bg-emerald-600 hover:bg-emerald-700',
              selectedOption?.type === 'reject' &&
                'bg-red-600 hover:bg-red-700',
              selectedOption?.type === 'request_changes' &&
                'bg-amber-600 hover:bg-amber-700'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Submit Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quick action buttons for inline use
export interface QuickDecisionButtonsProps {
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function QuickDecisionButtons({
  onApprove,
  onReject,
  onRequestChanges,
  isLoading = false,
  disabled = false,
  size = 'default',
}: QuickDecisionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size={size}
        onClick={onApprove}
        disabled={isLoading || disabled}
        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
      >
        <Check className={cn('h-4 w-4', size === 'sm' ? '' : 'mr-1')} />
        {size !== 'sm' && 'Approve'}
      </Button>

      {onRequestChanges && (
        <Button
          variant="outline"
          size={size}
          onClick={onRequestChanges}
          disabled={isLoading || disabled}
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
        >
          <RotateCcw className={cn('h-4 w-4', size === 'sm' ? '' : 'mr-1')} />
          {size !== 'sm' && 'Changes'}
        </Button>
      )}

      <Button
        variant="outline"
        size={size}
        onClick={onReject}
        disabled={isLoading || disabled}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <X className={cn('h-4 w-4', size === 'sm' ? '' : 'mr-1')} />
        {size !== 'sm' && 'Reject'}
      </Button>
    </div>
  );
}

// Confirmation dialog for simple yes/no decisions
export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = useCallback(async () => {
    await onConfirm();
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'destructive' && (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DecisionDialog;
