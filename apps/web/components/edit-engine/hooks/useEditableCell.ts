'use client';

import { useState, useCallback, useMemo } from 'react';
import { calculateCascade, hasCascadeEffects } from '@/lib/edit';

// Types
export interface EditableCellState {
  current: string | number | null;
  original: string | number | null;
  pending?: string | number | null;
  editStatus?: 'pending' | 'approved' | 'rejected' | 'auto_approved';
}

export interface CascadeEffect {
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  rule: string;
  isHighImpact: boolean;
}

export interface UseEditableCellOptions {
  entityType: string;
  entityId: string;
  fieldName: string;
  fieldLabel?: string;
  initialValue: string | number | null;
  originalValue?: string | number | null;
  type?: 'text' | 'number' | 'decimal' | 'currency' | 'percent';
  min?: number;
  max?: number;
  precision?: number;
  currentValues?: Record<string, number>;
  userRole?: string;
  onSave?: (
    newValue: string | number,
    cascadeEffects: CascadeEffect[]
  ) => Promise<{ success: boolean; error?: string }>;
  onCascadePreview?: (effects: CascadeEffect[]) => void;
}

export interface UseEditableCellReturn {
  // State
  value: EditableCellState;
  isEditing: boolean;
  isLoading: boolean;
  error: string | null;
  hasChanged: boolean;
  hasCascades: boolean;
  cascadeEffects: CascadeEffect[];
  changePercent: number;

  // Actions
  startEditing: () => void;
  cancelEditing: () => void;
  setValue: (newValue: string | number) => void;
  saveValue: () => Promise<boolean>;
  resetToOriginal: () => Promise<boolean>;
  previewCascade: (value: string | number) => CascadeEffect[];

  // Formatters
  displayValue: string;
  inputValue: string;
}

// Field label mapping for Vietnamese display
const FIELD_LABELS: Record<string, string> = {
  unitCost: 'Giá gốc (USD)',
  freightCost: 'Phí vận chuyển',
  taxAmount: 'Thuế',
  importTax: 'Thuế nhập khẩu',
  landedCost: 'Giá nhập (USD)',
  landedCostVND: 'Giá nhập (VND)',
  margin: 'Biên lợi nhuận',
  marginPercent: 'Biên lợi nhuận %',
  srp: 'Giá bán (SRP)',
  totalUnits: 'Tổng số lượng',
  quantity: 'Số lượng',
  discount: 'Chiết khấu',
  netPrice: 'Giá net',
  netTotal: 'Tổng net',
  storeSplit: 'Phân bổ cửa hàng',
  deliveryGrid: 'Grid giao hàng',
  totalPrice: 'Tổng giá trị',
};

/**
 * useEditableCell - Hook for managing editable cell state with cascade support
 *
 * Features:
 * - Edit mode toggle with validation
 * - Cascade calculation preview
 * - Change percentage tracking
 * - Auto-save with loading states
 * - Reset to original value
 */
export function useEditableCell({
  entityType,
  entityId,
  fieldName,
  fieldLabel,
  initialValue,
  originalValue,
  type = 'number',
  min,
  max,
  precision = 2,
  currentValues = {},
  userRole,
  onSave,
  onCascadePreview,
}: UseEditableCellOptions): UseEditableCellReturn {
  // State
  const [current, setCurrent] = useState<string | number | null>(initialValue);
  const [original] = useState<string | number | null>(originalValue ?? initialValue);
  const [pending, setPending] = useState<string | number | null | undefined>(undefined);
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected' | 'auto_approved' | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const hasChanged = current !== original;
  const hasCascades = hasCascadeEffects(fieldName);

  // Calculate change percentage
  const changePercent = useMemo(() => {
    if (original === null || original === 0) return 0;
    const origNum = typeof original === 'number' ? original : parseFloat(String(original));
    const currNum = typeof current === 'number' ? current : parseFloat(String(current));
    if (isNaN(origNum) || isNaN(currNum) || origNum === 0) return 0;
    return ((currNum - origNum) / origNum) * 100;
  }, [current, original]);

  // Preview cascade effects
  const previewCascade = useCallback(
    (value: string | number): CascadeEffect[] => {
      if (!hasCascades) return [];

      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(numValue)) return [];

      const effects = calculateCascade(fieldName, numValue, currentValues);

      return effects.map((effect) => ({
        field: effect.field,
        fieldLabel: FIELD_LABELS[effect.field] || effect.field,
        oldValue: String(effect.oldValue),
        newValue: String(effect.newValue),
        rule: effect.rule,
        isHighImpact: Math.abs((effect.newValue - effect.oldValue) / (effect.oldValue || 1)) > 0.1,
      }));
    },
    [fieldName, hasCascades, currentValues]
  );

  // Current cascade effects
  const cascadeEffects = useMemo(() => {
    if (!hasChanged || current === null) return [];
    return previewCascade(current);
  }, [hasChanged, current, previewCascade]);

  // Start editing
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setEditValue(current !== null ? String(current) : '');
    setError(null);
  }, [current]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
    setError(null);
  }, []);

  // Set value (while editing)
  const setValue = useCallback(
    (newValue: string | number) => {
      const strValue = String(newValue);
      setEditValue(strValue);
      setError(null);

      // Preview cascade on value change
      if (hasCascades && onCascadePreview) {
        const effects = previewCascade(newValue);
        onCascadePreview(effects);
      }
    },
    [hasCascades, onCascadePreview, previewCascade]
  );

  // Save value
  const saveValue = useCallback(async (): Promise<boolean> => {
    // Parse and validate
    let newValue: string | number = editValue;

    if (type !== 'text') {
      const numValue = parseFloat(editValue);
      if (isNaN(numValue)) {
        setError('Giá trị không hợp lệ');
        return false;
      }
      if (min !== undefined && numValue < min) {
        setError(`Giá trị tối thiểu là ${min}`);
        return false;
      }
      if (max !== undefined && numValue > max) {
        setError(`Giá trị tối đa là ${max}`);
        return false;
      }
      newValue = numValue;
    }

    // Skip if unchanged
    if (String(newValue) === String(current)) {
      cancelEditing();
      return true;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate cascade effects
      const effects = previewCascade(newValue);

      // Call onSave callback
      if (onSave) {
        const result = await onSave(newValue, effects);
        if (!result.success) {
          setError(result.error || 'Lưu thất bại');
          return false;
        }
      }

      // Update local state
      setCurrent(newValue);
      setIsEditing(false);
      setEditValue('');

      return true;
    } catch (err: any) {
      setError(err.message || 'Lưu thất bại');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [editValue, type, min, max, current, cancelEditing, previewCascade, onSave]);

  // Reset to original
  const resetToOriginal = useCallback(async (): Promise<boolean> => {
    if (!hasChanged) return true;

    setIsLoading(true);
    try {
      if (onSave && original !== null) {
        const result = await onSave(original, []);
        if (!result.success) {
          setError(result.error || 'Không thể khôi phục');
          return false;
        }
      }
      setCurrent(original);
      setPending(undefined);
      setEditStatus(undefined);
      return true;
    } catch (err: any) {
      setError(err.message || 'Không thể khôi phục');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasChanged, original, onSave]);

  // Format display value
  const displayValue = useMemo(() => {
    const val = pending !== undefined ? pending : current;
    if (val === null || val === undefined) return '-';

    const numVal = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(numVal)) return String(val);

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(numVal);
      case 'percent':
        return `${numVal.toFixed(precision)}%`;
      case 'decimal':
        return numVal.toFixed(precision);
      case 'number':
        return numVal.toLocaleString('vi-VN');
      default:
        return String(val);
    }
  }, [current, pending, type, precision]);

  // Input value for editing
  const inputValue = isEditing ? editValue : String(current ?? '');

  return {
    value: {
      current,
      original,
      pending,
      editStatus,
    },
    isEditing,
    isLoading,
    error,
    hasChanged,
    hasCascades,
    cascadeEffects,
    changePercent,
    startEditing,
    cancelEditing,
    setValue,
    saveValue,
    resetToOriginal,
    previewCascade,
    displayValue,
    inputValue,
  };
}

/**
 * useEditableRow - Hook for managing multiple editable cells in a row
 */
export interface UseEditableRowOptions {
  entityType: string;
  entityId: string;
  initialData: Record<string, string | number | null>;
  originalData?: Record<string, string | number | null>;
  fieldConfigs?: Record<
    string,
    {
      type?: 'text' | 'number' | 'decimal' | 'currency' | 'percent';
      min?: number;
      max?: number;
      precision?: number;
      editable?: boolean;
    }
  >;
  onSave?: (
    fieldName: string,
    newValue: string | number,
    cascadeEffects: CascadeEffect[]
  ) => Promise<{ success: boolean; error?: string }>;
}

export function useEditableRow({
  entityType,
  entityId,
  initialData,
  originalData,
  fieldConfigs = {},
  onSave,
}: UseEditableRowOptions) {
  const [data, setData] = useState(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get cell state for a field
  const getCellState = useCallback(
    (fieldName: string): EditableCellState => ({
      current: data[fieldName] ?? null,
      original: (originalData ?? initialData)[fieldName] ?? null,
    }),
    [data, originalData, initialData]
  );

  // Check if any field has changed
  const hasAnyChanges = useMemo(() => {
    const orig = originalData ?? initialData;
    return Object.keys(data).some((key) => data[key] !== orig[key]);
  }, [data, originalData, initialData]);

  // Get all changed fields
  const changedFields = useMemo(() => {
    const orig = originalData ?? initialData;
    return Object.keys(data).filter((key) => data[key] !== orig[key]);
  }, [data, originalData, initialData]);

  // Start editing a field
  const startEditingField = useCallback((fieldName: string) => {
    setEditingField(fieldName);
    setErrors((prev) => ({ ...prev, [fieldName]: '' }));
  }, []);

  // Save a field
  const saveField = useCallback(
    async (fieldName: string, newValue: string | number): Promise<boolean> => {
      setIsLoading(true);
      try {
        const cascadeEffects = hasCascadeEffects(fieldName)
          ? calculateCascade(
              fieldName,
              typeof newValue === 'number' ? newValue : parseFloat(String(newValue)),
              data as Record<string, number>
            ).map((e) => ({
              field: e.field,
              fieldLabel: FIELD_LABELS[e.field] || e.field,
              oldValue: String(e.oldValue),
              newValue: String(e.newValue),
              rule: e.rule,
              isHighImpact:
                Math.abs((e.newValue - e.oldValue) / (e.oldValue || 1)) > 0.1,
            }))
          : [];

        if (onSave) {
          const result = await onSave(fieldName, newValue, cascadeEffects);
          if (!result.success) {
            setErrors((prev) => ({ ...prev, [fieldName]: result.error || 'Save failed' }));
            return false;
          }
        }

        // Update local data with cascade values
        const updates: Record<string, string | number | null> = {
          [fieldName]: newValue,
        };
        cascadeEffects.forEach((effect) => {
          updates[effect.field] = parseFloat(effect.newValue);
        });

        setData((prev) => ({ ...prev, ...updates }));
        setEditingField(null);
        return true;
      } catch (err: any) {
        setErrors((prev) => ({ ...prev, [fieldName]: err.message }));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [data, onSave]
  );

  // Reset all to original
  const resetAll = useCallback(() => {
    setData(originalData ?? initialData);
    setEditingField(null);
    setErrors({});
  }, [originalData, initialData]);

  return {
    data,
    editingField,
    errors,
    isLoading,
    hasAnyChanges,
    changedFields,
    getCellState,
    startEditingField,
    saveField,
    resetAll,
  };
}
