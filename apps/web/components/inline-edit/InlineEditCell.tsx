'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Pencil, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface InlineEditCellProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  validate?: (value: string) => string | null; // Returns error message or null
  className?: string;
  inputClassName?: string;
  displayClassName?: string;
}

export function InlineEditCell({
  value: initialValue,
  onSave,
  onCancel,
  placeholder = 'Click to edit',
  disabled = false,
  required = false,
  minLength,
  maxLength,
  validate,
  className,
  inputClassName,
  displayClassName,
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value when initialValue changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validateValue = useCallback((val: string): string | null => {
    if (required && !val.trim()) {
      return 'This field is required';
    }
    if (minLength && val.length < minLength) {
      return `Minimum ${minLength} characters required`;
    }
    if (maxLength && val.length > maxLength) {
      return `Maximum ${maxLength} characters allowed`;
    }
    if (validate) {
      return validate(val);
    }
    return null;
  }, [required, minLength, maxLength, validate]);

  const handleSave = async () => {
    const validationError = validateValue(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(value);
      setIsEditing(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setError(null);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (disabled) {
    return (
      <span className={cn('text-muted-foreground', displayClassName)}>
        {initialValue || placeholder}
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
        <span className={cn('flex-1', displayClassName, !initialValue && 'text-muted-foreground')}>
          {initialValue || placeholder}
        </span>
        {showSaved ? (
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
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay to allow button clicks
            setTimeout(() => {
              if (!isSaving) handleCancel();
            }, 150);
          }}
          disabled={isSaving}
          maxLength={maxLength}
          className={cn(
            'h-8 text-sm',
            error && 'border-red-500 focus-visible:ring-red-500',
            inputClassName
          )}
        />
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
    </div>
  );
}
