// Size Profile Types for Frontend

export enum SizeType {
  ALPHA = 'ALPHA',
  NUMERIC = 'NUMERIC',
  WAIST = 'WAIST',
  SHOE = 'SHOE',
  ONE_SIZE = 'ONE_SIZE',
}

export enum SizeProfileType {
  HISTORICAL = 'HISTORICAL',
  CURRENT_TREND = 'CURRENT_TREND',
  SYSTEM_OPTIMAL = 'SYSTEM_OPTIMAL',
  USER_ADJUSTED = 'USER_ADJUSTED',
  FINAL = 'FINAL',
}

export interface SizeDefinition {
  id: string;
  name: string;
  code: string;
  sizeType: SizeType;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SizeDistribution {
  sizeId: string;
  sizeName: string;
  sizeCode: string;
  percentage: number;
}

export interface SizeProfile {
  id: string;
  name: string;
  profileType: SizeProfileType;
  categoryId?: string;
  categoryName?: string;
  seasonId?: string;
  seasonName?: string;
  locationId?: string;
  locationName?: string;
  brandId?: string;
  brandName?: string;
  sizeDistribution: SizeDistribution[];
  isActive: boolean;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SizeBreakdown {
  categoryId: string;
  categoryName: string;
  seasonId?: string;
  locationId?: string;
  profiles: SizeProfile[];
  recommended: SizeDistribution[];
}

export interface ProfileComparison {
  profiles: SizeProfile[];
  differences: {
    sizeCode: string;
    sizeName: string;
    values: { profileId: string; percentage: number }[];
    variance: number;
  }[];
  summary: {
    avgVariance: number;
    maxVariance: number;
    mostDifferentSize: string;
  };
}

export interface OptimizeSizeProfileParams {
  categoryId: string;
  seasonId?: string;
  locationId?: string;
  historicalProfileId?: string;
  trendProfileId?: string;
  historicalWeight?: number;
  trendWeight?: number;
}

// Form DTOs
export interface CreateSizeDefinitionInput {
  name: string;
  code: string;
  sizeType: SizeType;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateSizeDefinitionInput {
  name?: string;
  code?: string;
  sizeType?: SizeType;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateSizeProfileInput {
  name: string;
  profileType: SizeProfileType;
  categoryId?: string;
  seasonId?: string;
  locationId?: string;
  brandId?: string;
  sizeDistribution: { sizeId: string; percentage: number }[];
  notes?: string;
}

export interface UpdateSizeProfileInput {
  name?: string;
  profileType?: SizeProfileType;
  sizeDistribution?: { sizeId: string; percentage: number }[];
  isActive?: boolean;
  notes?: string;
}

export interface QuerySizeProfileParams {
  categoryId?: string;
  seasonId?: string;
  locationId?: string;
  brandId?: string;
  profileType?: SizeProfileType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// UI Display helpers
export const SIZE_TYPE_LABELS: Record<SizeType, string> = {
  [SizeType.ALPHA]: 'Alpha (XS-XXL)',
  [SizeType.NUMERIC]: 'Numeric (0-16)',
  [SizeType.WAIST]: 'Waist (28-44)',
  [SizeType.SHOE]: 'Shoe (5-15)',
  [SizeType.ONE_SIZE]: 'One Size',
};

export const SIZE_PROFILE_TYPE_LABELS: Record<SizeProfileType, string> = {
  [SizeProfileType.HISTORICAL]: 'Historical Data',
  [SizeProfileType.CURRENT_TREND]: 'Current Trend',
  [SizeProfileType.SYSTEM_OPTIMAL]: 'System Optimal',
  [SizeProfileType.USER_ADJUSTED]: 'User Adjusted',
  [SizeProfileType.FINAL]: 'Final Approved',
};

export const SIZE_PROFILE_TYPE_COLORS: Record<SizeProfileType, string> = {
  [SizeProfileType.HISTORICAL]: 'bg-blue-500',
  [SizeProfileType.CURRENT_TREND]: 'bg-green-500',
  [SizeProfileType.SYSTEM_OPTIMAL]: 'bg-purple-500',
  [SizeProfileType.USER_ADJUSTED]: 'bg-orange-500',
  [SizeProfileType.FINAL]: 'bg-emerald-500',
};
