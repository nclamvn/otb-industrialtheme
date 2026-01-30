import { useState, useMemo, useCallback } from 'react';
import {
  PriceRangeAnalysis,
  PriceRangeData,
  PriceRangeSKU,
  DEFAULT_PRICE_RANGES,
  getPriceRange,
} from '../types';

// Demo data matching Excel price range analysis
const generateDemoAnalysis = (): PriceRangeAnalysis => ({
  id: 'analysis-1',
  seasonId: 'ss26',
  seasonName: 'SS26',
  categoryId: 'all',
  categoryName: 'All Categories',
  totalSKUs: 245,
  totalUnits: 45000,
  totalValue: 67500000000, // 67.5B VND
  avgPrice: 1500000, // 1.5M VND
  ranges: [
    {
      range: DEFAULT_PRICE_RANGES[0], // Budget
      skuCount: 45,
      totalUnits: 12000,
      totalValue: 4800000000,
      avgPrice: 400000,
      percentage: 26.7,
      sellThruPercent: 78.5,
      marginPercent: 42.0,
    },
    {
      range: DEFAULT_PRICE_RANGES[1], // Mid-Range
      skuCount: 95,
      totalUnits: 18000,
      totalValue: 18000000000,
      avgPrice: 1000000,
      percentage: 40.0,
      sellThruPercent: 65.2,
      marginPercent: 48.5,
    },
    {
      range: DEFAULT_PRICE_RANGES[2], // Premium
      skuCount: 72,
      totalUnits: 10500,
      totalValue: 23100000000,
      avgPrice: 2200000,
      percentage: 23.3,
      sellThruPercent: 52.8,
      marginPercent: 55.0,
    },
    {
      range: DEFAULT_PRICE_RANGES[3], // Luxury
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
}

interface UsePriceRangeReturn {
  analysis: PriceRangeAnalysis;
  skus: PriceRangeSKU[];
  isLoading: boolean;
  error: Error | null;
  priceRanges: typeof DEFAULT_PRICE_RANGES;
  refresh: () => void;
  getSKUsByRange: (rangeId: string) => PriceRangeSKU[];
  categorizeProduct: (price: number) => string;
}

export function usePriceRange(
  options: UsePriceRangeOptions = {}
): UsePriceRangeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Demo data
  const analysis = useMemo(() => generateDemoAnalysis(), []);
  const skus = useMemo(() => generateDemoSKUs(), []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    // TODO: Replace with real API call
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const getSKUsByRange = useCallback(
    (rangeId: string) => {
      return skus.filter((sku) => sku.priceRangeId === rangeId);
    },
    [skus]
  );

  const categorizeProduct = useCallback((price: number) => {
    return getPriceRange(price).id;
  }, []);

  return {
    analysis,
    skus,
    isLoading,
    error,
    priceRanges: DEFAULT_PRICE_RANGES,
    refresh,
    getSKUsByRange,
    categorizeProduct,
  };
}

export default usePriceRange;
