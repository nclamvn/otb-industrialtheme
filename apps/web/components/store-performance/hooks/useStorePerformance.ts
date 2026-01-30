import { useState, useMemo, useCallback } from 'react';
import {
  StorePerformanceData,
  StoreComparisonData,
  StorePerformanceSummary,
  StoreGroup,
} from '../types';

// Demo data matching Excel format: %ST REX, %ST TTP
const generateDemoComparisons = (): StoreComparisonData[] => [
  {
    sku: { id: 'sku-1', code: 'REX-M-OUT-001', name: 'Classic Bomber Jacket' },
    rex: {
      id: 'rex-1',
      storeGroup: 'REX',
      sellThruPercent: 0.72,
      sellThruChange: '72% - 65%',
      qtyReceived: 500,
      qtySold: 360,
      qtyOnHand: 140,
      salesValue: 180000,
      salesUnits: 360,
      trend: 'up',
    },
    ttp: {
      id: 'ttp-1',
      storeGroup: 'TTP',
      sellThruPercent: 0.58,
      sellThruChange: '58% - 52%',
      qtyReceived: 400,
      qtySold: 232,
      qtyOnHand: 168,
      salesValue: 116000,
      salesUnits: 232,
      trend: 'stable',
    },
    variance: {
      sellThru: 0.14,
      salesUnits: 128,
      salesValue: 64000,
    },
  },
  {
    sku: { id: 'sku-2', code: 'REX-M-TOP-012', name: 'Premium Polo Shirt' },
    rex: {
      id: 'rex-2',
      storeGroup: 'REX',
      sellThruPercent: 0.85,
      sellThruChange: '85% - 78%',
      qtyReceived: 800,
      qtySold: 680,
      qtyOnHand: 120,
      salesValue: 340000,
      salesUnits: 680,
      trend: 'up',
    },
    ttp: {
      id: 'ttp-2',
      storeGroup: 'TTP',
      sellThruPercent: 0.65,
      sellThruChange: '65% - 60%',
      qtyReceived: 600,
      qtySold: 390,
      qtyOnHand: 210,
      salesValue: 195000,
      salesUnits: 390,
      trend: 'down',
    },
    variance: {
      sellThru: 0.20,
      salesUnits: 290,
      salesValue: 145000,
    },
  },
  {
    sku: { id: 'sku-3', code: 'REX-M-BOT-008', name: 'Slim Fit Chinos' },
    rex: {
      id: 'rex-3',
      storeGroup: 'REX',
      sellThruPercent: 0.45,
      sellThruChange: '45% - 50%',
      qtyReceived: 600,
      qtySold: 270,
      qtyOnHand: 330,
      salesValue: 135000,
      salesUnits: 270,
      trend: 'down',
    },
    ttp: {
      id: 'ttp-3',
      storeGroup: 'TTP',
      sellThruPercent: 0.62,
      sellThruChange: '62% - 55%',
      qtyReceived: 500,
      qtySold: 310,
      qtyOnHand: 190,
      salesValue: 155000,
      salesUnits: 310,
      trend: 'up',
    },
    variance: {
      sellThru: -0.17,
      salesUnits: -40,
      salesValue: -20000,
    },
  },
  {
    sku: { id: 'sku-4', code: 'REX-M-ACC-003', name: 'Leather Belt' },
    rex: {
      id: 'rex-4',
      storeGroup: 'REX',
      sellThruPercent: 0.55,
      sellThruChange: '55% - 55%',
      qtyReceived: 300,
      qtySold: 165,
      qtyOnHand: 135,
      salesValue: 49500,
      salesUnits: 165,
      trend: 'stable',
    },
    ttp: {
      id: 'ttp-4',
      storeGroup: 'TTP',
      sellThruPercent: 0.54,
      sellThruChange: '54% - 52%',
      qtyReceived: 250,
      qtySold: 135,
      qtyOnHand: 115,
      salesValue: 40500,
      salesUnits: 135,
      trend: 'stable',
    },
    variance: {
      sellThru: 0.01,
      salesUnits: 30,
      salesValue: 9000,
    },
  },
  {
    sku: { id: 'sku-5', code: 'REX-F-TOP-025', name: 'Silk Blouse' },
    rex: {
      id: 'rex-5',
      storeGroup: 'REX',
      sellThruPercent: 0.78,
      sellThruChange: '78% - 70%',
      qtyReceived: 400,
      qtySold: 312,
      qtyOnHand: 88,
      salesValue: 234000,
      salesUnits: 312,
      trend: 'up',
    },
    ttp: {
      id: 'ttp-5',
      storeGroup: 'TTP',
      sellThruPercent: 0.82,
      sellThruChange: '82% - 75%',
      qtyReceived: 350,
      qtySold: 287,
      qtyOnHand: 63,
      salesValue: 215250,
      salesUnits: 287,
      trend: 'up',
    },
    variance: {
      sellThru: -0.04,
      salesUnits: 25,
      salesValue: 18750,
    },
  },
];

interface UseStorePerformanceOptions {
  skuId?: string;
  seasonId?: string;
}

interface UseStorePerformanceReturn {
  comparisons: StoreComparisonData[];
  summaries: {
    rex: StorePerformanceSummary;
    ttp: StorePerformanceSummary;
  };
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  getComparisonBySku: (skuId: string) => StoreComparisonData | undefined;
  getTopPerformers: (storeGroup: StoreGroup, limit?: number) => StorePerformanceData[];
  getBottomPerformers: (storeGroup: StoreGroup, limit?: number) => StorePerformanceData[];
}

export function useStorePerformance(
  options: UseStorePerformanceOptions = {}
): UseStorePerformanceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Demo data - replace with API call
  const comparisons = useMemo(() => generateDemoComparisons(), []);

  // Calculate summaries
  const summaries = useMemo(() => {
    const rexData = comparisons.map((c) => c.rex);
    const ttpData = comparisons.map((c) => c.ttp);

    const calculateSummary = (
      data: StorePerformanceData[],
      storeGroup: StoreGroup
    ): StorePerformanceSummary => {
      const sorted = [...data].sort((a, b) => b.sellThruPercent - a.sellThruPercent);
      const avgSellThru = data.reduce((sum, d) => sum + d.sellThruPercent, 0) / data.length;
      const totalSalesValue = data.reduce((sum, d) => sum + d.salesValue, 0);
      const totalSalesUnits = data.reduce((sum, d) => sum + d.salesUnits, 0);

      return {
        storeGroup,
        totalSKUs: data.length,
        avgSellThru,
        totalSalesValue,
        totalSalesUnits,
        topPerformers: sorted.slice(0, 3),
        bottomPerformers: sorted.slice(-3).reverse(),
      };
    };

    return {
      rex: calculateSummary(rexData, 'REX'),
      ttp: calculateSummary(ttpData, 'TTP'),
    };
  }, [comparisons]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    // TODO: Replace with real API call
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const getComparisonBySku = useCallback(
    (skuId: string) => {
      return comparisons.find((c) => c.sku.id === skuId);
    },
    [comparisons]
  );

  const getTopPerformers = useCallback(
    (storeGroup: StoreGroup, limit = 5) => {
      const data = storeGroup === 'REX'
        ? comparisons.map((c) => c.rex)
        : comparisons.map((c) => c.ttp);
      return [...data]
        .sort((a, b) => b.sellThruPercent - a.sellThruPercent)
        .slice(0, limit);
    },
    [comparisons]
  );

  const getBottomPerformers = useCallback(
    (storeGroup: StoreGroup, limit = 5) => {
      const data = storeGroup === 'REX'
        ? comparisons.map((c) => c.rex)
        : comparisons.map((c) => c.ttp);
      return [...data]
        .sort((a, b) => a.sellThruPercent - b.sellThruPercent)
        .slice(0, limit);
    },
    [comparisons]
  );

  return {
    comparisons,
    summaries,
    isLoading,
    error,
    refresh,
    getComparisonBySku,
    getTopPerformers,
    getBottomPerformers,
  };
}

export default useStorePerformance;
