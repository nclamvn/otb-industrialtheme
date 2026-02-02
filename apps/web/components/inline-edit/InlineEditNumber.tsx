'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Pencil, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface InlineEditNumberProps {
  value: number;
  onSave: (value: number) => Promise<void> | void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  prefix?: string;  // e.g., '$'
  suffix?: string;  // e.g., '%'
  formatDisplay?: (value: number) => string;
  showChange?: boolean;  // Show change indicator
  validate?: (value: number) => string | null;
  className?: string;
  inputClassName?: string;
}

export function InlineEditNumber({
  value: initialValue,
  onSave,
  onCancel,
  placeholder = '0',
  disabled = false,
  min,
  max,
  step = 1,
  precision = 0,
  prefix = '',
  suffix = '',
  formatDisplay,
  showChange = false,
  validate,
  className,
  inputClassName,
}: InlineEditNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset input when initialValue changes
  useEffect(() => {
    setInputValue(initialValue.toString());
  }, [initialValue]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const formatValue = useCallback((val: number): string => {
    if (formatDisplay) {
      return formatDisplay(val);
    }
    const formatted = precision > 0 ? val.toFixed(precision) : val.toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  }, [formatDisplay, prefix, suffix, precision]);

  const parseValue = (val: string): number => {
    // Remove prefix, suffix, and formatting
    let cleaned = val.replace(prefix, '').replace(suffix, '').replace(/,/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const validateValue = useCallback((val: number): string | null => {
    if (min !== undefined && val < min) {
      return `Minimum value is ${formatValue(min)}`;
    }
    if (max !== undefined && val > max) {
      return `Maximum value is ${formatValue(max)}`;
    }
    if (validate) {
      return validate(val);
    }
    return null;
  }, [min, max, validate, formatValue]);

  const handleSave = async () => {
    const numericValue = parseValue(inputValue);
    const validationError = validateValue(numericValue);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (numericValue === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      setPreviousValue(initialValue);
      await onSave(numericValue);
      setIsEditing(false);
      setShowSaved(true);
      setTimeout(() => {
        setShowSaved(false);
        setPreviousValue(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setInputValue(initialValue.toString());
    setError(null);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseValue(inputValue);
      const newVal = Math.min(max ?? Infinity, current + step);
      setInputValue(newVal.toString());
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseValue(inputValue);
      const newVal = Math.max(min ?? -Infinity, current - step);
      setInputValue(newVal.toString());
    }
  };

  const changeAmount = showChange && previousValue !== null
    ? initialValue - previousValue
    : null;

  if (disabled) {
    return (
      <span className="text-muted-foreground font-mono">
        {formatValue(initialValue)}
      </span>
    );
  }

  if (!isEditing) {
    return (
      <div
        className={cn(
          'group flex items-center gap-1 min-h-[32px] px-2 py-1 -mx-2 -my-1 rounded cursor-pointer',
          'hover:bg-muted/50 transition-colors',
          showSaved && 'bg-green-50 dark:bg-green-950/20',
          className
        )}
        onClick={() => setIsEditing(true)}
      >
        <span className="flex-1 font-mono">
          {formatValue(initialValue)}
        </span>
        {showSaved && changeAmount !== null && changeAmount !== 0 && (
          <span className={cn(
            'flex items-center text-xs font-mono',
            changeAmount > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {changeAmount > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {changeAmount > 0 ? '+' : ''}{formatValue(changeAmount)}
          </span>
        )}
        {showSaved && !changeAmount ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {prefix}
            </span>
          )}
          <Input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => {
                if (!isSaving) handleCancel();
              }, 150);
            }}
            disabled={isSaving}
            min={min}
            max={max}
            step={step}
            className={cn(
              'h-8 text-sm font-mono',
              prefix && 'pl-6',
              suffix && 'pr-6',
              error && 'border-red-500 focus-visible:ring-red-500',
              inputClassName
            )}
          />
          {suffix && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {suffix}
            </span>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4 text-green-500" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {min !== undefined && max !== undefined && (
        <p className="text-[10px] text-muted-foreground">
          Range: {formatValue(min)} - {formatValue(max)}
        </p>
      )}
    </div>
  );
}
