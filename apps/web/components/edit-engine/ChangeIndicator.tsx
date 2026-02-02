'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowUp, ArrowDown, Minus, History, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ChangeIndicatorProps {
  oldValue: number | string | null;
  newValue: number | string | null;
  type?: 'number' | 'percent' | 'currency' | 'text';
  showArrow?: boolean;
  showDiff?: boolean;
  showHistory?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  editedBy?: string;
  editedAt?: Date;
  onHistoryClick?: () => void;
  className?: string;
}

export function ChangeIndicator({
  oldValue,
  newValue,
  type = 'number',
  showArrow = true,
  showDiff = true,
  showHistory = false,
  status,
  editedBy,
  editedAt,
  onHistoryClick,
  className,
}: ChangeIndicatorProps) {
  // Calculate difference
  const oldNum = typeof oldValue === 'number' ? oldValue : parseFloat(oldValue || '0');
  const newNum = typeof newValue === 'number' ? newValue : parseFloat(newValue || '0');
  const diff = newNum - oldNum;
  const percentChange = oldNum !== 0 ? ((newNum - oldNum) / oldNum) * 100 : 0;

  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const hasChanged = diff !== 0 || oldValue !== newValue;

  if (!hasChanged) return null;

  // Format values
  const formatValue = (val: number) => {
    if (type === 'percent') return `${val.toFixed(1)}%`;
    if (type === 'currency') return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(val % 1 === 0 ? 0 : 2);
  };

  // Status colors
  const statusConfig = {
    pending: { color: 'text-yellow-600 bg-yellow-50', icon: Clock },
    approved: { color: 'text-green-600 bg-green-50', icon: CheckCircle },
    rejected: { color: 'text-red-600 bg-red-50', icon: AlertCircle },
    auto_approved: { color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  };

  const StatusIcon = status ? statusConfig[status].icon : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium rounded px-1 py-0.5',
              isPositive && 'text-green-600 bg-green-50',
              isNegative && 'text-red-600 bg-red-50',
              !isPositive && !isNegative && type === 'text' && 'text-blue-600 bg-blue-50',
              status && statusConfig[status].color,
              className
            )}
          >
            {/* Arrow Indicator */}
            {showArrow && type !== 'text' && (
              <>
                {isPositive && <ArrowUp className="w-3 h-3" />}
                {isNegative && <ArrowDown className="w-3 h-3" />}
                {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
              </>
            )}

            {/* Difference Value */}
            {showDiff && type !== 'text' && (
              <span>
                {isPositive && '+'}
                {formatValue(diff)}
              </span>
            )}

            {/* Percent Change */}
            {type !== 'text' && Math.abs(percentChange) >= 1 && (
              <span className="text-[10px] opacity-75">
                ({isPositive && '+'}
                {percentChange.toFixed(1)}%)
              </span>
            )}

            {/* Status Icon */}
            {StatusIcon && <StatusIcon className="w-3 h-3 ml-0.5" />}

            {/* History Button */}
            {showHistory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onHistoryClick?.();
                }}
                className="ml-0.5 hover:opacity-70"
              >
                <History className="w-3 h-3" />
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Previous:</span>
              <span className="font-medium">
                {type === 'text' ? oldValue : formatValue(oldNum)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-medium">
                {type === 'text' ? newValue : formatValue(newNum)}
              </span>
            </div>
            {type !== 'text' && (
              <div className="flex justify-between gap-4 border-t pt-1">
                <span className="text-muted-foreground">Change:</span>
                <span className={cn(
                  'font-medium',
                  isPositive && 'text-green-600',
                  isNegative && 'text-red-600'
                )}>
                  {isPositive && '+'}
                  {formatValue(diff)} ({percentChange.toFixed(1)}%)
                </span>
              </div>
            )}
            {editedBy && (
              <div className="border-t pt-1 text-muted-foreground">
                Edited by {editedBy}
                {editedAt && ` • ${new Date(editedAt).toLocaleString('vi-VN')}`}
              </div>
            )}
            {status && (
              <div className="border-t pt-1">
                Status: <span className="capitalize">{status.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
