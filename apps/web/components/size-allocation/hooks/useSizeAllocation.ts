'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { sizeAllocationApi } from '@/lib/api-client';
import type {
  SizeAllocation as ApiSizeAllocation,
  SizeAllocationSummary as ApiSizeAllocationSummary,
  SizeProfile as ApiSizeProfile,
  BatchOperationResult,
} from '@/lib/api-types';
import {
  ChoiceAllocationData,
  ChoiceSummary,
  SizeQuantity,
  ChoiceType,
  DEFAULT_SIZE_TEMPLATES,
} from '../types';

// Map API response to internal format
const mapApiToInternal = (apiAllocs: ApiSizeAllocation[], skuId: string): ChoiceAllocationData => {
  const sizes: SizeQuantity[] = [];
  let totalA = 0, totalB = 0, totalC = 0;

  // Group by size
  const sizeGroups = new Map<string, { A: number; B: number; C: number }>();

  apiAllocs.forEach((alloc) => {
    const current = sizeGroups.get(alloc.sizeCode) || { A: 0, B: 0, C: 0 };
    current[alloc.choice] = alloc.quantity;
    sizeGroups.set(alloc.sizeCode, current);
  });

  sizeGroups.forEach((values, size) => {
    const total = values.A + values.B + values.C;
    sizes.push({
      size,
      qtyA: values.A,
      qtyB: values.B,
      qtyC: values.C,
      total,
      percentage: 0, // Will be calculated
    });
    totalA += values.A;
    totalB += values.B;
    totalC += values.C;
  });

  const grandTotal = totalA + totalB + totalC;

  // Calculate percentages
  sizes.forEach((s) => {
    s.percentage = grandTotal > 0 ? (s.total / grandTotal) * 100 : 0;
  });

  const firstAlloc = apiAllocs[0];

  return {
    id: `alloc-${skuId}`,
    skuId,
    skuCode: firstAlloc?.skuId || skuId,
    productName: `SKU ${skuId}`,
    category: 'Unknown',
    gender: 'Unisex',
    totalA,
    totalB,
    totalC,
    grandTotal,
    sizes,
    status: 'allocated',
    isLocked: false,
  };
};

// Demo data matching Excel format: QTY A, QTY B, QTY C
const generateDemoAllocations = (): ChoiceAllocationData[] => [
  {
    id: 'alloc-1',
    skuId: 'sku-001',
    skuCode: 'REX-M-OUT-001',
    productName: 'Classic Bomber Jacket',
    category: 'Outerwear',
    gender: 'Male',
    totalA: 280,
    totalB: 150,
    totalC: 70,
    grandTotal: 500,
    sizes: [
      { size: 'S', qtyA: 28, qtyB: 15, qtyC: 7, total: 50, percentage: 10 },
      { size: 'M', qtyA: 84, qtyB: 45, qtyC: 21, total: 150, percentage: 30 },
      { size: 'L', qtyA: 84, qtyB: 45, qtyC: 21, total: 150, percentage: 30 },
      { size: 'XL', qtyA: 56, qtyB: 30, qtyC: 14, total: 100, percentage: 20 },
      { size: 'XXL', qtyA: 28, qtyB: 15, qtyC: 7, total: 50, percentage: 10 },
    ],
    status: 'allocated',
    isLocked: false,
  },
  {
    id: 'alloc-2',
    skuId: 'sku-002',
    skuCode: 'REX-M-TOP-012',
    productName: 'Premium Polo Shirt',
    category: 'Tops',
    gender: 'Male',
    totalA: 480,
    totalB: 240,
    totalC: 80,
    grandTotal: 800,
    sizes: [
      { size: 'XS', qtyA: 24, qtyB: 12, qtyC: 4, total: 40, percentage: 5 },
      { size: 'S', qtyA: 72, qtyB: 36, qtyC: 12, total: 120, percentage: 15 },
      { size: 'M', qtyA: 144, qtyB: 72, qtyC: 24, total: 240, percentage: 30 },
      { size: 'L', qtyA: 144, qtyB: 72, qtyC: 24, total: 240, percentage: 30 },
      { size: 'XL', qtyA: 72, qtyB: 36, qtyC: 12, total: 120, percentage: 15 },
      { size: 'XXL', qtyA: 24, qtyB: 12, qtyC: 4, total: 40, percentage: 5 },
    ],
    status: 'confirmed',
    isLocked: true,
  },
  {
    id: 'alloc-3',
    skuId: 'sku-003',
    skuCode: 'REX-F-TOP-025',
    productName: 'Silk Blouse',
    category: 'Tops',
    gender: 'Female',
    totalA: 200,
    totalB: 120,
    totalC: 80,
    grandTotal: 400,
    sizes: [
      { size: 'XS', qtyA: 20, qtyB: 12, qtyC: 8, total: 40, percentage: 10 },
      { size: 'S', qtyA: 50, qtyB: 30, qtyC: 20, total: 100, percentage: 25 },
      { size: 'M', qtyA: 60, qtyB: 36, qtyC: 24, total: 120, percentage: 30 },
      { size: 'L', qtyA: 50, qtyB: 30, qtyC: 20, total: 100, percentage: 25 },
      { size: 'XL', qtyA: 20, qtyB: 12, qtyC: 8, total: 40, percentage: 10 },
    ],
    status: 'draft',
    isLocked: false,
  },
  {
    id: 'alloc-4',
    skuId: 'sku-004',
    skuCode: 'REX-U-ACC-003',
    productName: 'Leather Belt',
    category: 'Accessories',
    gender: 'Unisex',
    totalA: 180,
    totalB: 90,
    totalC: 30,
    grandTotal: 300,
    sizes: [
      { size: 'S', qtyA: 36, qtyB: 18, qtyC: 6, total: 60, percentage: 20 },
      { size: 'M', qtyA: 72, qtyB: 36, qtyC: 12, total: 120, percentage: 40 },
      { size: 'L', qtyA: 54, qtyB: 27, qtyC: 9, total: 90, percentage: 30 },
      { size: 'XL', qtyA: 18, qtyB: 9, qtyC: 3, total: 30, percentage: 10 },
    ],
    status: 'allocated',
    isLocked: false,
  },
];

interface UseSizeAllocationOptions {
  skuId?: string;
  proposalId?: string;
  brandId?: string;
  seasonId?: string;
  categoryId?: string;
  useDemoData?: boolean;
}

interface UseSizeAllocationReturn {
  allocations: ChoiceAllocationData[];
  summaries: ChoiceSummary[];
  profiles: ApiSizeProfile[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  sizeTemplates: typeof DEFAULT_SIZE_TEMPLATES;
  updateAllocation: (id: string, sizes: SizeQuantity[]) => Promise<boolean>;
  lockAllocation: (id: string) => Promise<boolean>;
  unlockAllocation: (id: string) => Promise<boolean>;
  applyTemplate: (id: string, templateId: string) => void;
  applyProfile: (skuIds: string[], profileId: string, totalQuantity: number) => Promise<BatchOperationResult | null>;
  getByChoice: (choice: ChoiceType) => ChoiceAllocationData[];
  refresh: () => Promise<void>;
}

export function useSizeAllocation(
  options: UseSizeAllocationOptions = {}
): UseSizeAllocationReturn {
  const { skuId, proposalId, brandId, seasonId, categoryId, useDemoData = false } = options;

  const [allocations, setAllocations] = useState<ChoiceAllocationData[]>([]);
  const [profiles, setProfiles] = useState<ApiSizeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount and when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (useDemoData) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setAllocations(generateDemoAllocations());
        } else {
          const [allocResponse, profilesResponse] = await Promise.all([
            sizeAllocationApi.getAll({ skuId }),
            sizeAllocationApi.getProfiles({ categoryId, seasonId }),
          ]);

          if (allocResponse.success && allocResponse.data) {
            // Group allocations by SKU and convert
            const grouped = new Map<string, ApiSizeAllocation[]>();
            allocResponse.data.data.forEach((alloc) => {
              const list = grouped.get(alloc.skuId) || [];
              list.push(alloc);
              grouped.set(alloc.skuId, list);
            });

            const converted: ChoiceAllocationData[] = [];
            grouped.forEach((allocs, skuId) => {
              converted.push(mapApiToInternal(allocs, skuId));
            });

            setAllocations(converted.length > 0 ? converted : generateDemoAllocations());
          } else {
            setAllocations(generateDemoAllocations());
          }

          if (profilesResponse.success && profilesResponse.data) {
            setProfiles(profilesResponse.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch size allocation data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setAllocations(generateDemoAllocations());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [skuId, proposalId, brandId, seasonId, categoryId, useDemoData]);

  // Calculate summaries for each choice
  const summaries = useMemo<ChoiceSummary[]>(() => {
    const choices: ChoiceType[] = ['A', 'B', 'C'];
    const grandTotal = allocations.reduce((sum, a) => sum + a.grandTotal, 0);
    const unitPrice = 500;

    return choices.map((choice) => {
      const totalUnits = allocations.reduce(
        (sum, a) => sum + (choice === 'A' ? a.totalA : choice === 'B' ? a.totalB : a.totalC),
        0
      );
      return {
        choice,
        totalUnits,
        totalValue: totalUnits * unitPrice,
        percentage: grandTotal > 0 ? (totalUnits / grandTotal) * 100 : 0,
        skuCount: allocations.filter(
          (a) => (choice === 'A' ? a.totalA : choice === 'B' ? a.totalB : a.totalC) > 0
        ).length,
      };
    });
  }, [allocations]);

  const updateAllocation = useCallback(async (id: string, sizes: SizeQuantity[]): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      // Optimistic update
      setAllocations((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;

          const totalA = sizes.reduce((sum, s) => sum + s.qtyA, 0);
          const totalB = sizes.reduce((sum, s) => sum + s.qtyB, 0);
          const totalC = sizes.reduce((sum, s) => sum + s.qtyC, 0);

          return {
            ...a,
            sizes,
            totalA,
            totalB,
            totalC,
            grandTotal: totalA + totalB + totalC,
            lastModified: new Date(),
          };
        })
      );

      if (!useDemoData) {
        const alloc = allocations.find((a) => a.id === id);
        if (!alloc) throw new Error('Allocation not found');

        // Create batch update
        const updates = sizes.flatMap((s) => [
          { id: `${id}-${s.size}-A`, quantity: s.qtyA, choice: 'A' as const },
          { id: `${id}-${s.size}-B`, quantity: s.qtyB, choice: 'B' as const },
          { id: `${id}-${s.size}-C`, quantity: s.qtyC, choice: 'C' as const },
        ]);

        const response = await sizeAllocationApi.batchUpdate({ allocations: updates });

        if (!response.success) {
          throw new Error(response.error || 'Failed to update allocation');
        }
      }

      return true;
    } catch (err) {
      console.error('Failed to update allocation:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [allocations, useDemoData]);

  const lockAllocation = useCallback(async (id: string): Promise<boolean> => {
    setIsSaving(true);

    try {
      setAllocations((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, isLocked: true, status: 'confirmed' } : a
        )
      );

      // API call would go here for locking

      return true;
    } catch (err) {
      console.error('Failed to lock allocation:', err);
      setError(err instanceof Error ? err.message : 'Failed to lock');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const unlockAllocation = useCallback(async (id: string): Promise<boolean> => {
    setIsSaving(true);

    try {
      setAllocations((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, isLocked: false, status: 'allocated' } : a
        )
      );

      // API call would go here for unlocking

      return true;
    } catch (err) {
      console.error('Failed to unlock allocation:', err);
      setError(err instanceof Error ? err.message : 'Failed to unlock');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const applyTemplate = useCallback((id: string, templateId: string) => {
    const template = DEFAULT_SIZE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setAllocations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;

        const totalQty = a.grandTotal;
        const sizes: SizeQuantity[] = template.sizes.map((size) => {
          const pct = template.defaultDistribution[size] || 0;
          const sizeTotal = Math.round((pct / 100) * totalQty);
          const qtyA = Math.round(sizeTotal * 0.6);
          const qtyB = Math.round(sizeTotal * 0.3);
          const qtyC = sizeTotal - qtyA - qtyB;
          return {
            size,
            qtyA,
            qtyB,
            qtyC,
            total: sizeTotal,
            percentage: pct,
          };
        });

        const totalA = sizes.reduce((sum, s) => sum + s.qtyA, 0);
        const totalB = sizes.reduce((sum, s) => sum + s.qtyB, 0);
        const totalC = sizes.reduce((sum, s) => sum + s.qtyC, 0);

        return {
          ...a,
          sizes,
          totalA,
          totalB,
          totalC,
          grandTotal: totalA + totalB + totalC,
        };
      })
    );
  }, []);

  const applyProfile = useCallback(async (
    skuIds: string[],
    profileId: string,
    totalQuantity: number
  ): Promise<BatchOperationResult | null> => {
    setIsSaving(true);
    setError(null);

    try {
      if (!useDemoData) {
        const response = await sizeAllocationApi.applyProfile({
          skuIds,
          profileId,
          totalQuantity,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to apply profile');
        }

        return response.data || { success: true, processed: skuIds.length, failed: 0 };
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      return { success: true, processed: skuIds.length, failed: 0 };
    } catch (err) {
      console.error('Failed to apply profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply profile');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [useDemoData]);

  const getByChoice = useCallback(
    (choice: ChoiceType) => {
      return allocations.filter(
        (a) => (choice === 'A' ? a.totalA : choice === 'B' ? a.totalB : a.totalC) > 0
      );
    },
    [allocations]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useDemoData) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setAllocations(generateDemoAllocations());
      } else {
        const response = await sizeAllocationApi.getAll({ skuId });

        if (response.success && response.data) {
          const grouped = new Map<string, ApiSizeAllocation[]>();
          response.data.data.forEach((alloc) => {
            const list = grouped.get(alloc.skuId) || [];
            list.push(alloc);
            grouped.set(alloc.skuId, list);
          });

          const converted: ChoiceAllocationData[] = [];
          grouped.forEach((allocs, skuId) => {
            converted.push(mapApiToInternal(allocs, skuId));
          });

          setAllocations(converted.length > 0 ? converted : generateDemoAllocations());
        } else {
          setAllocations(generateDemoAllocations());
        }
      }
    } catch (err) {
      console.error('Failed to refresh size allocation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [skuId, useDemoData]);

  return {
    allocations,
    summaries,
    profiles,
    isLoading,
    isSaving,
    error,
    sizeTemplates: DEFAULT_SIZE_TEMPLATES,
    updateAllocation,
    lockAllocation,
    unlockAllocation,
    applyTemplate,
    applyProfile,
    getByChoice,
    refresh,
  };
}

export default useSizeAllocation;
