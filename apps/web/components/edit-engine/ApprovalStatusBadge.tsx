'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Clock,
  Check,
  CheckCheck,
  X,
  Undo2,
  ShieldCheck,
  AlertCircle,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

type EditStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'AUTO_APPROVED'
  | 'REVERTED';

interface ApprovalInfo {
  approvedBy?: { name: string; email?: string };
  approvedAt?: string;
  rejectedBy?: { name: string; email?: string };
  rejectedAt?: string;
  rejectReason?: string;
  revertedBy?: { name: string; email?: string };
  revertedAt?: string;
}

interface ApprovalStatusBadgeProps {
  status: EditStatus;
  approvalInfo?: ApprovalInfo;
  size?: 'xs' | 'sm' | 'default';
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  EditStatus,
  {
    label: string;
    labelVi: string;
    icon: React.ElementType;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  PENDING: {
    label: 'Pending',
    labelVi: 'Chờ duyệt',
    icon: Clock,
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-600 bg-yellow-50',
  },
  APPROVED: {
    label: 'Approved',
    labelVi: 'Đã duyệt',
    icon: Check,
    variant: 'default',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  AUTO_APPROVED: {
    label: 'Auto-approved',
    labelVi: 'Tự động duyệt',
    icon: ShieldCheck,
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  REJECTED: {
    label: 'Rejected',
    labelVi: 'Từ chối',
    icon: X,
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  REVERTED: {
    label: 'Reverted',
    labelVi: 'Đã hoàn tác',
    icon: Undo2,
    variant: 'outline',
    className: 'border-gray-400 text-gray-600 bg-gray-50',
  },
};

/**
 * ApprovalStatusBadge - Display edit approval status with tooltip info
 */
export function ApprovalStatusBadge({
  status,
  approvalInfo,
  size = 'sm',
  showIcon = true,
  showTooltip = true,
  className,
}: ApprovalStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-[9px] px-1 py-0 h-4',
    sm: 'text-[10px] px-1.5 py-0 h-5',
    default: 'text-xs px-2 py-0.5',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    default: 'w-3.5 h-3.5',
  };

  const badge = (
    <Badge
      variant={config.variant}
      className={cn(sizeClasses[size], config.className, className)}
    >
      {showIcon && <Icon className={cn(iconSizes[size], 'mr-1')} />}
      {config.labelVi}
    </Badge>
  );

  if (!showTooltip || !approvalInfo) {
    return badge;
  }

  // Build tooltip content
  const tooltipContent = (
    <div className="space-y-1.5 text-xs">
      <div className="font-medium flex items-center gap-1">
        <Icon className="w-3.5 h-3.5" />
        {config.labelVi}
      </div>

      {status === 'APPROVED' && approvalInfo.approvedBy && (
        <>
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="w-3 h-3" />
            {approvalInfo.approvedBy.name}
          </div>
          {approvalInfo.approvedAt && (
            <div className="text-muted-foreground">
              {formatDistanceToNow(new Date(approvalInfo.approvedAt), {
                addSuffix: true,
                locale: vi,
              })}
            </div>
          )}
        </>
      )}

      {status === 'AUTO_APPROVED' && (
        <div className="text-muted-foreground">
          Được tự động duyệt theo quy tắc hệ thống
        </div>
      )}

      {status === 'REJECTED' && (
        <>
          {approvalInfo.rejectedBy && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="w-3 h-3" />
              {approvalInfo.rejectedBy.name}
            </div>
          )}
          {approvalInfo.rejectReason && (
            <div className="text-red-600 italic">
              "{approvalInfo.rejectReason}"
            </div>
          )}
          {approvalInfo.rejectedAt && (
            <div className="text-muted-foreground">
              {formatDistanceToNow(new Date(approvalInfo.rejectedAt), {
                addSuffix: true,
                locale: vi,
              })}
            </div>
          )}
        </>
      )}

      {status === 'REVERTED' && approvalInfo.revertedBy && (
        <>
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="w-3 h-3" />
            {approvalInfo.revertedBy.name}
          </div>
          {approvalInfo.revertedAt && (
            <div className="text-muted-foreground">
              {formatDistanceToNow(new Date(approvalInfo.revertedAt), {
                addSuffix: true,
                locale: vi,
              })}
            </div>
          )}
        </>
      )}

      {status === 'PENDING' && (
        <div className="text-muted-foreground">Đang chờ phê duyệt</div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * ApprovalPendingCount - Badge showing count of pending approvals
 */
interface ApprovalPendingCountProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

export function ApprovalPendingCount({
  count,
  onClick,
  className,
}: ApprovalPendingCountProps) {
  if (count === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'cursor-pointer border-yellow-500 text-yellow-600 bg-yellow-50 hover:bg-yellow-100',
              className
            )}
            onClick={onClick}
          >
            <Clock className="w-3 h-3 mr-1" />
            {count} chờ duyệt
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{count} thay đổi đang chờ phê duyệt</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * ApprovalSummary - Summary of approval statuses
 */
interface ApprovalSummaryProps {
  pending: number;
  approved: number;
  rejected: number;
  autoApproved?: number;
  showLabels?: boolean;
  className?: string;
}

export function ApprovalSummary({
  pending,
  approved,
  rejected,
  autoApproved = 0,
  showLabels = false,
  className,
}: ApprovalSummaryProps) {
  const total = pending + approved + rejected + autoApproved;
  if (total === 0) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {pending > 0 && (
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-yellow-600" />
          <span className="text-xs text-yellow-600 font-medium">{pending}</span>
          {showLabels && (
            <span className="text-xs text-muted-foreground">chờ</span>
          )}
        </div>
      )}
      {approved > 0 && (
        <div className="flex items-center gap-1">
          <Check className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs text-green-600 font-medium">{approved}</span>
          {showLabels && (
            <span className="text-xs text-muted-foreground">duyệt</span>
          )}
        </div>
      )}
      {autoApproved > 0 && (
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs text-blue-600 font-medium">
            {autoApproved}
          </span>
          {showLabels && (
            <span className="text-xs text-muted-foreground">tự động</span>
          )}
        </div>
      )}
      {rejected > 0 && (
        <div className="flex items-center gap-1">
          <X className="w-3.5 h-3.5 text-red-600" />
          <span className="text-xs text-red-600 font-medium">{rejected}</span>
          {showLabels && (
            <span className="text-xs text-muted-foreground">từ chối</span>
          )}
        </div>
      )}
    </div>
  );
}
