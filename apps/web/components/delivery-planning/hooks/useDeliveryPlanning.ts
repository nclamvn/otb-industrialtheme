'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { deliveryApi } from '@/lib/api-client';
import type {
  DeliveryMatrixRow,
  DeliverySummary,
  StoreGroup,
  BatchOperationResult,
} from '@/lib/api-types';
import {
  DeliveryMatrix,
  SKUDeliveryPlan,
  DeliveryCellEdit,
  DEFAULT_STORES,
  DELIVERY_MONTHS,
} from '../types';

// Fallback demo data for development/offline mode
const generateDemoData = (): SKUDeliveryPlan[] => {
  const skus = [
    { id: 'sku-1', code: '8116333', name: 'FITZROVIA DK SHT' },
    { id: 'sku-2', code: '8113543', name: 'FLORISTON S' },
    { id: 'sku-3', code: '8115960', name: 'OLDHAM CHK' },
    { id: 'sku-4', code: '8115965', name: 'SIMONE CHK' },
    { id: 'sku-5', code: '8115641', name: 'SCARLETT EKD' },
    { id: 'sku-6', code: '8115932', name: 'PRISCILLA EKD' },
    { id: 'sku-7', code: '8113524', name: 'ROBIN' },
    { id: 'sku-8', code: '8112624', name: 'COXBRIDGE' },
    { id: 'sku-9', code: '8116290', name: 'NEWINGTON' },
    { id: 'sku-10', code: '8112680', name: 'BURBERRY WOOL SCARF' },
    { id: 'sku-11', code: '8115728', name: 'CLASSIC CHECK CASHMERE' },
    { id: 'sku-12', code: '8113982', name: 'MONOGRAM MOTIF' },
  ];

  return skus.map((sku) => {
    const dafcJul = Math.floor(Math.random() * 4);
    const dafcAug = Math.floor(Math.random() * 4);
    const dafcSep = Math.floor(Math.random() * 3);
    const rexJul = Math.floor(Math.random() * 5);
    const rexAug = Math.floor(Math.random() * 5);
    const rexSep = Math.floor(Math.random() * 4);
    const ttpJul = Math.floor(Math.random() * 5);
    const ttpAug = Math.floor(Math.random() * 5);
    const ttpSep = Math.floor(Math.random() * 3);

    const total =
      dafcJul + dafcAug + dafcSep +
      rexJul + rexAug + rexSep +
      ttpJul + ttpAug + ttpSep;

    return {
      skuId: sku.id,
      skuCode: sku.code,
      skuName: sku.name,
      totalUnits: total,
      totalValue: total * 50000000,
      deliverySlots: [],
      byStore: {
        'store-1': {
          total: dafcJul + dafcAug + dafcSep,
          byMonth: { 7: dafcJul, 8: dafcAug, 9: dafcSep },
        },
        'store-2': {
          total: rexJul + rexAug + rexSep,
          byMonth: { 7: rexJul, 8: rexAug, 9: rexSep },
        },
        'store-3': {
          total: ttpJul + ttpAug + ttpSep,
          byMonth: { 7: ttpJul, 8: ttpAug, 9: ttpSep },
        },
      },
      byMonth: {
        7: {
          total: dafcJul + rexJul + ttpJul,
          byStore: { 'store-1': dafcJul, 'store-2': rexJul, 'store-3': ttpJul },
        },
        8: {
          total: dafcAug + rexAug + ttpAug,
          byStore: { 'store-1': dafcAug, 'store-2': rexAug, 'store-3': ttpAug },
        },
        9: {
          total: dafcSep + rexSep + ttpSep,
          byStore: { 'store-1': dafcSep, 'store-2': rexSep, 'store-3': ttpSep },
        },
      },
    };
  });
};

// Map API response to internal format
const mapApiToInternal = (apiRows: DeliveryMatrixRow[]): SKUDeliveryPlan[] => {
  return apiRows.map((row) => {
    const byStore: Record<string, { total: number; byMonth: Record<number, number> }> = {};
    const byMonth: Record<number, { total: number; byStore: Record<string, number> }> = {};

    // Build byStore and byMonth from windows
    row.windows.forEach((window) => {
      const month = new Date(window.windowName).getMonth() + 1 || parseInt(window.windowId.split('-')[1]) || 7;

      // For now, distribute evenly across stores (actual store mapping comes from allocations)
      DEFAULT_STORES.forEach((store) => {
        if (!byStore[store.id]) {
          byStore[store.id] = { total: 0, byMonth: {} };
        }
        const storeQty = Math.floor(window.quantity / DEFAULT_STORES.length);
        byStore[store.id].byMonth[month] = (byStore[store.id].byMonth[month] || 0) + storeQty;
        byStore[store.id].total += storeQty;
      });

      if (!byMonth[month]) {
        byMonth[month] = { total: 0, byStore: {} };
      }
      byMonth[month].total += window.quantity;
    });

    return {
      skuId: row.skuId,
      skuCode: row.skuCode,
      skuName: row.skuName,
      totalUnits: row.totalQuantity,
      totalValue: row.totalValue,
      deliverySlots: [],
      byStore,
      byMonth,
    };
  });
};

interface UseDeliveryPlanningOptions {
  proposalId?: string;
  seasonId?: string;
  brandId?: string;
  storeGroup?: StoreGroup;
  useDemoData?: boolean;
}

interface UseDeliveryPlanningReturn {
  matrix: DeliveryMatrix;
  pendingEdits: DeliveryCellEdit[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  summary: DeliverySummary | null;
  updateCell: (edit: DeliveryCellEdit) => void;
  saveChanges: () => Promise<BatchOperationResult | null>;
  resetChanges: () => void;
  refresh: () => Promise<void>;
}

export function useDeliveryPlanning(
  options: UseDeliveryPlanningOptions = {}
): UseDeliveryPlanningReturn {
  const { seasonId, brandId, storeGroup, useDemoData = false } = options;

  const [skus, setSkus] = useState<SKUDeliveryPlan[]>([]);
  const [pendingEdits, setPendingEdits] = useState<DeliveryCellEdit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DeliverySummary | null>(null);

  // Fetch data on mount and when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (useDemoData) {
          // Use demo data in development
          await new Promise((resolve) => setTimeout(resolve, 300));
          setSkus(generateDemoData());
        } else {
          // Fetch from API
          const [matrixResponse, summaryResponse] = await Promise.all([
            deliveryApi.getMatrix({ seasonId, brandId, storeGroup }),
            deliveryApi.getSummary({ seasonId, brandId, storeGroup }),
          ]);

          if (matrixResponse.success && matrixResponse.data) {
            setSkus(mapApiToInternal(matrixResponse.data));
          } else if (matrixResponse.error) {
            // Fall back to demo data if API fails
            console.warn('API error, using demo data:', matrixResponse.error);
            setSkus(generateDemoData());
          }

          if (summaryResponse.success && summaryResponse.data) {
            setSummary(summaryResponse.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch delivery data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Fall back to demo data
        setSkus(generateDemoData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [seasonId, brandId, storeGroup, useDemoData]);

  const matrix: DeliveryMatrix = useMemo(() => {
    const totals = {
      byStore: {} as Record<string, number>,
      byMonth: {} as Record<number, number>,
      grand: 0,
    };

    DEFAULT_STORES.forEach((store) => {
      totals.byStore[store.id] = skus.reduce(
        (sum, sku) => sum + (sku.byStore[store.id]?.total || 0),
        0
      );
    });

    DELIVERY_MONTHS.forEach((month) => {
      totals.byMonth[month.month] = skus.reduce(
        (sum, sku) => sum + (sku.byMonth[month.month]?.total || 0),
        0
      );
    });

    totals.grand = skus.reduce((sum, sku) => sum + sku.totalUnits, 0);

    return {
      stores: DEFAULT_STORES,
      months: DELIVERY_MONTHS,
      skus,
      totals,
    };
  }, [skus]);

  const updateCell = useCallback((edit: DeliveryCellEdit) => {
    setPendingEdits((prev) => [
      ...prev.filter(
        (e) =>
          !(
            e.skuId === edit.skuId &&
            e.storeId === edit.storeId &&
            e.month === edit.month
          )
      ),
      edit,
    ]);
  }, []);

  const saveChanges = useCallback(async (): Promise<BatchOperationResult | null> => {
    if (pendingEdits.length === 0) return null;

    setIsSaving(true);
    setError(null);

    try {
      // Apply optimistic updates to local state
      setSkus((prev) =>
        prev.map((sku) => {
          const edits = pendingEdits.filter((e) => e.skuId === sku.skuId);
          if (edits.length === 0) return sku;

          const newByStore = { ...sku.byStore };
          const newByMonth = { ...sku.byMonth };

          edits.forEach((edit) => {
            if (!newByStore[edit.storeId]) {
              newByStore[edit.storeId] = { total: 0, byMonth: {} };
            }
            newByStore[edit.storeId] = {
              ...newByStore[edit.storeId],
              byMonth: {
                ...newByStore[edit.storeId].byMonth,
                [edit.month]: edit.units,
              },
            };
            newByStore[edit.storeId].total = Object.values(
              newByStore[edit.storeId].byMonth
            ).reduce((a, b) => a + b, 0);

            if (!newByMonth[edit.month]) {
              newByMonth[edit.month] = { total: 0, byStore: {} };
            }
            newByMonth[edit.month] = {
              ...newByMonth[edit.month],
              byStore: {
                ...newByMonth[edit.month].byStore,
                [edit.storeId]: edit.units,
              },
            };
            newByMonth[edit.month].total = Object.values(
              newByMonth[edit.month].byStore
            ).reduce((a, b) => a + b, 0);
          });

          const newTotal = Object.values(newByStore).reduce(
            (sum, s) => sum + s.total,
            0
          );

          return {
            ...sku,
            byStore: newByStore,
            byMonth: newByMonth,
            totalUnits: newTotal,
            totalValue: newTotal * 50000000,
          };
        })
      );

      // Send to API
      if (!useDemoData) {
        const allocations = pendingEdits.map((edit) => ({
          skuId: edit.skuId,
          windowId: `window-${edit.month}`,
          quantity: edit.units,
          storeGroup: DEFAULT_STORES.find(s => s.id === edit.storeId)?.group as StoreGroup,
        }));

        const response = await deliveryApi.batchUpdateAllocations({ allocations });

        if (!response.success) {
          throw new Error(response.error || 'Failed to save changes');
        }

        setPendingEdits([]);
        return response.data || { success: true, processed: allocations.length, failed: 0 };
      }

      // Demo mode - just clear edits
      await new Promise((resolve) => setTimeout(resolve, 300));
      setPendingEdits([]);
      return { success: true, processed: pendingEdits.length, failed: 0 };
    } catch (err) {
      console.error('Failed to save delivery changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [pendingEdits, useDemoData]);

  const resetChanges = useCallback(() => {
    setPendingEdits([]);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPendingEdits([]);

    try {
      if (useDemoData) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setSkus(generateDemoData());
      } else {
        const [matrixResponse, summaryResponse] = await Promise.all([
          deliveryApi.getMatrix({ seasonId, brandId, storeGroup }),
          deliveryApi.getSummary({ seasonId, brandId, storeGroup }),
        ]);

        if (matrixResponse.success && matrixResponse.data) {
          setSkus(mapApiToInternal(matrixResponse.data));
        } else {
          setSkus(generateDemoData());
        }

        if (summaryResponse.success && summaryResponse.data) {
          setSummary(summaryResponse.data);
        }
      }
    } catch (err) {
      console.error('Failed to refresh delivery data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
      setSkus(generateDemoData());
    } finally {
      setIsLoading(false);
    }
  }, [seasonId, brandId, storeGroup, useDemoData]);

  return {
    matrix,
    pendingEdits,
    isLoading,
    isSaving,
    error,
    summary,
    updateCell,
    saveChanges,
    resetChanges,
    refresh,
  };
}

export default useDeliveryPlanning;
