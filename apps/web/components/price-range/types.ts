/**
 * Price Range Types
 *
 * For analyzing products by price bands
 * Maps to Excel columns for price grouping analysis
 */

export interface PriceRange {
  id: string;
  label: string;
  minPrice: number;
  maxPrice: number | null; // null = no upper limit
  color: string;
  bgColor: string;
}

export interface PriceRangeData {
  range: PriceRange;
  skuCount: number;
  totalUnits: number;
  totalValue: number;
  avgPrice: number;
  percentage: number; // % of total units
  sellThruPercent: number;
  marginPercent: number;
}

export interface PriceRangeAnalysis {
  id: string;
  seasonId: string;
  seasonName: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;

  // Summary
  totalSKUs: number;
  totalUnits: number;
  totalValue: number;
  avgPrice: number;

  // Range breakdown
  ranges: PriceRangeData[];

  // Analysis
  priceDistribution: 'balanced' | 'low-heavy' | 'high-heavy';
  recommendation?: string;
  lastUpdated: Date;
}

export interface PriceRangeSKU {
  id: string;
  skuCode: string;
  productName: string;
  category: string;
  retailPrice: number;
  costPrice: number;
  marginPercent: number;
  units: number;
  unitsSold: number;
  sellThruPercent: number;
  priceRangeId: string;
}

export const DEFAULT_PRICE_RANGES: PriceRange[] = [
  {
    id: 'budget',
    label: 'Budget',
    minPrice: 0,
    maxPrice: 500000,
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    id: 'mid',
    label: 'Mid-Range',
    minPrice: 500000,
    maxPrice: 1500000,
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    id: 'premium',
    label: 'Premium',
    minPrice: 1500000,
    maxPrice: 3000000,
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    id: 'luxury',
    label: 'Luxury',
    minPrice: 3000000,
    maxPrice: null,
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
];

export const formatPrice = (value: number, currency = 'VND') => {
  if (currency === 'VND') {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString();
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const getPriceRange = (price: number, ranges: PriceRange[] = DEFAULT_PRICE_RANGES): PriceRange => {
  for (const range of ranges) {
    if (price >= range.minPrice && (range.maxPrice === null || price < range.maxPrice)) {
      return range;
    }
  }
  return ranges[ranges.length - 1];
};
