/**
 * Carry Forward & Theme Types
 *
 * For tracking carry-forward products and theme groupings
 * Maps to Excel: W25_DAFC_proposal - CF Flag, Theme columns
 */

export type CarryForwardSource = 'SS24' | 'FW24' | 'SS25' | 'CORE' | 'NEW';

export type ThemeType =
  | 'CORE_CLASSIC'
  | 'SEASONAL_TREND'
  | 'LIMITED_EDITION'
  | 'COLLABORATION'
  | 'SIGNATURE'
  | 'ESSENTIAL';

export interface CarryForwardData {
  isCarryForward: boolean;
  sourceCollection?: CarryForwardSource;
  originalSeason?: string;
  performanceRating?: 'HIGH' | 'MEDIUM' | 'LOW';
  sellThroughRate?: number;      // 0-1
  previousQuantity?: number;
  recommendedAction?: 'INCREASE' | 'MAINTAIN' | 'REDUCE' | 'DISCONTINUE';
}

export interface ThemeGroup {
  id: string;
  name: string;
  type: ThemeType;
  description?: string;
  colorPalette?: string[];
  productCount: number;
  totalValue: number;
  targetPercentage?: number;     // % of total collection
  currentPercentage?: number;
  season: string;
}

export interface ProductThemeAssignment {
  productId: string;
  skuId: string;
  themeGroupId: string;
  isPrimary: boolean;
}

// Theme configuration
export const THEME_CONFIG: Record<ThemeType, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  CORE_CLASSIC: {
    label: 'Core Classic',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    icon: '◆',
  },
  SEASONAL_TREND: {
    label: 'Seasonal Trend',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: '★',
  },
  LIMITED_EDITION: {
    label: 'Limited Edition',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: '✦',
  },
  COLLABORATION: {
    label: 'Collaboration',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    icon: '❖',
  },
  SIGNATURE: {
    label: 'Signature',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: '◈',
  },
  ESSENTIAL: {
    label: 'Essential',
    color: 'text-green-700',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '●',
  },
};

// Carry Forward source configuration
export const CF_SOURCE_CONFIG: Record<CarryForwardSource, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  SS24: {
    label: 'SS24',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  FW24: {
    label: 'FW24',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  SS25: {
    label: 'SS25',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  CORE: {
    label: 'Core',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
  NEW: {
    label: 'New',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

// Performance rating configuration
export const PERFORMANCE_CONFIG: Record<'HIGH' | 'MEDIUM' | 'LOW', {
  label: string;
  color: string;
  bgColor: string;
}> = {
  HIGH: {
    label: 'High Performer',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  MEDIUM: {
    label: 'Moderate',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  LOW: {
    label: 'Low Performer',
    color: 'text-red-700',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

// Action recommendation configuration
export const ACTION_CONFIG: Record<'INCREASE' | 'MAINTAIN' | 'REDUCE' | 'DISCONTINUE', {
  label: string;
  color: string;
  icon: string;
}> = {
  INCREASE: {
    label: 'Increase',
    color: 'text-emerald-600',
    icon: '↑',
  },
  MAINTAIN: {
    label: 'Maintain',
    color: 'text-blue-600',
    icon: '→',
  },
  REDUCE: {
    label: 'Reduce',
    color: 'text-amber-600',
    icon: '↓',
  },
  DISCONTINUE: {
    label: 'Discontinue',
    color: 'text-red-600',
    icon: '✕',
  },
};
