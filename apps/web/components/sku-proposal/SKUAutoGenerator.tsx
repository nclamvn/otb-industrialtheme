'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Package,
  Plus,
  Sparkles,
  FileDown,
  Trash2,
  Check,
  AlertCircle,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProductEntryForm } from './ProductEntryForm';
import {
  ProductEntry,
  GeneratedSKU,
  SIZE_TEMPLATES,
  PRODUCT_CATEGORIES,
} from './types';

interface SKUAutoGeneratorProps {
  proposalId: string;
  budgetInfo?: {
    allocated: number;
    remaining: number;
    categoryBudgets?: Record<string, number>;
  };
  onSKUsGenerated?: (skus: GeneratedSKU[]) => void;
  disabled?: boolean;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create empty product
const createEmptyProduct = (): ProductEntry => ({
  id: generateId(),
  styleCode: '',
  styleName: '',
  colorCode: '',
  colorName: '',
  categoryId: '',
  categoryName: '',
  gender: 'UNISEX',
  retailPrice: 0,
  costPrice: 0,
  sizeTemplateId: 'clothing-alpha',
  selectedSizes: [],
  sizeQuantities: {},
  totalQuantity: 0,
  totalValue: 0,
});

export function SKUAutoGenerator({
  proposalId,
  budgetInfo,
  onSKUsGenerated,
  disabled = false,
}: SKUAutoGeneratorProps) {
  const [products, setProducts] = useState<ProductEntry[]>([createEmptyProduct()]);
  const [expandedId, setExpandedId] = useState<string | null>(products[0]?.id);
  const [generatedSKUs, setGeneratedSKUs] = useState<GeneratedSKU[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'entry' | 'preview'>('entry');

  // Calculate totals
  const totals = useMemo(() => {
    let totalProducts = 0;
    let totalSizes = 0;
    let totalQuantity = 0;
    let totalValue = 0;
    let validProducts = 0;

    products.forEach((product) => {
      totalProducts++;
      const qty = Object.values(product.sizeQuantities).reduce(
        (sum, q) => sum + q,
        0
      );
      if (qty > 0) {
        totalSizes += product.selectedSizes.length;
        totalQuantity += qty;
        totalValue += qty * product.retailPrice;
        if (
          product.styleCode &&
          product.styleName &&
          product.categoryId &&
          product.retailPrice > 0
        ) {
          validProducts++;
        }
      }
    });

    return { totalProducts, totalSizes, totalQuantity, totalValue, validProducts };
  }, [products]);

  // Budget comparison
  const budgetStatus = useMemo(() => {
    if (!budgetInfo) return null;

    const usagePercent = (totals.totalValue / budgetInfo.remaining) * 100;
    const status =
      usagePercent > 100
        ? 'exceeded'
        : usagePercent > 80
        ? 'warning'
        : 'ok';

    return {
      usagePercent,
      status,
      remaining: budgetInfo.remaining - totals.totalValue,
    };
  }, [totals, budgetInfo]);

  // Add new product
  const addProduct = () => {
    const newProduct = createEmptyProduct();
    setProducts([...products, newProduct]);
    setExpandedId(newProduct.id);
  };

  // Update product
  const updateProduct = (id: string, updated: ProductEntry) => {
    setProducts(products.map((p) => (p.id === id ? updated : p)));
  };

  // Delete product
  const deleteProduct = (id: string) => {
    if (products.length === 1) {
      toast.error('At least one product is required');
      return;
    }
    setProducts(products.filter((p) => p.id !== id));
    if (expandedId === id) {
      setExpandedId(products.find((p) => p.id !== id)?.id || null);
    }
  };

  // Duplicate product
  const duplicateProduct = (product: ProductEntry) => {
    const duplicate: ProductEntry = {
      ...product,
      id: generateId(),
      styleCode: `${product.styleCode}-COPY`,
    };
    const index = products.findIndex((p) => p.id === product.id);
    const newProducts = [...products];
    newProducts.splice(index + 1, 0, duplicate);
    setProducts(newProducts);
    setExpandedId(duplicate.id);
  };

  // Generate SKUs from products
  const generateSKUs = useCallback(() => {
    const skus: GeneratedSKU[] = [];

    products.forEach((product) => {
      const qty = Object.values(product.sizeQuantities).reduce(
        (sum, q) => sum + q,
        0
      );

      if (qty === 0) return;

      // Get sizes in template order
      const template = SIZE_TEMPLATES.find((t) => t.id === product.sizeTemplateId);
      const orderedSizes = template
        ? template.sizes.filter((s) => product.selectedSizes.includes(s))
        : product.selectedSizes;

      orderedSizes.forEach((size) => {
        const sizeQty = product.sizeQuantities[size] || 0;
        if (sizeQty === 0) return;

        skus.push({
          id: generateId(),
          productId: product.id,
          styleCode: product.styleCode,
          styleName: product.styleName,
          colorCode: product.colorCode,
          colorName: product.colorName,
          size,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          gender: product.gender,
          retailPrice: product.retailPrice,
          costPrice: product.costPrice,
          quantity: sizeQty,
          value: sizeQty * product.retailPrice,
        });
      });
    });

    return skus;
  }, [products]);

  // Handle generate action
  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const skus = generateSKUs();

      if (skus.length === 0) {
        toast.error('No valid products to generate');
        setIsGenerating(false);
        return;
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setGeneratedSKUs(skus);
      setViewMode('preview');
      toast.success(`Generated ${skus.length} SKU items`);

      if (onSKUsGenerated) {
        onSKUsGenerated(skus);
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate SKUs');
    } finally {
      setIsGenerating(false);
    }
  };

  // Confirm and save to proposal
  const handleConfirmAndSave = async () => {
    try {
      // TODO: API call to save SKUs
      toast.success('SKUs saved to proposal');
      setShowConfirmDialog(false);
    } catch (error) {
      toast.error('Failed to save SKUs');
    }
  };

  // Clear all
  const handleClearAll = () => {
    setProducts([createEmptyProduct()]);
    setGeneratedSKUs([]);
    setViewMode('entry');
    setExpandedId(products[0]?.id);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Products</div>
            <div className="text-2xl font-bold">{totals.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Size Variants</div>
            <div className="text-2xl font-bold">{totals.totalSizes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Units</div>
            <div className="text-2xl font-bold">
              {totals.totalQuantity.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Value</div>
            <div className="text-2xl font-bold text-green-600">
              ${totals.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            budgetStatus?.status === 'exceeded' && 'border-red-300 bg-red-50',
            budgetStatus?.status === 'warning' && 'border-amber-300 bg-amber-50'
          )}
        >
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Budget Status</div>
            <div
              className={cn(
                'text-2xl font-bold',
                budgetStatus?.status === 'exceeded' && 'text-red-600',
                budgetStatus?.status === 'warning' && 'text-amber-600',
                budgetStatus?.status === 'ok' && 'text-green-600'
              )}
            >
              {budgetStatus
                ? `${budgetStatus.usagePercent.toFixed(1)}%`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'entry' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('entry')}
          >
            <Package className="w-4 h-4 mr-2" />
            Product Entry
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('preview')}
            disabled={generatedSKUs.length === 0}
          >
            <Layers className="w-4 h-4 mr-2" />
            Preview ({generatedSKUs.length})
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={disabled || isGenerating || totals.validProducts === 0}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate SKUs'}
          </Button>
        </div>
      </div>

      {/* Entry Mode */}
      {viewMode === 'entry' && (
        <div className="space-y-4">
          {products.map((product, index) => (
            <ProductEntryForm
              key={product.id}
              product={product}
              index={index}
              isExpanded={expandedId === product.id}
              onToggle={() =>
                setExpandedId(expandedId === product.id ? null : product.id)
              }
              onUpdate={(updated) => updateProduct(product.id, updated)}
              onDelete={() => deleteProduct(product.id)}
              onDuplicate={() => duplicateProduct(product)}
              disabled={disabled}
            />
          ))}

          <Button
            variant="outline"
            onClick={addProduct}
            disabled={disabled}
            className="w-full py-6 border-dashed hover:border-amber-500 hover:text-amber-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Another Product
          </Button>
        </div>
      )}

      {/* Preview Mode */}
      {viewMode === 'preview' && generatedSKUs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated SKU Items</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileDown className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowConfirmDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm & Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Style Code</TableHead>
                    <TableHead>Style Name</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead className="text-right">Retail</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedSKUs.map((sku, index) => (
                    <TableRow key={sku.id}>
                      <TableCell className="font-medium">
                        {sku.styleCode}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {sku.styleName}
                      </TableCell>
                      <TableCell>
                        {sku.colorName || sku.colorCode || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sku.size}</Badge>
                      </TableCell>
                      <TableCell>{sku.categoryName}</TableCell>
                      <TableCell>{sku.gender}</TableCell>
                      <TableCell className="text-right">
                        ${sku.retailPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">{sku.quantity}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ${sku.value.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary Footer */}
            <div className="mt-4 p-4 bg-slate-50 rounded-lg flex items-center justify-between">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-slate-500">Total SKUs:</span>{' '}
                  <span className="font-medium">{generatedSKUs.length}</span>
                </div>
                <div>
                  <span className="text-slate-500">Total Units:</span>{' '}
                  <span className="font-medium">
                    {generatedSKUs
                      .reduce((sum, sku) => sum + sku.quantity, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Total Value:</span>{' '}
                  <span className="font-medium text-green-600">
                    $
                    {generatedSKUs
                      .reduce((sum, sku) => sum + sku.value, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('entry')}
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back to Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm SKU Generation</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to add {generatedSKUs.length} SKU items to this
              proposal. This will create:
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>{totals.totalProducts} products</li>
                <li>{totals.totalSizes} size variants</li>
                <li>
                  {totals.totalQuantity.toLocaleString()} total units
                </li>
                <li>
                  ${totals.totalValue.toLocaleString()} total value
                </li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAndSave}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SKUAutoGenerator;
