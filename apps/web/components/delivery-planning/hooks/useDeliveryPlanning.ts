'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DeliveryMatrix,
  SKUDeliveryPlan,
  DeliveryCellEdit,
  DEFAULT_STORES,
  DELIVERY_MONTHS,
} from '../types';

// Demo data from Excel (W25_DAFC_proposal)
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
    // Random distribution across stores and months (matching Excel pattern)
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
      totalValue: total * 50000000, // ~50M VND per unit
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

interface UseDeliveryPlanningOptions {
  proposalId?: string;
  seasonId?: string;
}

interface UseDeliveryPlanningReturn {
  matrix: DeliveryMatrix;
  pendingEdits: DeliveryCellEdit[];
  isLoading: boolean;
  isSaving: boolean;
  updateCell: (edit: DeliveryCellEdit) => void;
  saveChanges: () => Promise<void>;
  resetChanges: () => void;
  refresh: () => void;
}

export function useDeliveryPlanning(
  options: UseDeliveryPlanningOptions = {}
): UseDeliveryPlanningReturn {
  const [skus, setSkus] = useState<SKUDeliveryPlan[]>(generateDemoData);
  const [pendingEdits, setPendingEdits] = useState<DeliveryCellEdit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const saveChanges = useCallback(async () => {
    setIsSaving(true);

    // Apply pending edits to SKUs
    setSkus((prev) =>
      prev.map((sku) => {
        const edits = pendingEdits.filter((e) => e.skuId === sku.skuId);
        if (edits.length === 0) return sku;

        const newByStore = { ...sku.byStore };
        const newByMonth = { ...sku.byMonth };

        edits.forEach((edit) => {
          // Update byStore
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

          // Update byMonth
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

    setPendingEdits([]);

    // TODO: Replace with real API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
  }, [pendingEdits]);

  const resetChanges = useCallback(() => {
    setPendingEdits([]);
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    // TODO: Replace with real API call
    setTimeout(() => {
      setSkus(generateDemoData());
      setPendingEdits([]);
      setIsLoading(false);
    }, 500);
  }, []);

  return {
    matrix,
    pendingEdits,
    isLoading,
    isSaving,
    updateCell,
    saveChanges,
    resetChanges,
    refresh,
  };
}

export default useDeliveryPlanning;
