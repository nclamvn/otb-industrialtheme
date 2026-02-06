'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  SKUProposal,
  ProposalCategory,
  ProposalProduct,
  SKUWarning,
  SKUSuggestion,
  HistoricalSizeData,
} from '../types';
import { validateProposal, generateSuggestions } from '../utils/validation';

interface UseSKUSuggestionsOptions {
  proposal: SKUProposal | null;
  historicalData?: Map<string, HistoricalSizeData[]>;
}

interface UseSKUSuggestionsReturn {
  // Warnings
  warnings: SKUWarning[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  getWarningsForCategory: (categoryId: string) => SKUWarning[];
  getWarningsForProduct: (productId: string) => SKUWarning[];

  // Suggestions
  suggestions: SKUSuggestion[];
  dismissSuggestion: (suggestionId: string) => void;
  applySuggestion: (suggestionId: string) => SKUSuggestion | null;

  // AI Analysis
  isAnalyzing: boolean;
  analyzeProposal: () => Promise<void>;
}

export function useSKUSuggestions({
  proposal,
  historicalData,
}: UseSKUSuggestionsOptions): UseSKUSuggestionsReturn {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SKUSuggestion[]>([]);

  // Calculate warnings from proposal
  const warnings = useMemo(() => {
    if (!proposal) return [];
    return validateProposal(proposal);
  }, [proposal]);

  // Count warnings by severity
  const errorCount = useMemo(
    () => warnings.filter((w) => w.severity === 'error').length,
    [warnings]
  );
  const warningCount = useMemo(
    () => warnings.filter((w) => w.severity === 'warning').length,
    [warnings]
  );
  const infoCount = useMemo(
    () => warnings.filter((w) => w.severity === 'info').length,
    [warnings]
  );

  // Get warnings for specific category
  const getWarningsForCategory = useCallback(
    (categoryId: string) => {
      return warnings.filter((w) => w.categoryId === categoryId);
    },
    [warnings]
  );

  // Get warnings for specific product
  const getWarningsForProduct = useCallback(
    (productId: string) => {
      return warnings.filter((w) => w.productId === productId);
    },
    [warnings]
  );

  // Generate local suggestions
  const localSuggestions = useMemo(() => {
    if (!proposal) return [];
    return generateSuggestions(proposal);
  }, [proposal]);

  // Combined and filtered suggestions
  const suggestions = useMemo(() => {
    const combined = [...localSuggestions, ...aiSuggestions];
    return combined.filter((s) => !dismissedSuggestions.has(s.id));
  }, [localSuggestions, aiSuggestions, dismissedSuggestions]);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setDismissedSuggestions((prev) => {
      const newSet = new Set(Array.from(prev));
      newSet.add(suggestionId);
      return newSet;
    });
  }, []);

  // Apply a suggestion (returns the suggestion for the caller to implement)
  const applySuggestion = useCallback(
    (suggestionId: string): SKUSuggestion | null => {
      const suggestion = suggestions.find((s) => s.id === suggestionId);
      if (suggestion) {
        // Mark as dismissed after applying
        dismissSuggestion(suggestionId);
      }
      return suggestion || null;
    },
    [suggestions, dismissSuggestion]
  );

  // Analyze proposal with AI (mock implementation)
  const analyzeProposal = useCallback(async () => {
    if (!proposal) return;

    setIsAnalyzing(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate mock AI suggestions based on proposal data
      const newSuggestions: SKUSuggestion[] = [];

      // Check categories for optimization opportunities
      proposal.categories.forEach((category) => {
        if (category.status === 'over-budget') {
          // Find products that could be reduced
          const largestProduct = category.products.reduce(
            (max, p) => (p.totalValue > max.totalValue ? p : max),
            category.products[0]
          );

          if (largestProduct) {
            const reduction = Math.ceil(category.budgetRemaining * -1);
            const qtyReduction = Math.ceil(reduction / largestProduct.unitPrice);

            newSuggestions.push({
              id: `ai-sug-${category.id}-reduce`,
              type: 'decrease-qty',
              title: `Reduce ${largestProduct.styleName} quantity`,
              description: `Reduce by ${qtyReduction} units to bring category within budget`,
              impact: {
                budgetChange: -reduction,
                qtyChange: -qtyReduction,
              },
              action: {
                productId: largestProduct.id,
                field: 'totalQty',
                currentValue: largestProduct.totalQty,
                suggestedValue: largestProduct.totalQty - qtyReduction,
              },
              confidence: 85,
            });
          }
        }

        // Check for historical trends
        category.products.forEach((product) => {
          // Simulate historical insight
          const midSizes = product.sizes.filter(
            (s) =>
              s.salesMixPercent > 20 &&
              s.salesMixPercent < 50 &&
              s.sellThruPercent &&
              s.sellThruPercent > 50
          );

          if (midSizes.length > 0) {
            const bestSize = midSizes[0];
            newSuggestions.push({
              id: `ai-sug-${product.id}-${bestSize.sizeCode}-trend`,
              type: 'historical-insight',
              title: `Size ${bestSize.sizeCode} trending up`,
              description: `Based on last season, Size ${bestSize.sizeCode} has ${bestSize.sellThruPercent}% sell-through. Consider increasing allocation by 5%.`,
              impact: {
                qtyChange: Math.ceil(product.totalQty * 0.05),
              },
              action: {
                productId: product.id,
                sizeCode: bestSize.sizeCode,
                field: 'salesMixPercent',
                currentValue: bestSize.salesMixPercent,
                suggestedValue: bestSize.salesMixPercent + 5,
              },
              confidence: 72,
            });
          }
        });
      });

      setAiSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to analyze proposal:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [proposal]);

  return {
    // Warnings
    warnings,
    errorCount,
    warningCount,
    infoCount,
    getWarningsForCategory,
    getWarningsForProduct,

    // Suggestions
    suggestions,
    dismissSuggestion,
    applySuggestion,

    // AI Analysis
    isAnalyzing,
    analyzeProposal,
  };
}

export default useSKUSuggestions;
