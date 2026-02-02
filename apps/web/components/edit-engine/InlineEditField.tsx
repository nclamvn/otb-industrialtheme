'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Edit3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

type EditFieldType = 'text' | 'number' | 'currency' | 'percent' | 'select' | 'date';

interface SelectOption {
  value: string;
  label: string;
}

interface InlineEditFieldProps {
  /** Current value */
  value: string | number;
  /** Field identifier for cascade engine */
  fieldName: string;
  /** Display label (Vietnamese) */
  label?: string;
  /** Input type */
  fieldType?: EditFieldType;
  /** Currency code for currency type */
  currency?: string;
  /** Options for select type */
  options?: SelectOption[];
  /** Whether field is editable */
  editable?: boolean;
  /** Save handler - receives new value, should throw on error */
  onSave: (newValue: string | number) => Promise<void>;
  /** Custom display formatter */
  formatDisplay?: (value: string | number) => string;
  /** Additional CSS classes */
  className?: string;
}

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function InlineEditField({
  value,
  fieldName,
  label,
  fieldType = 'text',
  currency = 'VND',
  options,
  editable = true,
  onSave,
  formatDisplay,
  className = '',
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  // Focus and select on edit start
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // Sync external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(value));
      setJustSaved(false);
    }
  }, [value, isEditing]);

  // ── Format display value ──
  const displayValue = useCallback(
    (val: string | number): string => {
      if (formatDisplay) return formatDisplay(val);
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) && fieldType !== 'text' && fieldType !== 'select')
        return String(val);

      switch (fieldType) {
        case 'currency':
          return `${num.toLocaleString('vi-VN')} ${currency}`;
        case 'percent':
          return `${num.toFixed(1)}%`;
        case 'number':
          return num.toLocaleString('vi-VN');
        case 'date':
          return new Date(String(val)).toLocaleDateString('vi-VN');
        case 'select':
          return (
            options?.find((o) => o.value === String(val))?.label || String(val)
          );
        default:
          return String(val);
      }
    },
    [fieldType, currency, formatDisplay, options]
  );

  // ── Save handler ──
  const handleSave = useCallback(async () => {
    if (editValue === String(value)) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const saveVal = ['number', 'currency', 'percent'].includes(fieldType)
        ? parseFloat(editValue.replace(/,/g, ''))
        : editValue;

      if (
        ['number', 'currency', 'percent'].includes(fieldType) &&
        isNaN(saveVal as number)
      ) {
        throw new Error('Giá trị không hợp lệ');
      }

      await onSave(saveVal);
      setIsEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lưu thất bại';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, fieldType, onSave]);

  // ── Cancel handler ──
  const handleCancel = useCallback(() => {
    setEditValue(String(value));
    setIsEditing(false);
    setError(null);
  }, [value]);

  // ── Keyboard shortcuts ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  // ── Non-editable display ──
  if (!editable) {
    return (
      <span className={cn('font-mono text-sm', className)}>
        {displayValue(value)}
      </span>
    );
  }

  // ════════════════════════════════════════
  // Render
  // ════════════════════════════════════════

  return (
    <div className={cn('group relative inline-flex items-center gap-1', className)}>
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            {fieldType === 'select' && options ? (
              <select
                ref={inputRef as React.Ref<HTMLSelectElement>}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(handleCancel, 150)}
                className="px-2 py-1 bg-background border border-[#B8860B] rounded-lg text-sm font-mono focus:ring-1 focus:ring-[#B8860B] outline-none min-w-[100px]"
              >
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                ref={inputRef as React.Ref<HTMLInputElement>}
                type={
                  ['number', 'currency', 'percent'].includes(fieldType)
                    ? 'number'
                    : fieldType === 'date'
                      ? 'date'
                      : 'text'
                }
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                step={
                  fieldType === 'percent'
                    ? '0.1'
                    : fieldType === 'currency'
                      ? '1'
                      : undefined
                }
                className={cn(
                  'px-2 py-1 bg-background border rounded-lg text-sm font-mono focus:ring-1 outline-none min-w-[80px] max-w-[140px]',
                  error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-[#B8860B] focus:ring-[#B8860B]'
                )}
              />
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 rounded-md bg-[#127749] text-white hover:bg-[#0d5a36] disabled:opacity-50 transition-colors"
              title="Enter để lưu"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Cancel button */}
            <button
              onClick={handleCancel}
              className="p-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Esc để hủy"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="display-mode"
            initial={justSaved ? { scale: 1.05 } : { opacity: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsEditing(true);
              setError(null);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all cursor-pointer',
              'hover:bg-[#B8860B]/10 group',
              justSaved && 'bg-[#127749]/10 ring-1 ring-[#127749]/30',
              error && 'ring-1 ring-red-500/30'
            )}
            title="Nhấn để sửa"
          >
            <span className="font-mono text-sm">{displayValue(value)}</span>
            <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Error tooltip */}
      {error && !isEditing && (
        <span className="text-[9px] text-red-500 absolute -bottom-4 left-0 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
}

export default InlineEditField;
export type { InlineEditFieldProps, EditFieldType, SelectOption };
