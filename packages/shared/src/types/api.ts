// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

// ============================================
// FILTER TYPES
// ============================================

export interface BudgetFilters extends PaginationParams {
  seasonId?: string;
  brandId?: string;
  locationId?: string;
  status?: string;
}

export interface OTBFilters extends PaginationParams {
  seasonId?: string;
  brandId?: string;
  budgetId?: string;
  status?: string;
}

export interface SKUFilters extends PaginationParams {
  otbPlanId?: string;
  seasonId?: string;
  brandId?: string;
  status?: string;
  validationStatus?: string;
}

// ============================================
// DTO TYPES (Data Transfer Objects)
// ============================================

export interface CreateBudgetDto {
  seasonId: string;
  brandId: string;
  locationId: string;
  totalBudget: number;
  seasonalBudget?: number;
  replenishmentBudget?: number;
  currency?: string;
  comments?: string;
  assumptions?: Record<string, unknown>;
}

export interface UpdateBudgetDto {
  totalBudget?: number;
  seasonalBudget?: number;
  replenishmentBudget?: number;
  comments?: string;
  assumptions?: Record<string, unknown>;
}

export interface CreateOTBPlanDto {
  budgetId: string;
  seasonId: string;
  brandId: string;
  versionType?: string;
  versionName?: string;
  comments?: string;
}

export interface UpdateOTBPlanDto {
  versionName?: string;
  comments?: string;
  executiveSummary?: string;
}

export interface CreateSKUProposalDto {
  otbPlanId: string;
  seasonId: string;
  brandId: string;
}

export interface ApprovalDto {
  comments?: string;
}

export interface RejectionDto {
  reason: string;
}

// ============================================
// JWT PAYLOAD
// ============================================

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
