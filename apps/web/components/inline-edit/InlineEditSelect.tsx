'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, Pencil, Loader2, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

interface InlineEditSelectProps {
  value: string;
  options: SelectOption[];
  onSave: (value: string) => Promise<void> | void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
  displayAsBadge?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function InlineEditSelect({
  value: initialValue,
  options,
  onSave,
  onCancel,
  placeholder = 'Select...',
  disabled = false,
  displayAsBadge = false,
  className,
  triggerClassName,
}: InlineEditSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const currentOption = options.find((opt) => opt.value === initialValue);

  const handleChange = useCallback(async (newValue: string) => {
    if (newValue === initialValue) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);

    try {
      await onSave(newValue);
      setIsOpen(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [initialValue, onSave]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSaving) {
      onCancel?.();
    }
    setIsOpen(open);
  };

  if (disabled) {
    return displayAsBadge && currentOption ? (
      <Badge
        variant="secondary"
        className={currentOption.color}
      >
        {currentOption.icon}
        {currentOption.label}
      </Badge>
    ) : (
      <span className="text-muted-foreground">
        {currentOption?.label || placeholder}
      </span>
    );
  }

  // Badge display mode
  if (displayAsBadge) {
    return (
      <div className={cn('group flex items-center gap-1', className)}>
        <Select
          value={initialValue}
          onValueChange={handleChange}
          open={isOpen}
          onOpenChange={handleOpenChange}
          disabled={isSaving}
        >
          <SelectTrigger
            className={cn(
              'h-auto border-0 p-0 shadow-none focus:ring-0',
              'bg-transparent hover:bg-transparent',
              triggerClassName
            )}
          >
            <Badge
              variant="secondary"
              className={cn(
                'cursor-pointer transition-all',
                currentOption?.color,
                showSaved && 'ring-2 ring-green-500 ring-offset-2'
              )}
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : currentOption?.icon ? (
                <span className="mr-1">{currentOption.icon}</span>
              ) : null}
              {currentOption?.label || placeholder}
              <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
            </Badge>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="flex items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <Badge variant="secondary" className={cn('text-xs', option.color)}>
                    {option.label}
                  </Badge>
                  {option.value === initialValue && (
                    <Check className="w-3 h-3 ml-auto text-green-500" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showSaved && <Check className="w-3.5 h-3.5 text-green-500" />}
      </div>
    );
  }

  // Standard dropdown mode
  return (
    <div className={cn('group flex items-center gap-1', className)}>
      <Select
        value={initialValue}
        onValueChange={handleChange}
        open={isOpen}
        onOpenChange={handleOpenChange}
        disabled={isSaving}
      >
        <SelectTrigger
          className={cn(
            'h-8 text-sm',
            showSaved && 'ring-2 ring-green-500',
            triggerClassName
          )}
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
                {option.value === initialValue && (
                  <Check className="w-3 h-3 ml-auto text-green-500" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!isOpen && !isSaving && (
        <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      {showSaved && <Check className="w-3.5 h-3.5 text-green-500" />}
    </div>
  );
}
