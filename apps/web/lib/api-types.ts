/**
 * API Types for DAFC OTB Platform
 * Shared types between frontend and backend API communication
 */

// ============================================
// Common Types
// ============================================

export type Gender = 'MALE' | 'FEMALE' | 'UNISEX' | 'KIDS';
export type CardStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'VERIFIED' | 'WARNING';
export type StoreGroup = 'REX' | 'TTP' | 'DAFC' | 'OTHER';
export type CarryForwardSource = 'SS24' | 'FW24' | 'SS25' | 'CORE' | 'NEW';
export type ThemeType = 'CORE_CLASSIC' | 'SEASONAL_TREND' | 'LIMITED_EDITION' | 'COLLABORATION' | 'SIGNATURE' | 'ESSENTIAL';
export type SizeType = 'NUMERIC' | 'ALPHA' | 'ONESIZE' | 'CUSTOM';

// ============================================
// Delivery Planning Types
// ============================================

export interface DeliveryWindow {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  seasonId: string;
  sortOrder: number;
  isActive: boolean;
}

export interface DeliveryAllocation {
  id: string;
  skuId: string;
  skuCode: string;
  skuName: string;
  windowId: string;
  window: DeliveryWindow;
  quantity: number;
  value: number;
  storeGroup: StoreGroup;
  locationId?: string;
  status: CardStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryMatrixCell {
  windowId: string;
  windowName: string;
  quantity: number;
  value: number;
  percentage: number;
}

export interface DeliveryMatrixRow {
  skuId: string;
  skuCode: string;
  skuName: string;
  category: string;
  brand: string;
  totalQuantity: number;
  totalValue: number;
  windows: DeliveryMatrixCell[];
}

export interface DeliverySummary {
  totalSKUs: number;
  totalQuantity: number;
  totalValue: number;
  byWindow: {
    windowId: string;
    windowName: string;
    quantity: number;
    value: number;
    percentage: number;
  }[];
  byStoreGroup: {
    storeGroup: StoreGroup;
    quantity: number;
    value: number;
    percentage: number;
  }[];
}

export interface CreateDeliveryAllocationDto {
  skuId: string;
  windowId: string;
  quantity: number;
  storeGroup?: StoreGroup;
  locationId?: string;
  notes?: string;
}

export interface UpdateDeliveryAllocationDto {
  quantity?: number;
  storeGroup?: StoreGroup;
  locationId?: string;
  status?: CardStatus;
  notes?: string;
}

export interface BatchDeliveryUpdateDto {
  allocations: {
    id?: string;
    skuId: string;
    windowId: string;
    quantity: number;
    storeGroup?: StoreGroup;
  }[];
}

// ============================================
// Costing Types
// ============================================

export interface CostingBreakdown {
  id: string;
  skuId: string;
  skuCode: string;
  category: string;
  unitCostUSD: number;
  exchangeRate: number;
  unitCostVND: number;
  freightPercent: number;
  freightVND: number;
  taxPercent: number;
  taxVND: number;
  importDutyPercent: number;
  importDutyVND: number;
  landedCostVND: number;
  srpVND: number;
  marginPercent: number;
  marginVND: number;
  status: CardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CostingSummary {
  totalSKUs: number;
  avgUnitCost: number;
  avgMargin: number;
  totalLandedValue: number;
  totalSRPValue: number;
  totalMarginValue: number;
  byCategory: {
    category: string;
    skuCount: number;
    avgMargin: number;
    totalValue: number;
  }[];
}

export interface CostingConfig {
  id: string;
  brandId?: string;
  category?: string;
  defaultExchangeRate: number;
  defaultFreightPercent: number;
  defaultTaxPercent: number;
  defaultImportDutyPercent: number;
  targetMarginMin: number;
  targetMarginMax: number;
  isActive: boolean;
}

export interface CalculateCostingDto {
  skuId: string;
  unitCostUSD: number;
  category?: string;
  srpVND?: number;
  exchangeRate?: number;
  freightPercent?: number;
  taxPercent?: number;
  importDutyPercent?: number;
}

export interface UpdateCostingDto {
  unitCostUSD?: number;
  srpVND?: number;
  exchangeRate?: number;
  freightPercent?: number;
  taxPercent?: number;
  importDutyPercent?: number;
  status?: CardStatus;
}

export interface BatchCostingUpdateDto {
  costings: {
    skuId: string;
    unitCostUSD?: number;
    srpVND?: number;
  }[];
  applyToAll?: {
    exchangeRate?: number;
    freightPercent?: number;
    taxPercent?: number;
    importDutyPercent?: number;
  };
}

// ============================================
// Store Performance Types
// ============================================

export interface StorePerformanceData {
  id: string;
  storeId: string;
  storeName: string;
  storeGroup: StoreGroup;
  locationId: string;
  periodStart: string;
  periodEnd: string;
  qtyReceived: number;
  qtySold: number;
  qtyOnHand: number;
  sellThruPercent: number;
  salesValue: number;
  salesUnits: number;
  avgTransactionValue: number;
  footfall?: number;
  conversionRate?: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export interface StoreGroupSummary {
  storeGroup: StoreGroup;
  storeCount: number;
  totalSalesValue: number;
  totalSalesUnits: number;
  avgSellThru: number;
  topStore: {
    storeId: string;
    storeName: string;
    sellThru: number;
  };
  bottomStore: {
    storeId: string;
    storeName: string;
    sellThru: number;
  };
}

export interface StoreComparisonData {
  storeId: string;
  storeName: string;
  storeGroup: StoreGroup;
  metrics: {
    metric: string;
    value: number;
    benchmark: number;
    variance: number;
    variancePercent: number;
  }[];
}

export interface StorePerformanceFilters {
  storeGroup?: StoreGroup;
  locationId?: string;
  brandId?: string;
  seasonId?: string;
  categoryId?: string;
  periodStart?: string;
  periodEnd?: string;
}

// ============================================
// Size Allocation Types
// ============================================

export interface SizeDefinition {
  id: string;
  code: string;
  name: string;
  sizeType: SizeType;
  sortOrder: number;
  isActive: boolean;
}

export interface SizeAllocation {
  id: string;
  skuId: string;
  sizeId: string;
  sizeCode: string;
  sizeName: string;
  quantity: number;
  percentage: number;
  choice: 'A' | 'B' | 'C';
  storeGroup?: StoreGroup;
  locationId?: string;
}

export interface SizeProfile {
  id: string;
  name: string;
  profileType: 'HISTORICAL' | 'TREND' | 'CUSTOM' | 'OPTIMIZED';
  categoryId?: string;
  seasonId?: string;
  brandId?: string;
  locationId?: string;
  sizeDistribution: {
    sizeId: string;
    sizeCode: string;
    percentage: number;
  }[];
  totalSamples?: number;
  confidence?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChoiceAllocation {
  choice: 'A' | 'B' | 'C';
  label: string;
  description: string;
  totalQuantity: number;
  totalValue: number;
  percentage: number;
  skuCount: number;
  sizes: {
    sizeId: string;
    sizeCode: string;
    quantity: number;
    percentage: number;
  }[];
}

export interface SizeAllocationSummary {
  totalQuantity: number;
  totalValue: number;
  byChoice: ChoiceAllocation[];
  bySize: {
    sizeId: string;
    sizeCode: string;
    totalQuantity: number;
    percentage: number;
    byChoice: {
      choice: 'A' | 'B' | 'C';
      quantity: number;
      percentage: number;
    }[];
  }[];
}

export interface CreateSizeAllocationDto {
  skuId: string;
  sizeId: string;
  quantity: number;
  choice: 'A' | 'B' | 'C';
  storeGroup?: StoreGroup;
  locationId?: string;
}

export interface UpdateSizeAllocationDto {
  quantity?: number;
  percentage?: number;
  choice?: 'A' | 'B' | 'C';
}

export interface ApplySizeProfileDto {
  skuIds: string[];
  profileId: string;
  totalQuantity: number;
  roundingMethod?: 'FLOOR' | 'CEIL' | 'ROUND';
}

// ============================================
// Price Range Types
// ============================================

export interface PriceRange {
  id: string;
  code: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
  brandId?: string;
  categoryId?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PriceRangeDistribution {
  rangeId: string;
  rangeCode: string;
  rangeName: string;
  minPrice: number;
  maxPrice: number;
  skuCount: number;
  totalQuantity: number;
  totalValue: number;
  percentage: number;
  avgPrice: number;
  medianPrice: number;
}

export interface PriceAnalysis {
  totalSKUs: number;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  priceStdDev: number;
  distribution: PriceRangeDistribution[];
  byCategory: {
    categoryId: string;
    categoryName: string;
    avgPrice: number;
    skuCount: number;
    distribution: PriceRangeDistribution[];
  }[];
  byBrand: {
    brandId: string;
    brandName: string;
    avgPrice: number;
    skuCount: number;
    distribution: PriceRangeDistribution[];
  }[];
}

export interface PriceRangeFilters {
  brandId?: string;
  categoryId?: string;
  seasonId?: string;
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreatePriceRangeDto {
  code: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  currency?: string;
  brandId?: string;
  categoryId?: string;
  sortOrder?: number;
}

export interface UpdatePriceRangeDto {
  code?: string;
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================
// Carry Forward Types
// ============================================

export interface CarryForwardData {
  id: string;
  skuId: string;
  isCarryForward: boolean;
  sourceCollection?: CarryForwardSource;
  originalSeasonId?: string;
  originalSkuCode?: string;
  performanceScore?: number;
  sellThruHistory?: number[];
  recommendation?: 'CONTINUE' | 'PHASE_OUT' | 'INCREASE' | 'MAINTAIN';
  notes?: string;
}

export interface CarryForwardSummary {
  totalSKUs: number;
  carryForwardCount: number;
  carryForwardPercent: number;
  newCount: number;
  newPercent: number;
  bySource: {
    source: CarryForwardSource;
    count: number;
    percentage: number;
    avgPerformance: number;
  }[];
}

// ============================================
// Theme Group Types
// ============================================

export interface ThemeGroup {
  id: string;
  name: string;
  code: string;
  type: ThemeType;
  description?: string;
  seasonId?: string;
  brandId?: string;
  productCount: number;
  totalValue: number;
  targetPercentage: number;
  currentPercentage: number;
  status: CardStatus;
  colorCode?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeSummary {
  totalThemes: number;
  totalProducts: number;
  totalValue: number;
  byType: {
    type: ThemeType;
    count: number;
    productCount: number;
    value: number;
    percentage: number;
  }[];
}

export interface CreateThemeGroupDto {
  name: string;
  code: string;
  type: ThemeType;
  description?: string;
  seasonId?: string;
  brandId?: string;
  targetPercentage?: number;
  colorCode?: string;
}

export interface UpdateThemeGroupDto {
  name?: string;
  description?: string;
  targetPercentage?: number;
  colorCode?: string;
  status?: CardStatus;
}

export interface AssignSKUsToThemeDto {
  themeId: string;
  skuIds: string[];
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BatchOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: {
    id: string;
    error: string;
  }[];
}
