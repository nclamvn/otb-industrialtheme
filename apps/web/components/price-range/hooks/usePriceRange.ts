'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { priceRangeApi } from '@/lib/api-client';
import type {
  PriceRange as ApiPriceRange,
  PriceRangeDistribution as ApiPriceRangeDistribution,
  PriceAnalysis as ApiPriceAnalysis,
  PriceRangeFilters,
} from '@/lib/api-types';
import {
  PriceRangeAnalysis,
  PriceRangeData,
  PriceRangeSKU,
  DEFAULT_PRICE_RANGES,
  getPriceRange,
} from '../types';

// Map API response to internal format
const mapApiAnalysisToInternal = (apiAnalysis: ApiPriceAnalysis, seasonId: string): PriceRangeAnalysis => {
  const ranges: PriceRangeData[] = apiAnalysis.distribution.map((dist) => {
    const matchingRange = DEFAULT_PRICE_RANGES.find((r) => r.id === dist.rangeCode) || DEFAULT_PRICE_RANGES[0];
    return {
      range: matchingRange,
      skuCount: dist.skuCount,
      totalUnits: dist.totalQuantity,
      totalValue: dist.totalValue,
      avgPrice: dist.avgPrice,
      percentage: dist.percentage,
      sellThruPercent: 0, // Would come from additional API data
      marginPercent: 0,   // Would come from additional API data
    };
  });

  return {
    id: `analysis-${seasonId}`,
    seasonId,
    seasonName: seasonId.toUpperCase(),
    categoryId: 'all',
    categoryName: 'All Categories',
    totalSKUs: apiAnalysis.totalSKUs,
    totalUnits: ranges.reduce((sum, r) => sum + r.totalUnits, 0),
    totalValue: ranges.reduce((sum, r) => sum + r.totalValue, 0),
    avgPrice: apiAnalysis.avgPrice,
    ranges,
    priceDistribution: 'balanced',
    recommendation: '',
    lastUpdated: new Date(),
  };
};

// Demo data matching Excel price range analysis
const generateDemoAnalysis = (): PriceRangeAnalysis => ({
  id: 'analysis-1',
  seasonId: 'ss26',
  seasonName: 'SS26',
  categoryId: 'all',
  categoryName: 'All Categories',
  totalSKUs: 245,
  totalUnits: 45000,
  totalValue: 67500000000,
  avgPrice: 1500000,
  ranges: [
    {
      range: DEFAULT_PRICE_RANGES[0],
      skuCount: 45,
      totalUnits: 12000,
      totalValue: 4800000000,
      avgPrice: 400000,
      percentage: 26.7,
      sellThruPercent: 78.5,
      marginPercent: 42.0,
    },
    {
      range: DEFAULT_PRICE_RANGES[1],
      skuCount: 95,
      totalUnits: 18000,
      totalValue: 18000000000,
      avgPrice: 1000000,
      percentage: 40.0,
      sellThruPercent: 65.2,
      marginPercent: 48.5,
    },
    {
      range: DEFAULT_PRICE_RANGES[2],
      skuCount: 72,
      totalUnits: 10500,
      totalValue: 23100000000,
      avgPrice: 2200000,
      percentage: 23.3,
      sellThruPercent: 52.8,
      marginPercent: 55.0,
    },
    {
      range: DEFAULT_PRICE_RANGES[3],
      skuCount: 33,
      totalUnits: 4500,
      totalValue: 21600000000,
      avgPrice: 4800000,
      percentage: 10.0,
      sellThruPercent: 38.5,
      marginPercent: 62.5,
    },
  ],
  priceDistribution: 'balanced',
  recommendation: 'Mid-range segment is performing well. Consider expanding premium category with higher margin items.',
  lastUpdated: new Date(),
});

// Demo SKU data
const generateDemoSKUs = (): PriceRangeSKU[] => [
  {
    id: 'sku-1',
    skuCode: 'REX-M-TOP-001',
    productName: 'Basic Cotton T-Shirt',
    category: 'Tops',
    retailPrice: 350000,
    costPrice: 175000,
    marginPercent: 50,
    units: 500,
    unitsSold: 420,
    sellThruPercent: 84,
    priceRangeId: 'budget',
  },
  {
    id: 'sku-2',
    skuCode: 'REX-M-TOP-015',
    productName: 'Premium Polo Shirt',
    category: 'Tops',
    retailPrice: 890000,
    costPrice: 400000,
    marginPercent: 55,
    units: 350,
    unitsSold: 245,
    sellThruPercent: 70,
    priceRangeId: 'mid',
  },
  {
    id: 'sku-3',
    skuCode: 'REX-M-OUT-008',
    productName: 'Leather Jacket',
    category: 'Outerwear',
    retailPrice: 2500000,
    costPrice: 1100000,
    marginPercent: 56,
    units: 150,
    unitsSold: 72,
    sellThruPercent: 48,
    priceRangeId: 'premium',
  },
  {
    id: 'sku-4',
    skuCode: 'REX-M-OUT-025',
    productName: 'Designer Wool Coat',
    category: 'Outerwear',
    retailPrice: 5500000,
    costPrice: 2200000,
    marginPercent: 60,
    units: 80,
    unitsSold: 28,
    sellThruPercent: 35,
    priceRangeId: 'luxury',
  },
];

interface UsePriceRangeOptions {
  seasonId?: string;
  categoryId?: string;
  brandId?: string;
  useDemoData?: boolean;
}

interface UsePriceRangeReturn {
  analysis: PriceRangeAnalysis;
  skus: PriceRangeSKU[];
  distribution: ApiPriceRangeDistribution[];
  isLoading: boolean;
  error: string | null;
  priceRanges: typeof DEFAULT_PRICE_RANGES;
  refresh: () => Promise<void>;
  getSKUsByRange: (rangeId: string) => Promise<PriceRangeSKU[]>;
  categorizeProduct: (price: number) => string;
  compareRanges: (rangeIds: string[]) => Promise<void>;
  getPriceTrend: (weeks?: number) => Promise<{ week: string; avgPrice: number; change: number; changePercent: number }[]>;
}

export function usePriceRange(
  options: UsePriceRangeOptions = {}
): UsePriceRangeReturn {
  const { seasonId, categoryId, brandId, useDemoData = false } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PriceRangeAnalysis>(generateDemoAnalysis());
  const [skus, setSkus] = useState<PriceRangeSKU[]>([]);
  const [distribution, setDistribution] = useState<ApiPriceRangeDistribution[]>([]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (useDemoData) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setAnalysis(generateDemoAnalysis());
          setSkus(generateDemoSKUs());
        } else {
          const filters: PriceRangeFilters = {
            seasonId,
            categoryId,
            brandId,
          };

          const [analysisResponse, distributionResponse] = await Promise.all([
            priceRangeApi.getAnalysis(filters),
            priceRangeApi.getDistribution(filters),
          ]);

          if (analysisResponse.success && analysisResponse.data) {
            setAnalysis(mapApiAnalysisToInternal(analysisResponse.data, seasonId || 'ss26'));
          } else {
            setAnalysis(generateDemoAnalysis());
          }

          if (distributionResponse.success && distributionResponse.data) {
            setDistribution(distributionResponse.data);
          }

          setSkus(generateDemoSKUs()); // SKUs would come from a separate endpoint
        }
      } catch (err) {
        console.error('Failed to fetch price range data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setAnalysis(generateDemoAnalysis());
        setSkus(generateDemoSKUs());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [seasonId, categoryId, brandId, useDemoData]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useDemoData) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setAnalysis(generateDemoAnalysis());
        setSkus(generateDemoSKUs());
      } else {
        const filters: PriceRangeFilters = {
          seasonId,
          categoryId,
          brandId,
        };

        const analysisResponse = await priceRangeApi.getAnalysis(filters);

        if (analysisResponse.success && analysisResponse.data) {
          setAnalysis(mapApiAnalysisToInternal(analysisResponse.data, seasonId || 'ss26'));
        }
      }
    } catch (err) {
      console.error('Failed to refresh price range data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [seasonId, categoryId, brandId, useDemoData]);

  const getSKUsByRange = useCallback(
    async (rangeId: string): Promise<PriceRangeSKU[]> => {
      if (useDemoData) {
        return skus.filter((sku) => sku.priceRangeId === rangeId);
      }

      try {
        // Find the range to get its ID
        const range = DEFAULT_PRICE_RANGES.find((r) => r.id === rangeId);
        if (!range) return [];

        const response = await priceRangeApi.getSKUsByRange(rangeId);

        if (response.success && response.data) {
          return response.data.data.map((sku) => ({
            id: sku.skuId,
            skuCode: sku.skuCode,
            productName: sku.skuName,
            category: sku.category,
            retailPrice: sku.price,
            costPrice: 0,
            marginPercent: 0,
            units: 0,
            unitsSold: 0,
            sellThruPercent: 0,
            priceRangeId: rangeId,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch SKUs by range:', err);
      }

      return skus.filter((sku) => sku.priceRangeId === rangeId);
    },
    [skus, useDemoData]
  );

  const categorizeProduct = useCallback((price: number) => {
    return getPriceRange(price).id;
  }, []);

  const compareRanges = useCallback(
    async (rangeIds: string[]) => {
      if (useDemoData || rangeIds.length === 0) return;

      try {
        const response = await priceRangeApi.compareRanges(rangeIds);

        if (response.success && response.data) {
          console.log('Range comparison:', response.data);
        }
      } catch (err) {
        console.error('Failed to compare ranges:', err);
      }
    },
    [useDemoData]
  );

  const getPriceTrend = useCallback(
    async (weeks = 12): Promise<{ week: string; avgPrice: number; change: number; changePercent: number }[]> => {
      if (useDemoData) {
        // Generate demo trend data
        const data: { week: string; avgPrice: number; change: number; changePercent: number }[] = [];
        let price = 1400000;

        for (let i = weeks; i > 0; i--) {
          const change = (Math.random() - 0.5) * 100000;
          price += change;
          data.push({
            week: `W${i}`,
            avgPrice: Math.round(price),
            change: Math.round(change),
            changePercent: (change / (price - change)) * 100,
          });
        }

        return data.reverse();
      }

      try {
        const response = await priceRangeApi.getPriceTrend({
          seasonId,
          categoryId,
          brandId,
          weeks,
        });

        if (response.success && response.data) {
          return response.data;
        }
      } catch (err) {
        console.error('Failed to fetch price trend:', err);
      }

      return [];
    },
    [seasonId, categoryId, brandId, useDemoData]
  );

  return {
    analysis,
    skus,
    distribution,
    isLoading,
    error,
    priceRanges: DEFAULT_PRICE_RANGES,
    refresh,
    getSKUsByRange,
    categorizeProduct,
    compareRanges,
    getPriceTrend,
  };
}

export default usePriceRange;
