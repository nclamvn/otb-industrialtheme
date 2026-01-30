'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ProposalCategory,
  ProposalProduct,
  formatCurrency,
} from './types';
import { EnhancedSKUCard } from './EnhancedSKUCard';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Package,
  Pencil,
  Trash2,
  Copy,
  MoreHorizontal,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ViewMode = 'table' | 'cards';

interface ProductListProps {
  category: ProposalCategory | null;
  expandedProductId: string | null;
  onExpandProduct: (productId: string | null) => void;
  onAddProduct: () => void;
  onEditProduct: (product: ProposalProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onDuplicateProduct: (product: ProposalProduct) => void;
  renderSizeBreakdown?: (product: ProposalProduct) => React.ReactNode;
  className?: string;
  defaultViewMode?: ViewMode;
}

interface ProductRowProps {
  product: ProposalProduct;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  renderSizeBreakdown?: (product: ProposalProduct) => React.ReactNode;
}

function ProductRow({
  product,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onDuplicate,
  renderSizeBreakdown,
}: ProductRowProps) {
  return (
    <>
      <TableRow
        className={cn(
          'cursor-pointer transition-colors',
          isExpanded && 'bg-slate-50 dark:bg-neutral-800/50',
          product.hasChanges && 'bg-amber-50/50 dark:bg-amber-950/30'
        )}
        onClick={onToggleExpand}
      >
        {/* Expand Toggle */}
        <TableCell className="w-10">
          <div className="flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
            )}
          </div>
        </TableCell>

        {/* Style Code */}
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <span className="text-slate-800 dark:text-neutral-200">{product.styleCode}</span>
            {product.hasChanges && (
              <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                Modified
              </Badge>
            )}
          </div>
        </TableCell>

        {/* Style Name */}
        <TableCell>
          <div>
            <span className="text-slate-700 dark:text-neutral-300">{product.styleName}</span>
            {product.colorName && (
              <span className="text-slate-400 dark:text-neutral-500 text-sm ml-2">
                ({product.colorCode} - {product.colorName})
              </span>
            )}
          </div>
        </TableCell>

        {/* Unit Price */}
        <TableCell className="text-right tabular-nums text-slate-700 dark:text-neutral-300">
          {formatCurrency(product.unitPrice)}
        </TableCell>

        {/* Total Qty */}
        <TableCell className="text-right tabular-nums font-medium text-slate-700 dark:text-neutral-300">
          {product.totalQty.toLocaleString()}
        </TableCell>

        {/* Total Value */}
        <TableCell className="text-right tabular-nums font-semibold text-slate-800 dark:text-neutral-100">
          {formatCurrency(product.totalValue)}
        </TableCell>

        {/* Actions */}
        <TableCell className="w-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Size Breakdown (Expanded) */}
      {isExpanded && renderSizeBreakdown && (
        <TableRow>
          <TableCell colSpan={7} className="p-0 bg-slate-50/50 dark:bg-neutral-800/30">
            <div className="p-4 border-t border-b border-slate-100 dark:border-neutral-700">
              {renderSizeBreakdown(product)}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function ProductList({
  category,
  expandedProductId,
  onExpandProduct,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onDuplicateProduct,
  renderSizeBreakdown,
  className,
  defaultViewMode = 'cards',
}: ProductListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  if (!category) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-64', className)}>
        <Package className="w-16 h-16 text-slate-200 dark:text-neutral-700 mb-4" />
        <p className="text-slate-500 dark:text-neutral-400 text-lg">Select a category to view products</p>
      </div>
    );
  }

  // Render cards view with EnhancedSKUCard
  const renderCardsView = () => (
    <div className="space-y-2">
      {category.products.map((product) => {
        const isExpanded = expandedProductId === product.id;
        const budgetPercent = category.budgetAllocated > 0
          ? (product.totalValue / category.budgetAllocated) * 100
          : 0;

        return (
          <div key={product.id}>
            <EnhancedSKUCard
              product={product}
              budgetPercent={budgetPercent}
              onClick={() => onExpandProduct(isExpanded ? null : product.id)}
              isExpanded={isExpanded}
              hasChildren={true}
            />
            {/* Expanded content - Size breakdown */}
            {isExpanded && renderSizeBreakdown && (
              <div className="ml-4 mb-2 p-4 border border-slate-200 dark:border-neutral-700 rounded-lg bg-slate-50/50 dark:bg-neutral-900/50">
                {renderSizeBreakdown(product)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render table view
  const renderTableView = () => (
    <div className="border border-slate-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-neutral-800">
            <TableHead className="w-10"></TableHead>
            <TableHead className="text-slate-700 dark:text-neutral-300">Style Code</TableHead>
            <TableHead className="text-slate-700 dark:text-neutral-300">Product Name</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-neutral-300">Unit Price</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-neutral-300">Total Qty</TableHead>
            <TableHead className="text-right text-slate-700 dark:text-neutral-300">Total Value</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {category.products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isExpanded={expandedProductId === product.id}
              onToggleExpand={() =>
                onExpandProduct(
                  expandedProductId === product.id ? null : product.id
                )
              }
              onEdit={() => onEditProduct(product)}
              onDelete={() => onDeleteProduct(product.id)}
              onDuplicate={() => onDuplicateProduct(product)}
              renderSizeBreakdown={renderSizeBreakdown}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-neutral-100">{category.name}</h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            {category.productCount} products | Budget: {formatCurrency(category.budgetUsed)} / {formatCurrency(category.budgetAllocated)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'cards'
                  ? 'bg-slate-100 dark:bg-neutral-700 text-slate-800 dark:text-neutral-100'
                  : 'text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300'
              )}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'table'
                  ? 'bg-slate-100 dark:bg-neutral-700 text-slate-800 dark:text-neutral-100'
                  : 'text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300'
              )}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={onAddProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Products List */}
      {category.products.length > 0 ? (
        viewMode === 'cards' ? renderCardsView() : renderTableView()
      ) : (
        <div className="border border-slate-200 dark:border-neutral-700 rounded-lg p-12 text-center bg-slate-50/50 dark:bg-neutral-900/50">
          <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-neutral-600 mb-4" />
          <h4 className="font-medium text-slate-700 dark:text-neutral-300 mb-2">No products yet</h4>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4">
            Add products to this category to start building your SKU proposal
          </p>
          <Button onClick={onAddProduct} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add First Product
          </Button>
        </div>
      )}

      {/* Summary Footer */}
      {category.products.length > 0 && (
        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-neutral-800 rounded-lg">
          <div className="text-sm text-slate-600 dark:text-neutral-300">
            <span className="font-medium">{category.products.length}</span> products |{' '}
            <span className="font-medium">
              {category.products.reduce((sum, p) => sum + p.totalQty, 0).toLocaleString()}
            </span>{' '}
            total units
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-500 dark:text-neutral-400">Budget Remaining:</span>
              <span
                className={cn(
                  'ml-2 font-semibold tabular-nums',
                  category.budgetRemaining >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatCurrency(category.budgetRemaining)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500 dark:text-neutral-400">Total Value:</span>
              <span className="ml-2 font-semibold text-slate-800 dark:text-neutral-100 tabular-nums">
                {formatCurrency(category.budgetUsed)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;
