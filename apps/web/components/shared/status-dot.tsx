'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'inactive'
  | 'processing';

interface StatusDotProps {
  status: StatusType;
  label?: string;
  showTooltip?: boolean;
  pulse?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  { color: string; pulseColor?: string; label: string; labelVi: string }
> = {
  success: {
    color: 'bg-green-500',
    label: 'Success',
    labelVi: 'Thành công',
  },
  warning: {
    color: 'bg-amber-500',
    label: 'Warning',
    labelVi: 'Cảnh báo',
  },
  error: {
    color: 'bg-red-500',
    label: 'Error',
    labelVi: 'Lỗi',
  },
  info: {
    color: 'bg-blue-500',
    label: 'Info',
    labelVi: 'Thông tin',
  },
  pending: {
    color: 'bg-yellow-500',
    pulseColor: 'bg-yellow-400',
    label: 'Pending',
    labelVi: 'Đang chờ',
  },
  inactive: {
    color: 'bg-gray-400',
    label: 'Inactive',
    labelVi: 'Không hoạt động',
  },
  processing: {
    color: 'bg-blue-500',
    pulseColor: 'bg-blue-400',
    label: 'Processing',
    labelVi: 'Đang xử lý',
  },
};

const SIZE_CLASSES = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
};

/**
 * StatusDot - Simple status indicator dot
 */
export function StatusDot({
  status,
  label,
  showTooltip = true,
  pulse = false,
  size = 'sm',
  className,
}: StatusDotProps) {
  const config = STATUS_CONFIG[status];
  const shouldPulse = pulse || status === 'pending' || status === 'processing';

  const dot = (
    <span className={cn('relative inline-flex', className)}>
      {shouldPulse && config.pulseColor && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            config.pulseColor,
            SIZE_CLASSES[size]
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full',
          config.color,
          SIZE_CLASSES[size]
        )}
      />
    </span>
  );

  if (!showTooltip) {
    return dot;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{dot}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{label || config.labelVi}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * StatusDotWithLabel - Status dot with inline label
 */
interface StatusDotWithLabelProps extends Omit<StatusDotProps, 'showTooltip'> {
  locale?: 'en' | 'vi';
}

export function StatusDotWithLabel({
  status,
  label,
  locale = 'vi',
  pulse,
  size = 'sm',
  className,
}: StatusDotWithLabelProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <StatusDot status={status} showTooltip={false} pulse={pulse} size={size} />
      <span className="text-sm">
        {label || (locale === 'vi' ? config.labelVi : config.label)}
      </span>
    </span>
  );
}

/**
 * OnlineStatus - Specific component for online/offline status
 */
interface OnlineStatusProps {
  isOnline: boolean;
  showLabel?: boolean;
  locale?: 'en' | 'vi';
  className?: string;
}

export function OnlineStatus({
  isOnline,
  showLabel = false,
  locale = 'vi',
  className,
}: OnlineStatusProps) {
  const status = isOnline ? 'success' : 'inactive';
  const label = isOnline
    ? locale === 'vi'
      ? 'Đang hoạt động'
      : 'Online'
    : locale === 'vi'
      ? 'Ngoại tuyến'
      : 'Offline';

  if (showLabel) {
    return (
      <StatusDotWithLabel
        status={status}
        label={label}
        pulse={isOnline}
        className={className}
      />
    );
  }

  return (
    <StatusDot
      status={status}
      label={label}
      pulse={isOnline}
      className={className}
    />
  );
}

/**
 * SyncStatus - Component for sync/data freshness status
 */
interface SyncStatusProps {
  lastSyncAt?: Date | string;
  isSyncing?: boolean;
  hasError?: boolean;
  locale?: 'en' | 'vi';
  className?: string;
}

export function SyncStatus({
  lastSyncAt,
  isSyncing = false,
  hasError = false,
  locale = 'vi',
  className,
}: SyncStatusProps) {
  let status: StatusType = 'success';
  let label = locale === 'vi' ? 'Đã đồng bộ' : 'Synced';

  if (isSyncing) {
    status = 'processing';
    label = locale === 'vi' ? 'Đang đồng bộ...' : 'Syncing...';
  } else if (hasError) {
    status = 'error';
    label = locale === 'vi' ? 'Lỗi đồng bộ' : 'Sync error';
  } else if (lastSyncAt) {
    const syncTime = typeof lastSyncAt === 'string' ? new Date(lastSyncAt) : lastSyncAt;
    const minutesAgo = Math.floor((Date.now() - syncTime.getTime()) / 60000);

    if (minutesAgo > 30) {
      status = 'warning';
      label = locale === 'vi' ? 'Dữ liệu có thể đã cũ' : 'Data may be stale';
    }
  }

  return (
    <StatusDotWithLabel
      status={status}
      label={label}
      pulse={isSyncing}
      className={className}
    />
  );
}
