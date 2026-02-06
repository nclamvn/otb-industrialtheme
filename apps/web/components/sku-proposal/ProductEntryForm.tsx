'use client';

import { useState, useMemo } from 'react';
import {
  Package,
  Palette,
  Tag,
  DollarSign,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Layers,
  Bookmark,
  Shirt,
} from 'lucide-react';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SizeMatrixEditor } from './SizeMatrixEditor';
import {
  ProductEntry,
  GeneratedSKU,
  PRODUCT_CATEGORIES,
  SIZE_TEMPLATES,
} from './types';

interface ProductEntryFormProps {
  product: ProductEntry;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (product: ProductEntry) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  disabled?: boolean;
}

export function ProductEntryForm({
  product,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
  disabled = false,
}: ProductEntryFormProps) {
  // Calculate totals
  const totalQuantity = useMemo(() => {
    return Object.values(product.sizeQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [product.sizeQuantities]);

  const totalValue = useMemo(() => {
    return totalQuantity * product.retailPrice;
  }, [totalQuantity, product.retailPrice]);

  // Handle field updates
  const updateField = <K extends keyof ProductEntry>(
    field: K,
    value: ProductEntry[K]
  ) => {
    onUpdate({ ...product, [field]: value });
  };

  // Handle category change - auto-select size template
  const handleCategoryChange = (categoryId: string) => {
    const category = PRODUCT_CATEGORIES.find((c) => c.id === categoryId);
    if (category) {
      onUpdate({
        ...product,
        categoryId,
        categoryName: category.name,
        sizeTemplateId: category.sizeTemplate,
        selectedSizes: [],
        sizeQuantities: {},
      });
    }
  };

  // Get current template
  const currentTemplate = useMemo(() => {
    return SIZE_TEMPLATES.find((t) => t.id === product.sizeTemplateId);
  }, [product.sizeTemplateId]);

  // Validation status
  const isValid = useMemo(() => {
    return (
      product.styleCode.trim() !== '' &&
      product.styleName.trim() !== '' &&
      product.categoryId !== '' &&
      product.retailPrice > 0 &&
      product.selectedSizes.length > 0 &&
      totalQuantity > 0
    );
  }, [product, totalQuantity]);

  return (
    <Card
      className={cn(
        'transition-all',
        isExpanded && 'ring-2 ring-amber-500',
        !isValid && totalQuantity > 0 && 'border-amber-300'
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        {/* Header - Always Visible */}
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-amber-600" />
                </div>

                <div className="text-left">
                  <CardTitle className="text-base flex items-center gap-2">
                    {product.styleCode || `Product ${index + 1}`}
                    {isValid && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {product.styleName || 'Enter product details'}
                    {product.categoryName && ` • ${product.categoryName}`}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Summary badges */}
                {totalQuantity > 0 && (
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {product.selectedSizes.length} sizes
                    </Badge>
                    <Badge variant="secondary">
                      {totalQuantity} units
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      ${totalValue.toLocaleString()}
                    </Badge>
                  </div>
                )}

                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Product Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Style Code */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Style Code *
                </Label>
                <Input
                  value={product.styleCode}
                  onChange={(e) => updateField('styleCode', e.target.value)}
                  placeholder="e.g., HB-SS26-001"
                  disabled={disabled}
                />
              </div>

              {/* Style Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Style Name *
                </Label>
                <Input
                  value={product.styleName}
                  onChange={(e) => updateField('styleName', e.target.value)}
                  placeholder="e.g., Classic Wool Blazer"
                  disabled={disabled}
                />
              </div>

              {/* Color Code */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color Code
                </Label>
                <Input
                  value={product.colorCode}
                  onChange={(e) => updateField('colorCode', e.target.value)}
                  placeholder="e.g., 001"
                  disabled={disabled}
                />
              </div>

              {/* Color Name */}
              <div className="space-y-2">
                <Label>Color Name</Label>
                <Input
                  value={product.colorName}
                  onChange={(e) => updateField('colorName', e.target.value)}
                  placeholder="e.g., Navy Blue"
                  disabled={disabled}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={product.categoryId}
                  onValueChange={handleCategoryChange}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select
                  value={product.gender}
                  onValueChange={(v) =>
                    updateField('gender', v as 'MALE' | 'FEMALE' | 'UNISEX')
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="UNISEX">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Retail Price */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Retail Price *
                </Label>
                <Input
                  type="number"
                  value={product.retailPrice || ''}
                  onChange={(e) =>
                    updateField('retailPrice', Number(e.target.value))
                  }
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  disabled={disabled}
                />
              </div>

              {/* Cost Price */}
              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  value={product.costPrice || ''}
                  onChange={(e) =>
                    updateField('costPrice', Number(e.target.value))
                  }
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Additional Product Attributes - SQL Schema Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dashed">
              {/* Rail */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Rail
                </Label>
                <Input
                  value={product.rail || ''}
                  onChange={(e) => updateField('rail', e.target.value)}
                  placeholder="e.g., RAIL #1+2: BOUTQUET"
                  disabled={disabled}
                />
              </div>

              {/* Product Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shirt className="w-4 h-4" />
                  Product Type
                </Label>
                <Input
                  value={product.productType || ''}
                  onChange={(e) => updateField('productType', e.target.value)}
                  placeholder="e.g., Casual, Formal"
                  disabled={disabled}
                />
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Theme
                </Label>
                <Input
                  value={product.theme || ''}
                  onChange={(e) => updateField('theme', e.target.value)}
                  placeholder="e.g., AUGUST (08), WINE RED"
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Size Template Selector */}
            {product.categoryId && (
              <div className="space-y-2">
                <Label>Size Template</Label>
                <Select
                  value={product.sizeTemplateId}
                  onValueChange={(v) => {
                    onUpdate({
                      ...product,
                      sizeTemplateId: v,
                      selectedSizes: [],
                      sizeQuantities: {},
                    });
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Size Matrix Editor */}
            {product.categoryId && product.sizeTemplateId && (
              <SizeMatrixEditor
                templateId={product.sizeTemplateId}
                selectedSizes={product.selectedSizes}
                sizeQuantities={product.sizeQuantities}
                totalQuantity={product.totalQuantity}
                retailPrice={product.retailPrice}
                onSizesChange={(sizes) => updateField('selectedSizes', sizes)}
                onQuantitiesChange={(quantities) =>
                  updateField('sizeQuantities', quantities)
                }
                onTotalQuantityChange={(total) =>
                  updateField('totalQuantity', total)
                }
                disabled={disabled}
              />
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDuplicate}
                  disabled={disabled}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>

              <div className="text-sm text-slate-500">
                {isValid ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Ready to generate
                  </span>
                ) : (
                  <span>Fill required fields (*) and select sizes</span>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default ProductEntryForm;
