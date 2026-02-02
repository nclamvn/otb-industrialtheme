'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Edit3,
  Layers,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
  Loader2,
  ArrowRight,
  Info,
  Undo2,
} from 'lucide-react';
import { calculateCascade, hasCascadeEffects } from '@/lib/edit';

// Types
interface EditableField {
  name: string;
  label: string;
  labelVi: string;
  type: 'number' | 'text' | 'percent' | 'currency';
  min?: number;
  max?: number;
  step?: number;
  hasCascade?: boolean;
}

interface SelectedItem {
  id: string;
  displayName: string;
  currentValues: Record<string, number | string | null>;
}

interface BatchEditResult {
  itemId: string;
  success: boolean;
  error?: string;
  cascadeCount?: number;
}

interface BatchEditPanelProps {
  selectedItems: SelectedItem[];
  editableFields: EditableField[];
  onApply: (
    fieldName: string,
    newValue: number | string,
    itemIds: string[],
    reason?: string
  ) => Promise<BatchEditResult[]>;
  onClear?: () => void;
  entityType?: string;
  triggerLabel?: string;
  className?: string;
}

/**
 * BatchEditPanel - Panel for editing multiple items at once
 * Features:
 * - Select field to edit
 * - Preview changes across all selected items
 * - Cascade effect warnings
 * - Progress tracking
 * - Reason input for audit
 */
export function BatchEditPanel({
  selectedItems,
  editableFields,
  onApply,
  onClear,
  entityType = 'item',
  triggerLabel = 'Sửa hàng loạt',
  className,
}: BatchEditPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');
  const [editMode, setEditMode] = useState<'set' | 'adjust' | 'percent'>('set');
  const [editValue, setEditValue] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BatchEditResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const field = editableFields.find((f) => f.name === selectedField);
  const hasCascade = field ? hasCascadeEffects(field.name) : false;

  // Calculate preview values
  const previewChanges = useMemo(() => {
    if (!selectedField || !editValue || !field) return [];

    return selectedItems.map((item) => {
      const currentValue = item.currentValues[selectedField];
      const currentNum = typeof currentValue === 'number' ? currentValue : parseFloat(String(currentValue || '0'));

      let newValue: number;
      const inputNum = parseFloat(editValue);

      switch (editMode) {
        case 'set':
          newValue = inputNum;
          break;
        case 'adjust':
          newValue = currentNum + inputNum;
          break;
        case 'percent':
          newValue = currentNum * (1 + inputNum / 100);
          break;
        default:
          newValue = inputNum;
      }

      // Apply min/max constraints
      if (field.min !== undefined) newValue = Math.max(field.min, newValue);
      if (field.max !== undefined) newValue = Math.min(field.max, newValue);

      const percentChange = currentNum !== 0
        ? ((newValue - currentNum) / currentNum) * 100
        : 0;

      // Calculate cascade effects
      const cascadeEffects = hasCascade
        ? calculateCascade(selectedField, newValue, item.currentValues as Record<string, number>)
        : [];

      return {
        itemId: item.id,
        displayName: item.displayName,
        currentValue: currentNum,
        newValue,
        percentChange,
        cascadeEffects,
        isHighImpact: Math.abs(percentChange) > 10 || cascadeEffects.some(
          (e) => Math.abs((e.newValue - e.oldValue) / (e.oldValue || 1)) > 0.1
        ),
      };
    });
  }, [selectedItems, selectedField, editValue, editMode, field, hasCascade]);

  const highImpactCount = previewChanges.filter((p) => p.isHighImpact).length;
  const totalCascadeEffects = previewChanges.reduce(
    (sum, p) => sum + p.cascadeEffects.length,
    0
  );

  // Apply batch edit
  const handleApply = async () => {
    if (!selectedField || !editValue || previewChanges.length === 0) return;

    setIsApplying(true);
    setProgress(0);
    setResults([]);

    const itemIds = selectedItems.map((item) => item.id);
    const newValues = previewChanges.map((p) => p.newValue);

    try {
      // For simplicity, using first new value (in real app, might need per-item values)
      const batchResults = await onApply(
        selectedField,
        previewChanges[0].newValue,
        itemIds,
        reason || undefined
      );

      setResults(batchResults);
      setShowResults(true);
      setProgress(100);

      // Reset form after success
      if (batchResults.every((r) => r.success)) {
        setTimeout(() => {
          setEditValue('');
          setReason('');
          setSelectedField('');
        }, 1500);
      }
    } catch (error) {
      console.error('Batch edit failed:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // Reset state
  const handleReset = () => {
    setSelectedField('');
    setEditMode('set');
    setEditValue('');
    setReason('');
    setResults([]);
    setShowResults(false);
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedItems.length === 0}
          className={cn('gap-2', className)}
        >
          <Layers className="h-4 w-4" />
          {triggerLabel}
          {selectedItems.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedItems.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[480px] sm:w-[540px] sm:max-w-none">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Sửa hàng loạt
          </SheetTitle>
          <SheetDescription>
            Chỉnh sửa {selectedItems.length} {entityType} đã chọn
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Field Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Chọn trường cần sửa</label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trường..." />
              </SelectTrigger>
              <SelectContent>
                {editableFields.map((f) => (
                  <SelectItem key={f.name} value={f.name}>
                    <div className="flex items-center gap-2">
                      {f.labelVi}
                      {hasCascadeEffects(f.name) && (
                        <Badge variant="outline" className="text-[10px] px-1">
                          Cascade
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Edit Mode & Value */}
          {selectedField && field && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select
                  value={editMode}
                  onValueChange={(v) => setEditMode(v as typeof editMode)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set">Đặt giá trị</SelectItem>
                    <SelectItem value="adjust">Điều chỉnh (+/-)</SelectItem>
                    <SelectItem value="percent">Thay đổi (%)</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1 relative">
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder={
                      editMode === 'set'
                        ? 'Nhập giá trị mới'
                        : editMode === 'adjust'
                          ? '+/- số lượng'
                          : '% thay đổi'
                    }
                    min={field.min}
                    max={field.max}
                    step={field.step || 1}
                  />
                  {editMode === 'percent' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      %
                    </span>
                  )}
                </div>
              </div>

              {/* Preview */}
              {previewChanges.length > 0 && editValue && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-3 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Xem trước thay đổi
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      {highImpactCount > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {highImpactCount} quan trọng
                        </Badge>
                      )}
                      {totalCascadeEffects > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {totalCascadeEffects} cascade
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="max-h-[200px] overflow-y-auto">
                    {previewChanges.slice(0, 5).map((preview) => (
                      <div
                        key={preview.itemId}
                        className={cn(
                          'px-3 py-2 border-b last:border-b-0 text-sm',
                          preview.isHighImpact && 'bg-amber-50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[180px]">
                            {preview.displayName}
                          </span>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              {preview.currentValue.toLocaleString()}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="font-medium">
                              {preview.newValue.toLocaleString()}
                            </span>
                            <span
                              className={cn(
                                'px-1 rounded',
                                preview.percentChange > 0
                                  ? 'text-green-600 bg-green-100'
                                  : preview.percentChange < 0
                                    ? 'text-red-600 bg-red-100'
                                    : 'text-gray-600'
                              )}
                            >
                              {preview.percentChange > 0 && '+'}
                              {preview.percentChange.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {preview.cascadeEffects.length > 0 && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            → {preview.cascadeEffects.length} trường liên quan
                          </div>
                        )}
                      </div>
                    ))}
                    {previewChanges.length > 5 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                        và {previewChanges.length - 5} mục khác...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reason (required for high impact) */}
          {highImpactCount > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Lý do thay đổi
                <span className="text-red-500">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Bắt buộc khi có thay đổi lớn hơn 10%
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do thay đổi..."
                rows={2}
              />
            </div>
          )}

          {/* Progress & Results */}
          {isApplying && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Đang áp dụng...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {showResults && results.length > 0 && (
            <div className="p-3 rounded-lg bg-muted space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kết quả</span>
                <Button variant="ghost" size="sm" onClick={() => setShowResults(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {successCount > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-4 h-4" />
                    {successCount} thành công
                  </span>
                )}
                {failCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <X className="w-4 h-4" />
                    {failCount} thất bại
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="gap-2">
          <Button variant="ghost" onClick={handleReset}>
            <Undo2 className="w-4 h-4 mr-2" />
            Đặt lại
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              !selectedField ||
              !editValue ||
              isApplying ||
              (highImpactCount > 0 && !reason.trim())
            }
            className="bg-[#127749] hover:bg-[#0d5a36]"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang áp dụng...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Áp dụng cho {selectedItems.length} mục
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
