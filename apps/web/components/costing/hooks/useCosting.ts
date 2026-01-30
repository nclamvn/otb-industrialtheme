'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { costingApi } from '@/lib/api-client';
import type {
  CostingBreakdown as ApiCostingBreakdown,
  CostingSummary as ApiCostingSummary,
  BatchOperationResult,
} from '@/lib/api-types';
import {
  CostingBreakdown,
  CostingSummary,
  DEFAULT_COSTING_PARAMS,
  IMPORT_TAX_RATES,
} from '../types';
import { calculateCosting, calculateCostingSummary } from '../utils/costing-calculator';

// Map API response to internal format
const mapApiToInternal = (apiCosting: ApiCostingBreakdown): CostingBreakdown => {
  return {
    id: apiCosting.id,
    skuId: apiCosting.skuId,
    unitCost: apiCosting.unitCostUSD,
    unitCostCurrency: 'USD',
    freightInsurancePct: apiCosting.freightPercent / 100,
    othersTaxPct: apiCosting.taxPercent / 100,
    importTaxPct: apiCosting.importDutyPercent / 100,
    freightInsuranceValue: apiCosting.freightVND,
    othersTaxValue: apiCosting.taxVND,
    importTaxValue: apiCosting.importDutyVND,
    landedCost: apiCosting.unitCostUSD * (1 + apiCosting.freightPercent / 100 + apiCosting.taxPercent / 100 + apiCosting.importDutyPercent / 100),
    landedCostVND: apiCosting.landedCostVND,
    exchangeRate: apiCosting.exchangeRate,
    srp: apiCosting.srpVND,
    grossMargin: apiCosting.marginPercent / 100,
  };
};

// Fallback demo data generator
const generateDemoCostings = (): CostingBreakdown[] => {
  const skus = [
    { id: '8116333', unitCost: 150, srp: 87900000, category: 'WOMENS' },
    { id: '8113543', unitCost: 120, srp: 65900000, category: 'WOMENS' },
    { id: '8115960', unitCost: 130, srp: 71900000, category: 'WOMENS' },
    { id: '8113524', unitCost: 180, srp: 80900000, category: 'MENS' },
    { id: '8112624', unitCost: 200, srp: 94900000, category: 'MENS' },
    { id: '8114084', unitCost: 80, srp: 12900000, category: 'ACCESSORIES' },
    { id: '8117890', unitCost: 95, srp: 25900000, category: 'ACCESSORIES' },
    { id: '8118234', unitCost: 250, srp: 125900000, category: 'BAGS' },
  ];

  return skus.map((sku) =>
    calculateCosting({
      skuId: sku.id,
      unitCost: sku.unitCost,
      category: sku.category,
      srp: sku.srp,
      exchangeRate: DEFAULT_COSTING_PARAMS.exchangeRate,
    })
  );
};

interface UseCostingOptions {
  brandId?: string;
  seasonId?: string;
  categoryId?: string;
  useDemoData?: boolean;
}

interface UseCostingReturn {
  costings: CostingBreakdown[];
  summary: CostingSummary;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  selectedSku: CostingBreakdown | null;
  selectSku: (costing: CostingBreakdown | null) => void;
  updateCosting: (id: string, updates: Partial<{ unitCost: number; srp: number; exchangeRate: number }>) => Promise<boolean>;
  batchUpdate: (updates: { skuId: string; unitCost?: number; srp?: number }[]) => Promise<BatchOperationResult | null>;
  recalculateAll: (exchangeRate: number) => Promise<BatchOperationResult | null>;
  refresh: () => Promise<void>;
  exportToExcel: () => Promise<string | null>;
}

export function useCosting(options: UseCostingOptions = {}): UseCostingReturn {
  const { brandId, seasonId, categoryId, useDemoData = false } = options;

  const [costings, setCostings] = useState<CostingBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState<CostingBreakdown | null>(null);

  // Fetch data on mount and when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (useDemoData) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          const demoData = generateDemoCostings();
          setCostings(demoData);
          setSelectedSku(demoData[0] || null);
        } else {
          const response = await costingApi.getAll({
            brandId,
            seasonId,
            categoryId,
          });

          if (response.success && response.data) {
            const mapped = response.data.data.map(mapApiToInternal);
            setCostings(mapped);
            setSelectedSku(mapped[0] || null);
          } else if (response.error) {
            console.warn('API error, using demo data:', response.error);
            const demoData = generateDemoCostings();
            setCostings(demoData);
            setSelectedSku(demoData[0] || null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch costing data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        const demoData = generateDemoCostings();
        setCostings(demoData);
        setSelectedSku(demoData[0] || null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [brandId, seasonId, categoryId, useDemoData]);

  const summary = useMemo(() => calculateCostingSummary(costings), [costings]);

  const selectSku = useCallback((costing: CostingBreakdown | null) => {
    setSelectedSku(costing);
  }, []);

  const updateCosting = useCallback(async (
    id: string,
    updates: Partial<{ unitCost: number; srp: number; exchangeRate: number }>
  ): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      // Find the costing to update
      const existingCosting = costings.find((c) => c.id === id);
      if (!existingCosting) {
        throw new Error('Costing not found');
      }

      // Calculate new values locally (optimistic update)
      const category = 'DEFAULT'; // Would come from SKU data
      const newCosting = calculateCosting({
        skuId: existingCosting.skuId,
        unitCost: updates.unitCost ?? existingCosting.unitCost,
        category,
        srp: updates.srp ?? existingCosting.srp,
        exchangeRate: updates.exchangeRate ?? existingCosting.exchangeRate,
      });
      newCosting.id = id;

      // Optimistic update
      setCostings((prev) =>
        prev.map((c) => (c.id === id ? newCosting : c))
      );

      if (selectedSku?.id === id) {
        setSelectedSku(newCosting);
      }

      // Send to API
      if (!useDemoData) {
        const response = await costingApi.update(id, {
          unitCostUSD: updates.unitCost,
          srpVND: updates.srp,
          exchangeRate: updates.exchangeRate,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to update costing');
        }
      }

      return true;
    } catch (err) {
      console.error('Failed to update costing:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [costings, selectedSku, useDemoData]);

  const batchUpdate = useCallback(async (
    updates: { skuId: string; unitCost?: number; srp?: number }[]
  ): Promise<BatchOperationResult | null> => {
    setIsSaving(true);
    setError(null);

    try {
      // Apply optimistic updates
      setCostings((prev) =>
        prev.map((c) => {
          const update = updates.find((u) => u.skuId === c.skuId);
          if (!update) return c;

          return calculateCosting({
            skuId: c.skuId,
            unitCost: update.unitCost ?? c.unitCost,
            category: 'DEFAULT',
            srp: update.srp ?? c.srp,
            exchangeRate: c.exchangeRate,
          });
        })
      );

      if (!useDemoData) {
        const response = await costingApi.batchUpdate({ costings: updates });

        if (!response.success) {
          throw new Error(response.error || 'Failed to batch update');
        }

        return response.data || { success: true, processed: updates.length, failed: 0 };
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      return { success: true, processed: updates.length, failed: 0 };
    } catch (err) {
      console.error('Failed to batch update costings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [useDemoData]);

  const recalculateAll = useCallback(async (
    exchangeRate: number
  ): Promise<BatchOperationResult | null> => {
    setIsSaving(true);
    setError(null);

    try {
      // Recalculate all costings with new exchange rate
      setCostings((prev) =>
        prev.map((c) =>
          calculateCosting({
            skuId: c.skuId,
            unitCost: c.unitCost,
            category: 'DEFAULT',
            srp: c.srp,
            exchangeRate,
          })
        )
      );

      if (!useDemoData) {
        const response = await costingApi.recalculateAll({
          exchangeRate,
          seasonId,
          brandId,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to recalculate');
        }

        return response.data || { success: true, processed: costings.length, failed: 0 };
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, processed: costings.length, failed: 0 };
    } catch (err) {
      console.error('Failed to recalculate costings:', err);
      setError(err instanceof Error ? err.message : 'Failed to recalculate');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [costings.length, seasonId, brandId, useDemoData]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useDemoData) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const demoData = generateDemoCostings();
        setCostings(demoData);
        setSelectedSku(demoData[0] || null);
      } else {
        const response = await costingApi.getAll({
          brandId,
          seasonId,
          categoryId,
        });

        if (response.success && response.data) {
          const mapped = response.data.data.map(mapApiToInternal);
          setCostings(mapped);
          setSelectedSku(mapped[0] || null);
        } else {
          const demoData = generateDemoCostings();
          setCostings(demoData);
          setSelectedSku(demoData[0] || null);
        }
      }
    } catch (err) {
      console.error('Failed to refresh costing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [brandId, seasonId, categoryId, useDemoData]);

  const exportToExcel = useCallback(async (): Promise<string | null> => {
    try {
      if (useDemoData) {
        // Generate local CSV for demo
        const rows = ['SKU ID,Unit Cost,Exchange Rate,Landed Cost VND,SRP,Margin'];
        costings.forEach((c) => {
          rows.push(`${c.skuId},${c.unitCost},${c.exchangeRate},${c.landedCostVND},${c.srp},${(c.grossMargin * 100).toFixed(1)}%`);
        });

        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `costing-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        URL.revokeObjectURL(url);
        return url;
      }

      const response = await costingApi.exportToExcel({
        brandId,
        seasonId,
        categoryId,
      });

      if (response.success && response.data) {
        return response.data.downloadUrl;
      }

      return null;
    } catch (err) {
      console.error('Failed to export costing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to export');
      return null;
    }
  }, [costings, brandId, seasonId, categoryId, useDemoData]);

  return {
    costings,
    summary,
    isLoading,
    isSaving,
    error,
    selectedSku,
    selectSku,
    updateCosting,
    batchUpdate,
    recalculateAll,
    refresh,
    exportToExcel,
  };
}

export default useCosting;
