'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, Minus, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  SIZE_TEMPLATES,
  SIZE_DISTRIBUTIONS,
  calculateDistribution,
  SizeConfig,
  SizeDistribution,
} from './types';

interface SizeMatrixEditorProps {
  templateId: string;
  selectedSizes: string[];
  sizeQuantities: Record<string, number>;
  totalQuantity: number;
  retailPrice: number;
  onSizesChange: (sizes: string[]) => void;
  onQuantitiesChange: (quantities: Record<string, number>) => void;
  onTotalQuantityChange: (total: number) => void;
  disabled?: boolean;
}

export function SizeMatrixEditor({
  templateId,
  selectedSizes,
  sizeQuantities,
  totalQuantity,
  retailPrice,
  onSizesChange,
  onQuantitiesChange,
  onTotalQuantityChange,
  disabled = false,
}: SizeMatrixEditorProps) {
  const [distributionId, setDistributionId] = useState<string>('bell-curve');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get template
  const template = useMemo(() => {
    return SIZE_TEMPLATES.find((t) => t.id === templateId) || SIZE_TEMPLATES[0];
  }, [templateId]);

  // Calculate totals
  const calculatedTotal = useMemo(() => {
    return Object.values(sizeQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [sizeQuantities]);

  const totalValue = useMemo(() => {
    return calculatedTotal * retailPrice;
  }, [calculatedTotal, retailPrice]);

  // Toggle size selection
  const toggleSize = (size: string) => {
    if (disabled) return;

    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];

    onSizesChange(newSizes);

    // Update quantities - remove deselected, add selected with 0
    const newQuantities = { ...sizeQuantities };
    if (!newSizes.includes(size)) {
      delete newQuantities[size];
    } else if (!newQuantities[size]) {
      newQuantities[size] = 0;
    }
    onQuantitiesChange(newQuantities);
  };

  // Update individual size quantity
  const updateSizeQuantity = (size: string, qty: number) => {
    if (disabled) return;

    const newQuantities = {
      ...sizeQuantities,
      [size]: Math.max(0, qty),
    };
    onQuantitiesChange(newQuantities);
  };

  // Apply distribution
  const applyDistribution = () => {
    if (selectedSizes.length === 0 || totalQuantity === 0) return;

    const distribution = SIZE_DISTRIBUTIONS.find((d) => d.id === distributionId);
    if (!distribution) return;

    // Sort selected sizes in template order
    const sortedSizes = template.sizes.filter((s) => selectedSizes.includes(s));
    const newQuantities = calculateDistribution(
      sortedSizes,
      totalQuantity,
      distribution.distribution
    );

    onQuantitiesChange(newQuantities);
  };

  // Select all sizes
  const selectAllSizes = () => {
    if (disabled) return;
    onSizesChange([...template.sizes]);
    const newQuantities: Record<string, number> = {};
    template.sizes.forEach((size) => {
      newQuantities[size] = sizeQuantities[size] || 0;
    });
    onQuantitiesChange(newQuantities);
  };

  // Clear all sizes
  const clearAllSizes = () => {
    if (disabled) return;
    onSizesChange([]);
    onQuantitiesChange({});
  };

  // Quick increment/decrement
  const quickAdjust = (size: string, delta: number) => {
    const current = sizeQuantities[size] || 0;
    updateSizeQuantity(size, current + delta);
  };

  return (
    <div className="space-y-4">
      {/* Header with Distribution Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Size Matrix</Label>
          <span className="text-xs text-muted-foreground">
            ({template.name})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAllSizes}
            disabled={disabled}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllSizes}
            disabled={disabled}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Size Selection Grid */}
      <div className="flex flex-wrap gap-2">
        {template.sizes.map((size) => {
          const isSelected = selectedSizes.includes(size);
          const qty = sizeQuantities[size] || 0;

          return (
            <TooltipProvider key={size}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggleSize(size)}
                    disabled={disabled}
                    className={cn(
                      'relative px-3 py-2 rounded-lg border text-sm font-medium transition-all min-w-[48px]',
                      isSelected
                        ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {size}
                    {isSelected && qty > 0 && (
                      <span className="absolute -top-2 -right-2 bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {qty}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isSelected ? `Selected: ${qty} units` : 'Click to select'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Distribution Controls */}
      {selectedSizes.length > 0 && (
        <div className="p-4 bg-slate-50 rounded-xl space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label className="text-sm">Total Quantity</Label>
              <Input
                type="number"
                value={totalQuantity}
                onChange={(e) => onTotalQuantityChange(Number(e.target.value))}
                min={0}
                disabled={disabled}
                className="mt-1"
              />
            </div>

            <div className="flex-1">
              <Label className="text-sm">Distribution</Label>
              <Select
                value={distributionId}
                onValueChange={setDistributionId}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_DISTRIBUTIONS.map((dist) => (
                    <SelectItem key={dist.id} value={dist.id}>
                      {dist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              onClick={applyDistribution}
              disabled={disabled || totalQuantity === 0}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-Distribute
            </Button>
          </div>

          {/* Individual Size Quantities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {template.sizes
              .filter((size) => selectedSizes.includes(size))
              .map((size) => (
                <div
                  key={size}
                  className="bg-white rounded-lg border border-slate-200 p-2"
                >
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    {size}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => quickAdjust(size, -1)}
                      disabled={disabled || (sizeQuantities[size] || 0) <= 0}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center disabled:opacity-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <Input
                      type="number"
                      value={sizeQuantities[size] || 0}
                      onChange={(e) =>
                        updateSizeQuantity(size, Number(e.target.value))
                      }
                      min={0}
                      disabled={disabled}
                      className="h-7 text-center text-sm px-1"
                    />
                    <button
                      type="button"
                      onClick={() => quickAdjust(size, 1)}
                      disabled={disabled}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-500">Sizes:</span>{' '}
                <span className="font-medium">{selectedSizes.length}</span>
              </div>
              <div>
                <span className="text-slate-500">Total Qty:</span>{' '}
                <span className="font-medium">{calculatedTotal}</span>
                {calculatedTotal !== totalQuantity && totalQuantity > 0 && (
                  <span className="text-amber-600 ml-1">
                    (target: {totalQuantity})
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500">Value:</span>{' '}
                <span className="font-medium text-green-600">
                  ${totalValue.toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={applyDistribution}
              disabled={disabled}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset Distribution
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedSizes.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-sm">
          Click sizes above to select them for this product
        </div>
      )}
    </div>
  );
}

export default SizeMatrixEditor;
