'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  CheckSquare,
  Trash2,
  Edit3,
  Download,
  Copy,
  Archive,
  Tag,
  Check,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';

interface BulkAction {
  id: string;
  label: string;
  labelVi?: string;
  icon: React.ElementType;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  requireConfirm?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  disabled?: boolean;
  hidden?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll?: () => void;
  onClearSelection: () => void;
  actions: BulkAction[];
  onAction: (actionId: string) => Promise<void>;
  isLoading?: boolean;
  loadingAction?: string;
  className?: string;
}

/**
 * BulkActionBar - Floating action bar for bulk operations
 * Shows when items are selected, slides up from bottom
 */
export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  actions,
  onAction,
  isLoading = false,
  loadingAction,
  className,
}: BulkActionBarProps) {
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);

  const visibleActions = actions.filter((a) => !a.hidden);
  const isAllSelected = selectedCount === totalCount;

  const handleAction = useCallback(
    async (action: BulkAction) => {
      if (action.requireConfirm) {
        setConfirmAction(action);
        return;
      }

      await onAction(action.id);
    },
    [onAction]
  );

  const handleConfirm = useCallback(async () => {
    if (confirmAction) {
      await onAction(confirmAction.id);
      setConfirmAction(null);
    }
  }, [confirmAction, onAction]);

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
              'flex items-center gap-3 px-4 py-3 rounded-xl',
              'bg-background border shadow-xl',
              className
            )}
          >
            {/* Selection Info */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#127749]/10">
                <CheckSquare className="w-4 h-4 text-[#127749]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {selectedCount.toLocaleString()} đã chọn
                </span>
                <span className="text-xs text-muted-foreground">
                  trong {totalCount.toLocaleString()} mục
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Select All / Clear */}
            <div className="flex items-center gap-1">
              {onSelectAll && !isAllSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSelectAll}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Chọn tất cả
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                disabled={isLoading}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Bỏ chọn
              </Button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Actions */}
            <div className="flex items-center gap-1">
              <TooltipProvider>
                {visibleActions.slice(0, 4).map((action) => {
                  const Icon = action.icon;
                  const isActionLoading = loadingAction === action.id;

                  return (
                    <Tooltip key={action.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={action.variant || 'outline'}
                          size="sm"
                          onClick={() => handleAction(action)}
                          disabled={isLoading || action.disabled}
                          className={cn(
                            'gap-1.5',
                            action.variant === 'destructive' &&
                              'hover:bg-destructive/90'
                          )}
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">
                            {action.labelVi || action.label}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {action.labelVi || action.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* More Actions Dropdown */}
                {visibleActions.length > 4 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isLoading}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                )}
              </TooltipProvider>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.confirmTitle ||
                `${confirmAction?.labelVi || confirmAction?.label}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmDescription ||
                `Bạn có chắc chắn muốn ${(confirmAction?.labelVi || confirmAction?.label)?.toLowerCase()} ${selectedCount} mục đã chọn? Hành động này không thể hoàn tác.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                confirmAction?.variant === 'destructive' &&
                  'bg-destructive hover:bg-destructive/90'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Pre-defined common bulk actions
export const COMMON_BULK_ACTIONS: BulkAction[] = [
  {
    id: 'edit',
    label: 'Edit',
    labelVi: 'Sửa',
    icon: Edit3,
    variant: 'outline',
  },
  {
    id: 'delete',
    label: 'Delete',
    labelVi: 'Xóa',
    icon: Trash2,
    variant: 'destructive',
    requireConfirm: true,
    confirmTitle: 'Xóa các mục đã chọn?',
    confirmDescription: 'Hành động này sẽ xóa vĩnh viễn các mục đã chọn và không thể hoàn tác.',
  },
  {
    id: 'export',
    label: 'Export',
    labelVi: 'Xuất',
    icon: Download,
    variant: 'outline',
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    labelVi: 'Nhân bản',
    icon: Copy,
    variant: 'outline',
  },
  {
    id: 'archive',
    label: 'Archive',
    labelVi: 'Lưu trữ',
    icon: Archive,
    variant: 'outline',
    requireConfirm: true,
  },
  {
    id: 'tag',
    label: 'Add Tag',
    labelVi: 'Thêm nhãn',
    icon: Tag,
    variant: 'outline',
  },
];

/**
 * useBulkSelection - Hook for managing bulk selection state
 */
export function useBulkSelection<T>(
  data: T[],
  getItemId: (item: T) => string
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedCount = selectedIds.size;
  const totalCount = data.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isSomeSelected = selectedCount > 0 && selectedCount < totalCount;

  const toggleItem = useCallback((item: T) => {
    const id = getItemId(item);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [getItemId]);

  const selectItem = useCallback((item: T) => {
    const id = getItemId(item);
    setSelectedIds((prev) => new Set(prev).add(id));
  }, [getItemId]);

  const deselectItem = useCallback((item: T) => {
    const id = getItemId(item);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [getItemId]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(data.map(getItemId)));
  }, [data, getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (item: T) => selectedIds.has(getItemId(item)),
    [selectedIds, getItemId]
  );

  const getSelectedItems = useCallback(
    () => data.filter((item) => selectedIds.has(getItemId(item))),
    [data, selectedIds, getItemId]
  );

  return {
    selectedIds,
    selectedCount,
    totalCount,
    isAllSelected,
    isSomeSelected,
    toggleItem,
    selectItem,
    deselectItem,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedItems,
  };
}
