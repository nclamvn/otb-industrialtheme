'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { SKUProposal, ProposalProduct, formatCurrency } from './types';
import { useSKUProposal } from './hooks/useSKUProposal';
import { useSKUSuggestions } from './hooks/useSKUSuggestions';
import { CategoryTree } from './CategoryTree';
import { ProductList } from './ProductList';
import { SizeBreakdownTable } from './SizeBreakdownTable';
import { AddProductDialog } from './AddProductDialog';
import { AIWarningsPanel } from './AIWarningsPanel';
import { SKUVersionSelector } from './SKUVersionSelector';
import {
  Save,
  Send,
  Loader2,
  AlertCircle,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface SKUProposalViewProps {
  proposalId?: string;
  initialData?: SKUProposal;
  className?: string;
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

export function SKUProposalView({
  proposalId,
  initialData,
  className,
}: SKUProposalViewProps) {
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);

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
    updateProductSizes,
    save,
  } = useSKUProposal({ proposalId, initialData });

  // Suggestions hook
  const {
    warnings,
    errorCount,
    warningCount,
    suggestions,
    isAnalyzing,
    analyzeProposal,
    dismissSuggestion,
    applySuggestion,
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
  const handleAddProduct = useCallback(
    (product: Omit<ProposalProduct, 'id'>) => {
      if (!selectedCategory) return;
      addProduct(selectedCategory.id, product);
      toast.success('Product added successfully');
    },
    [selectedCategory, addProduct]
  );

  // Handle edit product
  const handleEditProduct = useCallback((product: ProposalProduct) => {
    setExpandedProductId(product.id);
  }, []);

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

  // Handle apply suggestion
  const handleApplySuggestion = useCallback(
    (suggestionId: string) => {
      const suggestion = applySuggestion(suggestionId);
      if (suggestion?.action) {
        const { productId, field, suggestedValue } = suggestion.action;

        if (field === 'totalQty') {
          updateProduct(productId, { totalQty: suggestedValue });
        } else if (field === 'salesMixPercent' && suggestion.action.sizeCode) {
          const product = proposal?.categories
            .flatMap((c) => c.products)
            .find((p) => p.id === productId);

          if (product) {
            const newSizes = product.sizes.map((s) => {
              if (s.sizeCode === suggestion.action?.sizeCode) {
                return { ...s, salesMixPercent: suggestedValue };
              }
              return s;
            });
            updateProductSizes(productId, newSizes);
          }
        }

        toast.success('Suggestion applied');
      }
    },
    [applySuggestion, updateProduct, updateProductSizes, proposal]
  );

  // Render size breakdown
  const renderSizeBreakdown = useCallback(
    (product: ProposalProduct) => (
      <SizeBreakdownTable
        product={product}
        onUpdateProduct={(updates) => updateProduct(product.id, updates)}
        onUpdateSizes={(sizes) => updateProductSizes(product.id, sizes)}
        warnings={warnings.filter((w) => w.productId === product.id)}
        isEditable={['DRAFT', 'REJECTED'].includes(proposal?.status || '')}
      />
    ),
    [updateProduct, updateProductSizes, warnings, proposal?.status]
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
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Version Selector Banner */}
      <div className="px-4 pt-4">
        <SKUVersionSelector
          proposalId={proposalId || ''}
          showFinalButton={isEditable}
          onVersionChange={(version) => {
            toast.success(`Switched to version v${version.versionNumber}.0`);
          }}
          onSetFinal={(version) => {
            toast.success(`Final version selected: v${version.versionNumber}.0`);
            return Promise.resolve(true);
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
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
            <p className="text-xs text-slate-500 uppercase tracking-wider">Budget</p>
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
            <p className="text-xs text-slate-500 uppercase tracking-wider">Remaining</p>
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={cn(showAIPanel && 'bg-slate-100')}
            >
              {showAIPanel ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </Button>

            {isEditable && (
              <>
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
              </>
            )}
          </div>
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
              onAddProduct={() => setShowAddProduct(true)}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onDuplicateProduct={handleDuplicateProduct}
              renderSizeBreakdown={renderSizeBreakdown}
            />
          </div>
        </div>

        {/* Right Sidebar - AI Panel */}
        {showAIPanel && (
          <div className="w-80 border-l bg-white overflow-y-auto">
            <AIWarningsPanel
              warnings={warnings}
              suggestions={suggestions}
              isAnalyzing={isAnalyzing}
              onAnalyze={analyzeProposal}
              onDismissSuggestion={dismissSuggestion}
              onApplySuggestion={handleApplySuggestion}
            />
          </div>
        )}
      </div>

      {/* Add Product Dialog */}
      {selectedCategory && (
        <AddProductDialog
          open={showAddProduct}
          onOpenChange={setShowAddProduct}
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
          budgetRemaining={selectedCategory.budgetRemaining}
          onAddProduct={handleAddProduct}
        />
      )}
    </div>
  );
}

export default SKUProposalView;
