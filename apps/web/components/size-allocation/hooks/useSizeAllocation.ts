import { useState, useMemo, useCallback } from 'react';
import {
  ChoiceAllocationData,
  ChoiceSummary,
  SizeQuantity,
  ChoiceType,
  DEFAULT_SIZE_TEMPLATES,
} from '../types';

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
}

interface UseSizeAllocationReturn {
  allocations: ChoiceAllocationData[];
  summaries: ChoiceSummary[];
  isLoading: boolean;
  error: Error | null;
  sizeTemplates: typeof DEFAULT_SIZE_TEMPLATES;
  updateAllocation: (id: string, sizes: SizeQuantity[]) => void;
  lockAllocation: (id: string) => void;
  unlockAllocation: (id: string) => void;
  applyTemplate: (id: string, templateId: string) => void;
  getByChoice: (choice: ChoiceType) => ChoiceAllocationData[];
}

export function useSizeAllocation(
  options: UseSizeAllocationOptions = {}
): UseSizeAllocationReturn {
  const [allocations, setAllocations] = useState<ChoiceAllocationData[]>(
    generateDemoAllocations()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Calculate summaries for each choice
  const summaries = useMemo<ChoiceSummary[]>(() => {
    const choices: ChoiceType[] = ['A', 'B', 'C'];
    const grandTotal = allocations.reduce((sum, a) => sum + a.grandTotal, 0);
    const unitPrice = 500; // Demo unit price

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

  const updateAllocation = useCallback((id: string, sizes: SizeQuantity[]) => {
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
  }, []);

  const lockAllocation = useCallback((id: string) => {
    setAllocations((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, isLocked: true, status: 'confirmed' } : a
      )
    );
  }, []);

  const unlockAllocation = useCallback((id: string) => {
    setAllocations((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, isLocked: false, status: 'allocated' } : a
      )
    );
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
          // Distribute 60% A, 30% B, 10% C
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

  const getByChoice = useCallback(
    (choice: ChoiceType) => {
      return allocations.filter(
        (a) => (choice === 'A' ? a.totalA : choice === 'B' ? a.totalB : a.totalC) > 0
      );
    },
    [allocations]
  );

  return {
    allocations,
    summaries,
    isLoading,
    error,
    sizeTemplates: DEFAULT_SIZE_TEMPLATES,
    updateAllocation,
    lockAllocation,
    unlockAllocation,
    applyTemplate,
    getByChoice,
  };
}

export default useSizeAllocation;
