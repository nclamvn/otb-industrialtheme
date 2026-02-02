'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ProposalProduct,
  SizeAllocation,
  SIZE_TEMPLATES,
  PRODUCT_CATEGORIES,
  formatCurrency,
} from './types';
import { useAutoGenerate } from './hooks/useAutoGenerate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Sparkles, Package } from 'lucide-react';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryName: string;
  budgetRemaining: number;
  onAddProduct: (product: Omit<ProposalProduct, 'id'>) => void;
}

type Gender = 'MALE' | 'FEMALE' | 'UNISEX';

export function AddProductDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  budgetRemaining,
  onAddProduct,
}: AddProductDialogProps) {
  // Form state
  const [styleCode, setStyleCode] = useState('');
  const [styleName, setStyleName] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [colorName, setColorName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [unitPrice, setUnitPrice] = useState('');
  const [sizeTemplateId, setSizeTemplateId] = useState('');
  const [totalQty, setTotalQty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { initializeProduct } = useAutoGenerate();

  // Get selected size template
  const selectedTemplate = useMemo(
    () => SIZE_TEMPLATES.find((t) => t.id === sizeTemplateId),
    [sizeTemplateId]
  );

  // Calculate estimated value
  const estimatedValue = useMemo(() => {
    const qty = parseInt(totalQty) || 0;
    const price = parseFloat(unitPrice) || 0;
    return qty * price;
  }, [totalQty, unitPrice]);

  // Validate form
  const isValid = useMemo(() => {
    return (
      styleCode.trim() !== '' &&
      styleName.trim() !== '' &&
      unitPrice !== '' &&
      parseFloat(unitPrice) > 0 &&
      sizeTemplateId !== '' &&
      totalQty !== '' &&
      parseInt(totalQty) > 0
    );
  }, [styleCode, styleName, unitPrice, sizeTemplateId, totalQty]);

  // Reset form
  const resetForm = useCallback(() => {
    setStyleCode('');
    setStyleName('');
    setColorCode('');
    setColorName('');
    setGender('MALE');
    setUnitPrice('');
    setSizeTemplateId('');
    setTotalQty('');
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const price = parseFloat(unitPrice);
      const qty = parseInt(totalQty);

      // Initialize size allocations
      const sizes = initializeProduct(sizeTemplateId, qty, price);

      const newProduct: Omit<ProposalProduct, 'id'> = {
        categoryId,
        styleCode: styleCode.toUpperCase(),
        styleName,
        colorCode: colorCode.toUpperCase() || undefined,
        colorName: colorName || undefined,
        gender,
        unitPrice: price,
        sizeTemplateId,
        totalQty: qty,
        totalValue: qty * price,
        sizes,
        hasChanges: true,
      };

      onAddProduct(newProduct);
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isValid,
    categoryId,
    styleCode,
    styleName,
    colorCode,
    colorName,
    gender,
    unitPrice,
    sizeTemplateId,
    totalQty,
    initializeProduct,
    onAddProduct,
    resetForm,
    onOpenChange,
  ]);

  // Handle close
  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Add New Product
          </DialogTitle>
          <DialogDescription>
            Add a product to <span className="font-medium">{categoryName}</span>.
            Budget remaining: <span className={cn(
              'font-medium',
              budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(budgetRemaining)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Style Code & Name */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="styleCode">Style Code *</Label>
              <Input
                id="styleCode"
                placeholder="A2501"
                value={styleCode}
                onChange={(e) => setStyleCode(e.target.value)}
                className="uppercase"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="styleName">Product Name *</Label>
              <Input
                id="styleName"
                placeholder="Wool Coat"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
              />
            </div>
          </div>

          {/* Color */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="colorCode">Color Code</Label>
              <Input
                id="colorCode"
                placeholder="BLK"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                className="uppercase"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="colorName">Color Name</Label>
              <Input
                id="colorName"
                placeholder="Black"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
              />
            </div>
          </div>

          {/* Gender & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Men</SelectItem>
                  <SelectItem value="FEMALE">Women</SelectItem>
                  <SelectItem value="UNISEX">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price ($) *</Label>
              <Input
                id="unitPrice"
                type="number"
                placeholder="350"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <Separator />

          {/* Size Template */}
          <div className="space-y-2">
            <Label>Size Template *</Label>
            <Select value={sizeTemplateId} onValueChange={setSizeTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select size template" />
              </SelectTrigger>
              <SelectContent>
                {SIZE_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{template.name}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        ({template.sizes.length} sizes)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTemplate && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTemplate.sizes.map((size) => (
                  <Badge key={size} variant="secondary" className="text-xs">
                    {size}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Total Quantity */}
          <div className="space-y-2">
            <Label htmlFor="totalQty">Total Quantity *</Label>
            <Input
              id="totalQty"
              type="number"
              placeholder="200"
              value={totalQty}
              onChange={(e) => setTotalQty(e.target.value)}
              min={0}
              step={1}
            />
            <p className="text-xs text-slate-500">
              Quantities will be auto-distributed across sizes using bell curve distribution
            </p>
          </div>

          {/* Estimated Value */}
          {estimatedValue > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Estimated Value</span>
                <span
                  className={cn(
                    'text-lg font-semibold',
                    estimatedValue > budgetRemaining
                      ? 'text-red-600'
                      : 'text-slate-800'
                  )}
                >
                  {formatCurrency(estimatedValue)}
                </span>
              </div>
              {estimatedValue > budgetRemaining && (
                <p className="text-xs text-red-500 mt-1">
                  This exceeds the remaining budget by {formatCurrency(estimatedValue - budgetRemaining)}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Add & Auto-Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddProductDialog;
