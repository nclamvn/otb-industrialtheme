/**
 * Delivery Planning Types
 *
 * For multi-location delivery matrix planning
 * Maps to Excel: 3 stores x 3 delivery months
 */

export type DeliveryStatus = 'PLANNED' | 'CONFIRMED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export type StoreGroup = 'REX' | 'TTP' | 'ALL';

export interface Store {
  id: string;
  storeCode: string;
  name: string;
  shortName?: string;
  storeGroup: StoreGroup;
  city?: string;
  country?: string;
  isActive: boolean;
}

export interface DeliverySlot {
  storeId: string;
  storeName: string;
  storeCode: string;
  deliveryDate: Date;
  deliveryMonth: number;  // 7, 8, 9
  plannedUnits: number;
  confirmedUnits?: number;
  receivedUnits?: number;
  status: DeliveryStatus;
}

export interface SKUDeliveryPlan {
  skuId: string;
  skuCode: string;
  skuName: string;
  totalUnits: number;
  totalValue: number;
  deliverySlots: DeliverySlot[];

  // Aggregated by store
  byStore: Record<string, {
    total: number;
    byMonth: Record<number, number>;
  }>;

  // Aggregated by month
  byMonth: Record<number, {
    total: number;
    byStore: Record<string, number>;
  }>;
}

export interface DeliveryMatrix {
  stores: Store[];
  months: DeliveryMonth[];
  skus: SKUDeliveryPlan[];
  totals: {
    byStore: Record<string, number>;
    byMonth: Record<number, number>;
    grand: number;
  };
}

export interface DeliveryMonth {
  month: number;
  year: number;
  label: string;
}

export interface DeliveryCellEdit {
  skuId: string;
  storeId: string;
  month: number;
  units: number;
}

// Default stores from Excel (W25_DAFC_proposal)
export const DEFAULT_STORES: Store[] = [
  {
    id: 'store-1',
    storeCode: '18142',
    name: 'DUY ANH FASHION AND COSMETICS JOINT',
    shortName: 'DAFC',
    storeGroup: 'ALL',
    city: 'Ho Chi Minh',
    country: 'VN',
    isActive: true,
  },
  {
    id: 'store-2',
    storeCode: '18649',
    name: 'DUY ANH REX HOTEL',
    shortName: 'REX',
    storeGroup: 'REX',
    city: 'Ho Chi Minh',
    country: 'VN',
    isActive: true,
  },
  {
    id: 'store-3',
    storeCode: '18686',
    name: 'DUY ANH TRANG TIEN PLAZA',
    shortName: 'TTP',
    storeGroup: 'TTP',
    city: 'Hanoi',
    country: 'VN',
    isActive: true,
  },
];

export const DELIVERY_MONTHS: DeliveryMonth[] = [
  { month: 7, year: 2025, label: 'Jul 2025' },
  { month: 8, year: 2025, label: 'Aug 2025' },
  { month: 9, year: 2025, label: 'Sep 2025' },
];

export const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  PLANNED: {
    label: 'Planned',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  RECEIVED: {
    label: 'Received',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
};

export const STORE_GROUP_COLORS: Record<StoreGroup, {
  border: string;
  bg: string;
  text: string;
}> = {
  REX: {
    border: 'border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
  },
  TTP: {
    border: 'border-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
  },
  ALL: {
    border: 'border-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
  },
};
