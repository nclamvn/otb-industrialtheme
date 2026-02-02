/**
 * Store Performance Types
 *
 * For tracking performance by store group (REX/TTP)
 * Maps to Excel columns: %ST REX, %ST TTP
 */

export type StoreGroup = 'REX' | 'TTP' | 'DAFC' | 'OTHER' | 'ALL';

export interface StorePerformanceData {
  id: string;
  storeGroup: StoreGroup;
  locationId?: string;
  locationName?: string;

  // Metrics
  sellThruPercent: number;
  sellThruPrevPeriod?: number;
  sellThruChange?: string;  // "100% - 50%" format from Excel

  // Quantities
  qtyReceived: number;
  qtySold: number;
  qtyOnHand: number;

  // Sales
  salesValue: number;
  salesUnits: number;

  // Calculated
  variance?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface StoreComparisonData {
  sku: {
    id: string;
    code: string;
    name: string;
  };
  rex: StorePerformanceData;
  ttp: StorePerformanceData;
  variance: {
    sellThru: number;
    salesUnits: number;
    salesValue: number;
  };
}

export interface StorePerformanceSummary {
  storeGroup: StoreGroup;
  totalSKUs: number;
  avgSellThru: number;
  totalSalesValue: number;
  totalSalesUnits: number;
  topPerformers: StorePerformanceData[];
  bottomPerformers: StorePerformanceData[];
}

export const STORE_GROUP_CONFIG: Record<StoreGroup, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  REX: {
    label: 'REX',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-500',
  },
  TTP: {
    label: 'TTP',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-500',
  },
  DAFC: {
    label: 'DAFC',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-500',
  },
  OTHER: {
    label: 'Other',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-500',
  },
  ALL: {
    label: 'All Stores',
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-muted/50',
    borderColor: 'border-slate-500',
  },
};
