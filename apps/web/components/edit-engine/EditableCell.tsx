'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChangeIndicator } from './ChangeIndicator';
import { Check, X, Undo2, Lock, Loader2, AlertCircle } from 'lucide-react';

export interface EditableCellValue {
  current: string | number | null;
  original: string | number | null;
  pending?: string | number | null;
}

export interface EditableCellProps {
  value: EditableCellValue;
  type?: 'text' | 'number' | 'decimal' | 'currency' | 'percent';
  entityType: string;
  entityId: string;
  fieldName: string;
  fieldLabel?: string;
  isEditable?: boolean;
  isLocked?: boolean;
  lockReason?: string;
  editStatus?: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  onChange: (newValue: string | number) => Promise<{ success: boolean; error?: string }>;
  onUndo?: () => Promise<void>;
  formatDisplay?: (value: string | number | null) => string;
  className?: string;
}

export function EditableCell({
  value,
  type = 'text',
  entityType,
  entityId,
  fieldName,
  fieldLabel,
  isEditable = true,
  isLocked = false,
  lockReason,
  editStatus,
  min,
  max,
  step = 1,
  precision = 2,
  onChange,
  onUndo,
  formatDisplay,
  className,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChanged = value.current !== value.original;
  const hasPendingChange = value.pending !== undefined;

  // Format display value
  const displayValue = useCallback((val: string | number | null) => {
    if (formatDisplay) return formatDisplay(val);
    if (val === null || val === undefined) return '-';

    const numVal = typeof val === 'number' ? val : parseFloat(val);

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numVal);
      case 'percent':
        return `${numVal.toFixed(precision)}%`;
      case 'decimal':
        return numVal.toFixed(precision);
      case 'number':
        return numVal.toLocaleString('vi-VN');
      default:
        return String(val);
    }
  }, [type, precision, formatDisplay]);

  // Start editing
  const startEditing = () => {
    if (!isEditable || isLocked) return;
    setIsEditing(true);
    setEditValue(String(value.current || ''));
    setError(null);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditValue('');
    setError(null);
  };

  // Save edit
  const saveEdit = async () => {
    if (!isEditing) return;

    let newValue: string | number = editValue;

    // Validate and parse based on type
    if (type !== 'text') {
      const numValue = parseFloat(editValue);
      if (isNaN(numValue)) {
        setError('Invalid number');
        return;
      }
      if (min !== undefined && numValue < min) {
        setError(`Minimum value is ${min}`);
        return;
      }
      if (max !== undefined && numValue > max) {
        setError(`Maximum value is ${max}`);
        return;
      }
      newValue = numValue;
    }

    // Skip if no change
    if (String(newValue) === String(value.current)) {
      cancelEditing();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onChange(newValue);
      if (result.success) {
        setIsEditing(false);
        setEditValue('');
      } else {
        setError(result.error || 'Save failed');
      }
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Handle undo
  const handleUndo = async () => {
    if (!onUndo || !hasChanged) return;
    setIsLoading(true);
    try {
      await onUndo();
    } finally {
      setIsLoading(false);
    }
  };

  // Focus management
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Locked state
  if (isLocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1 text-muted-foreground cursor-not-allowed', className)}>
              <Lock className="w-3 h-3" />
              <span>{displayValue(value.current)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{lockReason || 'This field is locked'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Editing state
  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Input
          ref={inputRef}
          type={type === 'text' ? 'text' : 'number'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          min={min}
          max={max}
          step={step}
          className={cn(
            'h-7 w-full min-w-[80px] text-sm',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          disabled={isLoading}
        />
        <div className="flex gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={saveEdit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3 text-green-600" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={cancelEditing}
            disabled={isLoading}
          >
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
        {error && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="w-4 h-4 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // Display state
  return (
    <div
      className={cn(
        'group flex items-center gap-1 cursor-pointer rounded px-1 -mx-1 transition-colors',
        isEditable && 'hover:bg-muted/50',
        hasChanged && 'bg-amber-50',
        hasPendingChange && 'bg-yellow-50',
        className
      )}
      onClick={startEditing}
    >
      {/* Current Value */}
      <span className={cn(
        'text-sm',
        hasChanged && 'font-medium'
      )}>
        {displayValue(hasPendingChange ? value.pending : value.current)}
      </span>

      {/* Change Indicator */}
      {hasChanged && (
        <ChangeIndicator
          oldValue={value.original}
          newValue={value.current}
          type={type === 'currency' ? 'currency' : type === 'percent' ? 'percent' : 'number'}
          status={editStatus}
          showHistory={false}
        />
      )}

      {/* Pending Badge */}
      {hasPendingChange && editStatus === 'pending' && (
        <span className="text-[10px] text-yellow-600 bg-yellow-100 px-1 rounded">
          Pending
        </span>
      )}

      {/* Undo Button */}
      {hasChanged && onUndo && (
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            handleUndo();
          }}
          disabled={isLoading}
        >
          <Undo2 className="h-3 w-3" />
        </Button>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
