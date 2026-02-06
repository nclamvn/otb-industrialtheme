'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  SKUProposal,
  ProposalCategory,
  ProposalProduct,
  SizeAllocation,
  SKUWarning,
  getBudgetStatus,
  generateDemoProposal,
} from '../types';
import { validateProposal, validateCategory, validateProduct } from '../utils/validation';

interface UseSKUProposalOptions {
  proposalId?: string;
  initialData?: SKUProposal;
}

interface UseSKUProposalReturn {
  // Data
  proposal: SKUProposal | null;
  selectedCategory: ProposalCategory | null;
  selectedProduct: ProposalProduct | null;
  warnings: SKUWarning[];

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions - Category
  selectCategory: (categoryId: string | null) => void;

  // Actions - Product
  selectProduct: (productId: string | null) => void;
  addProduct: (categoryId: string, product: Omit<ProposalProduct, 'id'>) => void;
  updateProduct: (productId: string, updates: Partial<ProposalProduct>) => void;
  deleteProduct: (productId: string) => void;
  expandProduct: (productId: string, expanded: boolean) => void;

  // Actions - Size
  updateSizeAllocation: (productId: string, sizeCode: string, updates: Partial<SizeAllocation>) => void;
  updateProductSizes: (productId: string, sizes: SizeAllocation[]) => void;

  // Actions - Proposal
  refresh: () => Promise<void>;
  save: () => Promise<boolean>;
  recalculateTotals: () => void;
}

export function useSKUProposal({
  proposalId,
  initialData,
}: UseSKUProposalOptions = {}): UseSKUProposalReturn {
  // State
  const [proposal, setProposal] = useState<SKUProposal | null>(initialData || null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const selectedCategory = proposal?.categories.find((c) => c.id === selectedCategoryId) || null;
  const selectedProduct = selectedCategory?.products.find((p) => p.id === selectedProductId) || null;
  const warnings = proposal ? validateProposal(proposal) : [];

  // Fetch proposal data
  const fetchProposal = useCallback(async () => {
    if (!proposalId) {
      // Use demo data for development
      setProposal(generateDemoProposal());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/sku-proposals/${proposalId}`);
      const data = await response.json();

      if (data.success) {
        // Transform API data to SKUProposal format
        setProposal(transformApiData(data.data));
      } else {
        setError(data.error || 'Failed to load proposal');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposal');
      // Fallback to demo data
      setProposal(generateDemoProposal());
    } finally {
      setIsLoading(false);
    }
  }, [proposalId]);

  // Initial load
  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  // Select first category on load
  useEffect(() => {
    if (proposal && !selectedCategoryId && proposal.categories.length > 0) {
      setSelectedCategoryId(proposal.categories[0].id);
    }
  }, [proposal, selectedCategoryId]);

  // Category actions
  const selectCategory = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedProductId(null);
  }, []);

  // Product actions
  const selectProduct = useCallback((productId: string | null) => {
    setSelectedProductId(productId);
  }, []);

  const addProduct = useCallback((categoryId: string, product: Omit<ProposalProduct, 'id'>) => {
    setProposal((prev) => {
      if (!prev) return prev;

      const newProduct: ProposalProduct = {
        ...product,
        id: `prod-${Date.now()}`,
      };

      const updatedCategories = prev.categories.map((cat) => {
        if (cat.id !== categoryId) return cat;

        const newProducts = [...cat.products, newProduct];
        const newUsed = newProducts.reduce((sum, p) => sum + p.totalValue, 0);

        return {
          ...cat,
          products: newProducts,
          productCount: newProducts.length,
          budgetUsed: newUsed,
          budgetRemaining: cat.budgetAllocated - newUsed,
          percentUsed: (newUsed / cat.budgetAllocated) * 100,
          status: getBudgetStatus((newUsed / cat.budgetAllocated) * 100),
        };
      });

      const totalUsed = updatedCategories.reduce((sum, cat) => sum + cat.budgetUsed, 0);

      return {
        ...prev,
        categories: updatedCategories,
        usedBudget: totalUsed,
        remainingBudget: prev.totalBudget - totalUsed,
        totalSKUs: updatedCategories.reduce((sum, cat) => sum + cat.products.length, 0),
      };
    });
  }, []);

  const updateProduct = useCallback((productId: string, updates: Partial<ProposalProduct>) => {
    setProposal((prev) => {
      if (!prev) return prev;

      const updatedCategories = prev.categories.map((cat) => {
        const productIndex = cat.products.findIndex((p) => p.id === productId);
        if (productIndex === -1) return cat;

        const updatedProducts = [...cat.products];
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          ...updates,
          hasChanges: true,
        };

        const newUsed = updatedProducts.reduce((sum, p) => sum + p.totalValue, 0);

        return {
          ...cat,
          products: updatedProducts,
          budgetUsed: newUsed,
          budgetRemaining: cat.budgetAllocated - newUsed,
          percentUsed: (newUsed / cat.budgetAllocated) * 100,
          status: getBudgetStatus((newUsed / cat.budgetAllocated) * 100),
        };
      });

      const totalUsed = updatedCategories.reduce((sum, cat) => sum + cat.budgetUsed, 0);

      return {
        ...prev,
        categories: updatedCategories,
        usedBudget: totalUsed,
        remainingBudget: prev.totalBudget - totalUsed,
      };
    });
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProposal((prev) => {
      if (!prev) return prev;

      const updatedCategories = prev.categories.map((cat) => {
        const newProducts = cat.products.filter((p) => p.id !== productId);
        if (newProducts.length === cat.products.length) return cat;

        const newUsed = newProducts.reduce((sum, p) => sum + p.totalValue, 0);

        return {
          ...cat,
          products: newProducts,
          productCount: newProducts.length,
          budgetUsed: newUsed,
          budgetRemaining: cat.budgetAllocated - newUsed,
          percentUsed: cat.budgetAllocated > 0 ? (newUsed / cat.budgetAllocated) * 100 : 0,
          status: getBudgetStatus(cat.budgetAllocated > 0 ? (newUsed / cat.budgetAllocated) * 100 : 0),
        };
      });

      const totalUsed = updatedCategories.reduce((sum, cat) => sum + cat.budgetUsed, 0);

      return {
        ...prev,
        categories: updatedCategories,
        usedBudget: totalUsed,
        remainingBudget: prev.totalBudget - totalUsed,
        totalSKUs: updatedCategories.reduce((sum, cat) => sum + cat.products.length, 0),
      };
    });

    // Clear selection if deleted product was selected
    if (selectedProductId === productId) {
      setSelectedProductId(null);
    }
  }, [selectedProductId]);

  const expandProduct = useCallback((productId: string, expanded: boolean) => {
    updateProduct(productId, { isExpanded: expanded });
  }, [updateProduct]);

  // Size actions
  const updateSizeAllocation = useCallback((
    productId: string,
    sizeCode: string,
    updates: Partial<SizeAllocation>
  ) => {
    setProposal((prev) => {
      if (!prev) return prev;

      const updatedCategories = prev.categories.map((cat) => {
        const productIndex = cat.products.findIndex((p) => p.id === productId);
        if (productIndex === -1) return cat;

        const product = cat.products[productIndex];
        const updatedSizes = product.sizes.map((size) => {
          if (size.sizeCode !== sizeCode) return size;
          return { ...size, ...updates, isManuallyEdited: true };
        });

        const totalQty = updatedSizes.reduce((sum, s) => sum + s.units, 0);
        const totalValue = totalQty * product.unitPrice;

        const updatedProducts = [...cat.products];
        updatedProducts[productIndex] = {
          ...product,
          sizes: updatedSizes,
          totalQty,
          totalValue,
          hasChanges: true,
        };

        const newUsed = updatedProducts.reduce((sum, p) => sum + p.totalValue, 0);

        return {
          ...cat,
          products: updatedProducts,
          budgetUsed: newUsed,
          budgetRemaining: cat.budgetAllocated - newUsed,
          percentUsed: (newUsed / cat.budgetAllocated) * 100,
          status: getBudgetStatus((newUsed / cat.budgetAllocated) * 100),
        };
      });

      const totalUsed = updatedCategories.reduce((sum, cat) => sum + cat.budgetUsed, 0);

      return {
        ...prev,
        categories: updatedCategories,
        usedBudget: totalUsed,
        remainingBudget: prev.totalBudget - totalUsed,
      };
    });
  }, []);

  const updateProductSizes = useCallback((productId: string, sizes: SizeAllocation[]) => {
    setProposal((prev) => {
      if (!prev) return prev;

      const updatedCategories = prev.categories.map((cat) => {
        const productIndex = cat.products.findIndex((p) => p.id === productId);
        if (productIndex === -1) return cat;

        const product = cat.products[productIndex];
        const totalQty = sizes.reduce((sum, s) => sum + s.units, 0);
        const totalValue = totalQty * product.unitPrice;

        const updatedProducts = [...cat.products];
        updatedProducts[productIndex] = {
          ...product,
          sizes,
          totalQty,
          totalValue,
          hasChanges: true,
        };

        const newUsed = updatedProducts.reduce((sum, p) => sum + p.totalValue, 0);

        return {
          ...cat,
          products: updatedProducts,
          budgetUsed: newUsed,
          budgetRemaining: cat.budgetAllocated - newUsed,
          percentUsed: (newUsed / cat.budgetAllocated) * 100,
          status: getBudgetStatus((newUsed / cat.budgetAllocated) * 100),
        };
      });

      const totalUsed = updatedCategories.reduce((sum, cat) => sum + cat.budgetUsed, 0);

      return {
        ...prev,
        categories: updatedCategories,
        usedBudget: totalUsed,
        remainingBudget: prev.totalBudget - totalUsed,
      };
    });
  }, []);

  // Proposal actions
  const refresh = useCallback(async () => {
    await fetchProposal();
  }, [fetchProposal]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!proposal || !proposalId) return false;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/sku-proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformToApiData(proposal)),
      });

      const data = await response.json();

      if (data.success) {
        // Clear hasChanges flags
        setProposal((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            categories: prev.categories.map((cat) => ({
              ...cat,
              products: cat.products.map((p) => ({ ...p, hasChanges: false })),
            })),
          };
        });
        return true;
      } else {
        setError(data.error || 'Failed to save proposal');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save proposal');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [proposal, proposalId]);

  const recalculateTotals = useCallback(() => {
    setProposal((prev) => {
      if (!prev) return prev;

      const updatedCategories = prev.categories.map((cat) => {
        const newUsed = cat.products.reduce((sum, p) => sum + p.totalValue, 0);
        return {
          ...cat,
          budgetUsed: newUsed,
          budgetRemaining: cat.budgetAllocated - newUsed,
          percentUsed: cat.budgetAllocated > 0 ? (newUsed / cat.budgetAllocated) * 100 : 0,
          status: getBudgetStatus(cat.budgetAllocated > 0 ? (newUsed / cat.budgetAllocated) * 100 : 0),
          productCount: cat.products.length,
        };
      });

      const totalUsed = updatedCategories.reduce((sum, cat) => sum + cat.budgetUsed, 0);

      return {
        ...prev,
        categories: updatedCategories,
        usedBudget: totalUsed,
        remainingBudget: prev.totalBudget - totalUsed,
        totalSKUs: updatedCategories.reduce((sum, cat) => sum + cat.products.length, 0),
      };
    });
  }, []);

  return {
    // Data
    proposal,
    selectedCategory,
    selectedProduct,
    warnings,

    // Loading states
    isLoading,
    isSaving,
    error,

    // Actions - Category
    selectCategory,

    // Actions - Product
    selectProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    expandProduct,

    // Actions - Size
    updateSizeAllocation,
    updateProductSizes,

    // Actions - Proposal
    refresh,
    save,
    recalculateTotals,
  };
}

// Helper functions
function transformApiData(apiData: any): SKUProposal {
  // Transform API response to SKUProposal format
  // This would be implemented based on actual API response structure
  return generateDemoProposal();
}

function transformToApiData(proposal: SKUProposal): any {
  // Transform SKUProposal to API request format
  return {
    id: proposal.id,
    categories: proposal.categories.map((cat) => ({
      id: cat.id,
      products: cat.products.map((p) => ({
        id: p.id,
        styleCode: p.styleCode,
        totalQty: p.totalQty,
        totalValue: p.totalValue,
        sizes: p.sizes,
      })),
    })),
  };
}

export default useSKUProposal;
