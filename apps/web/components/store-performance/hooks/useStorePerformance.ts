'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { storePerformanceApi } from '@/lib/api-client';
import type {
  StorePerformanceData as ApiStorePerformanceData,
  StoreGroupSummary as ApiStoreGroupSummary,
  StorePerformanceFilters,
} from '@/lib/api-types';
import {
  StorePerformanceData,
  StoreComparisonData,
  StorePerformanceSummary,
  StoreGroup,
} from '../types';

// Map API response to internal format
const mapApiToInternal = (apiData: ApiStorePerformanceData): StorePerformanceData => {
  return {
    id: apiData.id,
    storeGroup: apiData.storeGroup as StoreGroup,
    sellThruPercent: apiData.sellThruPercent,
    sellThruChange: `${(apiData.sellThruPercent * 100).toFixed(0)}% - ${((apiData.sellThruPercent - apiData.trendPercent) * 100).toFixed(0)}%`,
    qtyReceived: apiData.qtyReceived,
    qtySold: apiData.qtySold,
    qtyOnHand: apiData.qtyOnHand,
    salesValue: apiData.salesValue,
    salesUnits: apiData.salesUnits,
    trend: apiData.trend,
  };
};

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
  brandId?: string;
  categoryId?: string;
  periodStart?: string;
  periodEnd?: string;
  useDemoData?: boolean;
}

interface UseStorePerformanceReturn {
  comparisons: StoreComparisonData[];
  summary: {
    rex: StorePerformanceSummary;
    ttp: StorePerformanceSummary;
    dafc?: StorePerformanceSummary;
  };
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getComparisonBySku: (skuId: string) => StoreComparisonData | undefined;
  getTopPerformers: (storeGroup: StoreGroup, limit?: number) => Promise<StorePerformanceData[]>;
  getBottomPerformers: (storeGroup: StoreGroup, limit?: number) => Promise<StorePerformanceData[]>;
  compareStores: (storeIds: string[]) => Promise<void>;
}

export function useStorePerformance(
  options: UseStorePerformanceOptions = {}
): UseStorePerformanceReturn {
  const {
    skuId,
    seasonId,
    brandId,
    categoryId,
    periodStart,
    periodEnd,
    useDemoData = false,
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<StoreComparisonData[]>([]);
  const [apiSummary, setApiSummary] = useState<{
    rex: ApiStoreGroupSummary;
    ttp: ApiStoreGroupSummary;
    dafc: ApiStoreGroupSummary;
  } | null>(null);

  // Fetch data on mount and when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (useDemoData) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setComparisons(generateDemoComparisons());
        } else {
          const filters: StorePerformanceFilters = {
            seasonId,
            brandId,
            categoryId,
            periodStart,
            periodEnd,
          };

          const [summaryResponse, rexResponse, ttpResponse] = await Promise.all([
            storePerformanceApi.getGroupSummary(filters),
            storePerformanceApi.getByStoreGroup('REX', filters),
            storePerformanceApi.getByStoreGroup('TTP', filters),
          ]);

          if (summaryResponse.success && summaryResponse.data) {
            setApiSummary(summaryResponse.data);
          }

          // Build comparisons from separate store group data
          if (rexResponse.success && ttpResponse.success && rexResponse.data && ttpResponse.data) {
            const rexData = rexResponse.data.map(mapApiToInternal);
            const ttpData = ttpResponse.data.map(mapApiToInternal);

            // Match by some identifier (assuming storeId or similar)
            const comparisonData: StoreComparisonData[] = rexData.map((rex, index) => {
              const ttp = ttpData[index] || ttpData[0];
              return {
                sku: { id: `sku-${index}`, code: rex.id, name: `SKU ${index + 1}` },
                rex,
                ttp,
                variance: {
                  sellThru: rex.sellThruPercent - ttp.sellThruPercent,
                  salesUnits: rex.salesUnits - ttp.salesUnits,
                  salesValue: rex.salesValue - ttp.salesValue,
                },
              };
            });

            setComparisons(comparisonData);
          } else {
            // Fall back to demo data
            setComparisons(generateDemoComparisons());
          }
        }
      } catch (err) {
        console.error('Failed to fetch store performance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setComparisons(generateDemoComparisons());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [skuId, seasonId, brandId, categoryId, periodStart, periodEnd, useDemoData]);

  // Calculate summaries from comparisons or API data
  const summary = useMemo(() => {
    if (apiSummary) {
      const mapSummary = (apiSum: ApiStoreGroupSummary, group: StoreGroup): StorePerformanceSummary => ({
        storeGroup: group,
        totalSKUs: apiSum.storeCount,
        avgSellThru: apiSum.avgSellThru,
        totalSalesValue: apiSum.totalSalesValue,
        totalSalesUnits: apiSum.totalSalesUnits,
        topPerformers: [],
        bottomPerformers: [],
      });

      return {
        rex: mapSummary(apiSummary.rex, 'REX'),
        ttp: mapSummary(apiSummary.ttp, 'TTP'),
        dafc: mapSummary(apiSummary.dafc, 'DAFC'),
      };
    }

    // Calculate from comparison data
    const rexData = comparisons.map((c) => c.rex);
    const ttpData = comparisons.map((c) => c.ttp);

    const calculateSummary = (
      data: StorePerformanceData[],
      storeGroup: StoreGroup
    ): StorePerformanceSummary => {
      if (data.length === 0) {
        return {
          storeGroup,
          totalSKUs: 0,
          avgSellThru: 0,
          totalSalesValue: 0,
          totalSalesUnits: 0,
          topPerformers: [],
          bottomPerformers: [],
        };
      }

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
  }, [comparisons, apiSummary]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useDemoData) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setComparisons(generateDemoComparisons());
      } else {
        const filters: StorePerformanceFilters = {
          seasonId,
          brandId,
          categoryId,
          periodStart,
          periodEnd,
        };

        const summaryResponse = await storePerformanceApi.getGroupSummary(filters);

        if (summaryResponse.success && summaryResponse.data) {
          setApiSummary(summaryResponse.data);
        }
      }
    } catch (err) {
      console.error('Failed to refresh store performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [seasonId, brandId, categoryId, periodStart, periodEnd, useDemoData]);

  const getComparisonBySku = useCallback(
    (skuId: string) => {
      return comparisons.find((c) => c.sku.id === skuId);
    },
    [comparisons]
  );

  const getTopPerformers = useCallback(
    async (storeGroup: StoreGroup, limit = 5): Promise<StorePerformanceData[]> => {
      if (useDemoData) {
        const data = storeGroup === 'REX'
          ? comparisons.map((c) => c.rex)
          : comparisons.map((c) => c.ttp);
        return [...data]
          .sort((a, b) => b.sellThruPercent - a.sellThruPercent)
          .slice(0, limit);
      }

      try {
        const response = await storePerformanceApi.getTopPerformers({
          storeGroup: storeGroup as any,
          limit,
          seasonId,
          brandId,
          categoryId,
        });

        if (response.success && response.data) {
          return response.data.map(mapApiToInternal);
        }
      } catch (err) {
        console.error('Failed to fetch top performers:', err);
      }

      // Fall back to local calculation
      const data = storeGroup === 'REX'
        ? comparisons.map((c) => c.rex)
        : comparisons.map((c) => c.ttp);
      return [...data]
        .sort((a, b) => b.sellThruPercent - a.sellThruPercent)
        .slice(0, limit);
    },
    [comparisons, seasonId, brandId, categoryId, useDemoData]
  );

  const getBottomPerformers = useCallback(
    async (storeGroup: StoreGroup, limit = 5): Promise<StorePerformanceData[]> => {
      if (useDemoData) {
        const data = storeGroup === 'REX'
          ? comparisons.map((c) => c.rex)
          : comparisons.map((c) => c.ttp);
        return [...data]
          .sort((a, b) => a.sellThruPercent - b.sellThruPercent)
          .slice(0, limit);
      }

      try {
        const response = await storePerformanceApi.getBottomPerformers({
          storeGroup: storeGroup as any,
          limit,
          seasonId,
          brandId,
          categoryId,
        });

        if (response.success && response.data) {
          return response.data.map(mapApiToInternal);
        }
      } catch (err) {
        console.error('Failed to fetch bottom performers:', err);
      }

      // Fall back to local calculation
      const data = storeGroup === 'REX'
        ? comparisons.map((c) => c.rex)
        : comparisons.map((c) => c.ttp);
      return [...data]
        .sort((a, b) => a.sellThruPercent - b.sellThruPercent)
        .slice(0, limit);
    },
    [comparisons, seasonId, brandId, categoryId, useDemoData]
  );

  const compareStores = useCallback(
    async (storeIds: string[]) => {
      if (useDemoData || storeIds.length === 0) return;

      try {
        const response = await storePerformanceApi.compareStores(storeIds, {
          periodStart,
          periodEnd,
        });

        if (response.success && response.data) {
          // Handle comparison data
          console.log('Store comparison:', response.data);
        }
      } catch (err) {
        console.error('Failed to compare stores:', err);
      }
    },
    [periodStart, periodEnd, useDemoData]
  );

  return {
    comparisons,
    summary,
    isLoading,
    error,
    refresh,
    getComparisonBySku,
    getTopPerformers,
    getBottomPerformers,
    compareStores,
  };
}

export default useStorePerformance;
