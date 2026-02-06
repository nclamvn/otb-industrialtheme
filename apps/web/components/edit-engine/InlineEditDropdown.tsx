'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Percent,
  Plus,
  Minus,
  Loader2,
  History,
  GitBranch,
  Calculator,
} from 'lucide-react';
import { hasCascadeEffects, calculateCascade } from '@/lib/edit';

// Quick adjustment presets
const QUICK_ADJUSTMENTS = [
  { label: '+5%', value: 5, type: 'percent' as const },
  { label: '+10%', value: 10, type: 'percent' as const },
  { label: '-5%', value: -5, type: 'percent' as const },
  { label: '-10%', value: -10, type: 'percent' as const },
];

interface InlineEditDropdownProps {
  value: number;
  originalValue?: number;
  fieldName: string;
  fieldLabel?: string;
  entityType?: string;
  entityId?: string;
  type?: 'number' | 'currency' | 'percent';
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  currentValues?: Record<string, number>;
  onSave: (newValue: number, reason?: string) => Promise<{ success: boolean; error?: string }>;
  onHistoryClick?: () => void;
  formatDisplay?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

/**
 * InlineEditDropdown - Inline edit with quick adjustment options
 * Features:
 * - Direct value input
 * - Quick % adjustments
 * - +/- adjustments
 * - Cascade preview
 * - History link
 */
export function InlineEditDropdown({
  value,
  originalValue,
  fieldName,
  fieldLabel,
  entityType,
  entityId,
  type = 'number',
  min,
  max,
  step = 1,
  precision = 2,
  currentValues = {},
  onSave,
  onHistoryClick,
  formatDisplay,
  disabled = false,
  className,
}: InlineEditDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChanged = originalValue !== undefined && value !== originalValue;
  const hasCascade = hasCascadeEffects(fieldName);

  // Format display
  const displayFormatted = useCallback(
    (val: number) => {
      if (formatDisplay) return formatDisplay(val);
      switch (type) {
        case 'currency':
          return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(val);
        case 'percent':
          return `${val.toFixed(precision)}%`;
        default:
          return val.toLocaleString('vi-VN');
      }
    },
    [type, precision, formatDisplay]
  );

  // Calculate new value from adjustment
  const calculateNewValue = useCallback(
    (adjustment: number, adjustType: 'percent' | 'absolute'): number => {
      let newVal: number;
      if (adjustType === 'percent') {
        newVal = value * (1 + adjustment / 100);
      } else {
        newVal = value + adjustment;
      }

      // Apply constraints
      if (min !== undefined) newVal = Math.max(min, newVal);
      if (max !== undefined) newVal = Math.min(max, newVal);

      return Number(newVal.toFixed(precision));
    },
    [value, min, max, precision]
  );

  // Preview cascade effects
  const previewCascade = useCallback(
    (newValue: number) => {
      if (!hasCascade) return [];
      return calculateCascade(fieldName, newValue, currentValues);
    },
    [fieldName, hasCascade, currentValues]
  );

  // Handle quick adjustment
  const handleQuickAdjust = async (adjustment: number, adjustType: 'percent' | 'absolute') => {
    const newValue = calculateNewValue(adjustment, adjustType);
    await handleSave(newValue);
  };

  // Handle custom value save
  const handleSave = async (newValue: number) => {
    if (newValue === value) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onSave(newValue);
      if (result.success) {
        setIsOpen(false);
        setShowCustomInput(false);
        setEditValue('');
      } else {
        setError(result.error || 'Lưu thất bại');
      }
    } catch (err: any) {
      setError(err.message || 'Lưu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle custom input submit
  const handleCustomSubmit = () => {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) {
      setError('Giá trị không hợp lệ');
      return;
    }
    if (min !== undefined && numValue < min) {
      setError(`Giá trị tối thiểu: ${min}`);
      return;
    }
    if (max !== undefined && numValue > max) {
      setError(`Giá trị tối đa: ${max}`);
      return;
    }
    handleSave(numValue);
  };

  // Focus input when showing custom input
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showCustomInput]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setShowCustomInput(false);
      setEditValue('');
      setError(null);
    }
  }, [isOpen]);

  // Calculate percentage change from original
  const percentFromOriginal =
    hasChanged && originalValue
      ? ((value - originalValue) / originalValue) * 100
      : 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'group inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors text-left',
            !disabled && 'hover:bg-muted cursor-pointer',
            disabled && 'cursor-not-allowed opacity-60',
            hasChanged && 'bg-amber-50',
            className
          )}
        >
          <span className={cn('text-sm', hasChanged && 'font-medium')}>
            {displayFormatted(value)}
          </span>
          {hasChanged && (
            <Badge
              variant="outline"
              className={cn(
                'h-4 px-1 text-[9px] font-normal',
                percentFromOriginal > 0
                  ? 'border-green-500 text-green-600'
                  : 'border-red-500 text-red-600'
              )}
            >
              {percentFromOriginal > 0 && '+'}
              {percentFromOriginal.toFixed(1)}%
            </Badge>
          )}
          {hasCascade && (
            <GitBranch className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <div className="px-3 py-2 border-b">
            <div className="text-xs text-muted-foreground">
              {fieldLabel || fieldName}
            </div>
            <div className="text-sm font-medium">
              {displayFormatted(value)}
              {hasChanged && originalValue && (
                <span className="text-xs text-muted-foreground ml-2">
                  (gốc: {displayFormatted(originalValue)})
                </span>
              )}
            </div>
          </div>

          <CommandList>
            {/* Quick Adjustments */}
            <CommandGroup heading="Điều chỉnh nhanh">
              <div className="grid grid-cols-2 gap-1 p-2">
                {QUICK_ADJUSTMENTS.map((adj) => {
                  const newVal = calculateNewValue(adj.value, adj.type);
                  return (
                    <Button
                      key={adj.label}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs justify-start"
                      disabled={isLoading}
                      onClick={() => handleQuickAdjust(adj.value, adj.type)}
                    >
                      {adj.value > 0 ? (
                        <ArrowUp className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <ArrowDown className="w-3 h-3 mr-1 text-red-600" />
                      )}
                      {adj.label}
                      <span className="ml-auto text-muted-foreground">
                        → {displayFormatted(newVal)}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </CommandGroup>

            <CommandSeparator />

            {/* Custom Input */}
            <CommandGroup heading="Giá trị tùy chỉnh">
              {showCustomInput ? (
                <div className="p-2 space-y-2">
                  <div className="flex gap-1">
                    <Input
                      ref={inputRef}
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder={String(value)}
                      min={min}
                      max={max}
                      step={step}
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCustomSubmit();
                        if (e.key === 'Escape') setShowCustomInput(false);
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-[#127749] hover:bg-[#0d5a36]"
                      onClick={handleCustomSubmit}
                      disabled={isLoading || !editValue}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setShowCustomInput(false)}
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}

                  {/* Cascade Preview */}
                  {hasCascade && editValue && (
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 mb-1">
                        <GitBranch className="w-3 h-3" />
                        Thay đổi liên quan:
                      </div>
                      {previewCascade(parseFloat(editValue))
                        .slice(0, 3)
                        .map((effect, i) => (
                          <div key={i} className="ml-4">
                            {effect.field}: {effect.oldValue.toFixed(0)} →{' '}
                            {effect.newValue.toFixed(0)}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <CommandItem
                  onSelect={() => {
                    setShowCustomInput(true);
                    setEditValue(String(value));
                  }}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Nhập giá trị mới
                </CommandItem>
              )}
            </CommandGroup>

            {/* History Link */}
            {onHistoryClick && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={onHistoryClick}>
                    <History className="w-4 h-4 mr-2" />
                    Xem lịch sử thay đổi
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
