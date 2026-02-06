'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-6: MobileQuickActions — Floating Action Bar for Mobile
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  X,
  Search,
  Filter,
  Upload,
  Download,
  Share2,
  Edit2,
  Trash2,
  Check,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── Action Type ────────────────────────────────────────────────────────────────
export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'destructive';
  disabled?: boolean;
  badge?: number;
}

// ─── Props ──────────────────────────────────────────────────────────────────────
interface MobileQuickActionsProps {
  actions: QuickAction[];
  primaryAction?: QuickAction;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  expandable?: boolean;
  className?: string;
}

// ─── Mobile Quick Actions Component ─────────────────────────────────────────────
export function MobileQuickActions({
  actions,
  primaryAction,
  position = 'bottom-right',
  expandable = true,
  className,
}: MobileQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const positionClasses = {
    'bottom-right': 'right-4',
    'bottom-center': 'left-1/2 -translate-x-1/2',
    'bottom-left': 'left-4',
  };

  // If not expandable, show all actions in a bar
  if (!expandable) {
    return (
      <div
        className={cn(
          'fixed bottom-20 z-40 flex items-center gap-2 p-2 bg-background/95 backdrop-blur border rounded-full shadow-lg',
          positionClasses[position],
          className
        )}
      >
        {actions.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
        {primaryAction && (
          <Button
            size="icon"
            className="w-12 h-12 rounded-full"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.icon}
          </Button>
        )}
      </div>
    );
  }

  // Expandable FAB style
  return (
    <div
      className={cn(
        'fixed bottom-20 z-40',
        positionClasses[position],
        className
      )}
    >
      {/* Expanded Actions */}
      <div
        className={cn(
          'flex flex-col-reverse items-center gap-2 mb-2 transition-all duration-200',
          isExpanded
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {actions.map((action, index) => (
          <div
            key={action.id}
            className="transition-all duration-200"
            style={{
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
              transform: isExpanded ? 'scale(1)' : 'scale(0.8)',
            }}
          >
            <QuickActionButton action={action} showLabel />
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          'w-14 h-14 rounded-full shadow-lg transition-transform',
          isExpanded && 'rotate-45'
        )}
        onClick={() => {
          if (primaryAction && !isExpanded) {
            primaryAction.onClick();
          } else {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : primaryAction ? (
          primaryAction.icon
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </Button>

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

// ─── Quick Action Button Component ──────────────────────────────────────────────
interface QuickActionButtonProps {
  action: QuickAction;
  showLabel?: boolean;
}

function QuickActionButton({ action, showLabel }: QuickActionButtonProps) {
  const variantClasses = {
    default: 'bg-background border hover:bg-muted',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  const button = (
    <button
      className={cn(
        'relative flex items-center gap-2 p-3 rounded-full shadow transition-colors',
        variantClasses[action.variant || 'default'],
        action.disabled && 'opacity-50 pointer-events-none'
      )}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.icon}
      {showLabel && <span className="text-sm font-medium pr-1">{action.label}</span>}
      {action.badge !== undefined && action.badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
          {action.badge > 99 ? '99+' : action.badge}
        </span>
      )}
    </button>
  );

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="left">
            <p>{action.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

// ─── Selection Bar Component ────────────────────────────────────────────────────
interface MobileSelectionBarProps {
  selectedCount: number;
  onClear: () => void;
  onSelectAll?: () => void;
  actions: QuickAction[];
  className?: string;
}

export function MobileSelectionBar({
  selectedCount,
  onClear,
  onSelectAll,
  actions,
  className,
}: MobileSelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-4 bg-primary text-primary-foreground',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onClear}
          >
            <X className="w-5 h-5" />
          </Button>
          <span className="font-medium">{selectedCount} đã chọn</span>
          {onSelectAll && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onSelectAll}
            >
              Chọn tất cả
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="icon"
              className={cn(
                'text-primary-foreground hover:bg-primary-foreground/20',
                action.variant === 'destructive' && 'hover:bg-red-500'
              )}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Preset Quick Actions ───────────────────────────────────────────────────────
export const PRESET_QUICK_ACTIONS = {
  search: (onClick: () => void): QuickAction => ({
    id: 'search',
    label: 'Tìm kiếm',
    icon: <Search className="w-5 h-5" />,
    onClick,
  }),
  filter: (onClick: () => void, activeCount?: number): QuickAction => ({
    id: 'filter',
    label: 'Bộ lọc',
    icon: <Filter className="w-5 h-5" />,
    onClick,
    badge: activeCount,
  }),
  upload: (onClick: () => void): QuickAction => ({
    id: 'upload',
    label: 'Tải lên',
    icon: <Upload className="w-5 h-5" />,
    onClick,
    variant: 'primary',
  }),
  download: (onClick: () => void): QuickAction => ({
    id: 'download',
    label: 'Tải xuống',
    icon: <Download className="w-5 h-5" />,
    onClick,
  }),
  share: (onClick: () => void): QuickAction => ({
    id: 'share',
    label: 'Chia sẻ',
    icon: <Share2 className="w-5 h-5" />,
    onClick,
  }),
  edit: (onClick: () => void): QuickAction => ({
    id: 'edit',
    label: 'Chỉnh sửa',
    icon: <Edit2 className="w-5 h-5" />,
    onClick,
  }),
  delete: (onClick: () => void): QuickAction => ({
    id: 'delete',
    label: 'Xóa',
    icon: <Trash2 className="w-5 h-5" />,
    onClick,
    variant: 'destructive',
  }),
  approve: (onClick: () => void): QuickAction => ({
    id: 'approve',
    label: 'Duyệt',
    icon: <Check className="w-5 h-5" />,
    onClick,
    variant: 'primary',
  }),
};

export default MobileQuickActions;
