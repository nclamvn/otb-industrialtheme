'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  X,
  Trash2,
  Archive,
  CheckCircle2,
  XCircle,
  Send,
  MoreHorizontal,
  ChevronDown,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive' | 'secondary';
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
}

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  actions: BulkAction[];
  onAction: (actionId: string) => Promise<void>;
  className?: string;
}

// Default actions that are commonly used
export const commonBulkActions: Record<string, BulkAction> = {
  delete: {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationTitle: 'Delete selected items?',
    confirmationDescription:
      'This action cannot be undone. All selected items will be permanently deleted.',
  },
  archive: {
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="h-4 w-4" />,
    variant: 'secondary',
  },
  approve: {
    id: 'approve',
    label: 'Approve',
    icon: <CheckCircle2 className="h-4 w-4" />,
    requiresConfirmation: true,
    confirmationTitle: 'Approve selected items?',
    confirmationDescription:
      'All selected items will be approved. This action may trigger notifications.',
  },
  reject: {
    id: 'reject',
    label: 'Reject',
    icon: <XCircle className="h-4 w-4" />,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationTitle: 'Reject selected items?',
    confirmationDescription:
      'All selected items will be rejected. You may want to add comments before rejecting.',
  },
  submit: {
    id: 'submit',
    label: 'Submit',
    icon: <Send className="h-4 w-4" />,
  },
  exportPdf: {
    id: 'exportPdf',
    label: 'Export PDF',
    icon: <FileText className="h-4 w-4" />,
    variant: 'secondary',
  },
  exportExcel: {
    id: 'exportExcel',
    label: 'Export Excel',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    variant: 'secondary',
  },
};

export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  actions,
  onAction,
  className,
}: BulkActionBarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);

  const handleAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmAction(action);
      return;
    }

    await executeAction(action.id);
  };

  const executeAction = async (actionId: string) => {
    setIsProcessing(true);
    try {
      await onAction(actionId);
      toast.success(`Action completed on ${selectedCount} items`);
    } catch {
      toast.error('Failed to complete action');
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  // Separate primary actions (first 3) from overflow
  const primaryActions = actions.slice(0, 3);
  const overflowActions = actions.slice(3);

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-4 p-3 bg-primary/5 border rounded-lg',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-semibold">
              {selectedCount}
            </Badge>
            <span className="text-sm text-muted-foreground">
              of {totalCount} selected
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onSelectAll}>
            Select all {totalCount}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Primary Actions */}
          {primaryActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'default'}
              size="sm"
              onClick={() => handleAction(action)}
              disabled={isProcessing}
            >
              {action.icon}
              <span className="ml-1.5">{action.label}</span>
            </Button>
          ))}

          {/* Overflow Actions */}
          {overflowActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {overflowActions.map((action, index) => (
                  <div key={action.id}>
                    {index === 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => handleAction(action)}
                      disabled={isProcessing}
                      className={cn(
                        action.variant === 'destructive' && 'text-destructive'
                      )}
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </DropdownMenuItem>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.confirmationTitle || 'Confirm action'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmationDescription ||
                `This action will affect ${selectedCount} items.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && executeAction(confirmAction.id)}
              disabled={isProcessing}
              className={cn(
                confirmAction?.variant === 'destructive' &&
                  'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
