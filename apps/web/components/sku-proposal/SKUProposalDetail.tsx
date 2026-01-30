'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  SKUProposal,
  ProposalProduct,
  formatCurrency,
  formatPercent,
} from './types';
import { useSKUProposal } from './hooks/useSKUProposal';
import { useSKUSuggestions } from './hooks/useSKUSuggestions';
import { CategoryTree } from './CategoryTree';
import { ProductList } from './ProductList';
import {
  Save,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface SKUProposalDetailProps {
  proposalId?: string;
  initialData?: SKUProposal;
  className?: string;
  renderSizeBreakdown?: (product: ProposalProduct) => React.ReactNode;
  renderAIPanel?: () => React.ReactNode;
  onAddProduct?: () => void;
  onEditProduct?: (product: ProposalProduct) => void;
}

const STATUS_BADGE_CONFIG: Record<
  string,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
> = {
  DRAFT: { variant: 'secondary', label: 'Draft' },
  SUBMITTED: { variant: 'default', label: 'Submitted' },
  UNDER_REVIEW: { variant: 'outline', label: 'Under Review' },
  APPROVED: { variant: 'default', label: 'Approved' },
  REJECTED: { variant: 'destructive', label: 'Rejected' },
  ORDERED: { variant: 'default', label: 'Ordered' },
};

export function SKUProposalDetail({
  proposalId,
  initialData,
  className,
  renderSizeBreakdown,
  renderAIPanel,
  onAddProduct,
  onEditProduct,
}: SKUProposalDetailProps) {
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Main proposal hook
  const {
    proposal,
    selectedCategory,
    isLoading,
    isSaving,
    error,
    selectCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    save,
  } = useSKUProposal({ proposalId, initialData });

  // Suggestions hook
  const {
    warnings,
    errorCount,
    warningCount,
    suggestions,
  } = useSKUSuggestions({ proposal });

  // Handle save
  const handleSave = useCallback(async () => {
    const success = await save();
    if (success) {
      toast.success('Changes saved successfully');
    } else {
      toast.error('Failed to save changes');
    }
  }, [save]);

  // Handle add product
  const handleAddProduct = useCallback(() => {
    if (onAddProduct) {
      onAddProduct();
    }
  }, [onAddProduct]);

  // Handle edit product
  const handleEditProduct = useCallback(
    (product: ProposalProduct) => {
      if (onEditProduct) {
        onEditProduct(product);
      }
    },
    [onEditProduct]
  );

  // Handle duplicate product
  const handleDuplicateProduct = useCallback(
    (product: ProposalProduct) => {
      if (!selectedCategory) return;

      const newProduct = {
        ...product,
        styleCode: `${product.styleCode}-COPY`,
        hasChanges: true,
      };
      delete (newProduct as any).id;

      addProduct(selectedCategory.id, newProduct);
      toast.success('Product duplicated');
    },
    [selectedCategory, addProduct]
  );

  // Handle delete product
  const handleDeleteProduct = useCallback(
    (productId: string) => {
      deleteProduct(productId);
      if (expandedProductId === productId) {
        setExpandedProductId(null);
      }
      toast.success('Product deleted');
    },
    [deleteProduct, expandedProductId]
  );

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-96', className)}>
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-slate-600">{error || 'Failed to load proposal'}</p>
      </div>
    );
  }

  const statusConfig = STATUS_BADGE_CONFIG[proposal.status] || STATUS_BADGE_CONFIG.DRAFT;
  const isEditable = ['DRAFT', 'REJECTED'].includes(proposal.status);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-800">
                {proposal.name}
              </h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              <span>{proposal.seasonCode}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{proposal.brandName}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>v{proposal.version}</span>
            </div>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Total Budget
            </p>
            <p className="text-lg font-semibold text-slate-800 tabular-nums">
              {formatCurrency(proposal.totalBudget)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Used</p>
            <p className="text-lg font-semibold text-slate-800 tabular-nums">
              {formatCurrency(proposal.usedBudget)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Remaining
            </p>
            <p
              className={cn(
                'text-lg font-semibold tabular-nums',
                proposal.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatCurrency(proposal.remainingBudget)}
            </p>
          </div>

          <Separator orientation="vertical" className="h-12" />

          {/* Warnings Summary */}
          {(errorCount > 0 || warningCount > 0) && (
            <div className="flex items-center gap-2">
              {errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errorCount}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                  <AlertCircle className="w-3 h-3" />
                  {warningCount}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          {isEditable && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              <Button disabled={errorCount > 0}>
                <Send className="w-4 h-4 mr-2" />
                Submit
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Category Tree */}
        <div className="w-80 border-r bg-white overflow-y-auto">
          <CategoryTree
            categories={proposal.categories}
            selectedCategoryId={selectedCategory?.id || null}
            onSelectCategory={selectCategory}
          />
        </div>

        {/* Main Content - Product List */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="p-6">
            <ProductList
              category={selectedCategory}
              expandedProductId={expandedProductId}
              onExpandProduct={setExpandedProductId}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onDuplicateProduct={handleDuplicateProduct}
              renderSizeBreakdown={renderSizeBreakdown}
            />
          </div>
        </div>

        {/* Right Sidebar - AI Panel (Optional) */}
        {renderAIPanel && (
          <div className="w-80 border-l bg-white overflow-y-auto">
            {renderAIPanel()}
          </div>
        )}
      </div>
    </div>
  );
}

export default SKUProposalDetail;
