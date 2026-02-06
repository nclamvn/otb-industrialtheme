// lib/utils/enum-helpers.ts
// Safe enum handling to prevent runtime errors from invalid enum values

/* eslint-disable @typescript-eslint/no-explicit-any */

// =====================================================
// ENUM DEFINITIONS (Must match Prisma schema)
// =====================================================

export const OTB_PLAN_STATUSES = [
  'DRAFT',
  'SYSTEM_PROPOSED',
  'USER_PROPOSED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'REVISED',
  'FINAL',
] as const;

export type OTBPlanStatus = typeof OTB_PLAN_STATUSES[number];

export const SKU_PROPOSAL_STATUSES = [
  'DRAFT',
  'VALIDATING',
  'VALIDATED',
  'ENRICHING',
  'ENRICHED',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'REVISED',
] as const;

export type SKUProposalStatus = typeof SKU_PROPOSAL_STATUSES[number];

export const BUDGET_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REVISED',
  'REJECTED',
] as const;

export type BudgetStatus = typeof BUDGET_STATUSES[number];

export const OTB_VERSION_TYPES = [
  'V0_SYSTEM',
  'V1_USER',
  'V2_ADJUSTED',
  'V3_REVIEWED',
  'VA_APPROVED',
  'VF_FINAL',
  'REVISED',
] as const;

export type OTBVersionType = typeof OTB_VERSION_TYPES[number];

export const WORKFLOW_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;

export type WorkflowStatus = typeof WORKFLOW_STATUSES[number];

export const USER_ROLES = [
  'ADMIN',
  'MANAGER',
  'PLANNER',
  'VIEWER',
  'FINANCE',
  'BRAND_MANAGER',
] as const;

export type UserRole = typeof USER_ROLES[number];

// =====================================================
// SAFE ENUM VALIDATORS
// =====================================================

/**
 * Safely validate and return enum value, with fallback
 */
export function safeEnum<T extends string>(
  value: unknown,
  validValues: readonly T[],
  defaultValue: T
): T {
  if (typeof value === 'string' && validValues.includes(value as T)) {
    return value as T;
  }

  // Log warning for debugging (only in development)
  if (process.env.NODE_ENV === 'development' && value !== undefined && value !== null) {
    console.warn(`[Enum Warning] Invalid value: "${value}", expected one of: ${validValues.join(', ')}. Using default: "${defaultValue}"`);
  }

  return defaultValue;
}

/**
 * Check if value is valid enum
 */
export function isValidEnum<T extends string>(
  value: unknown,
  validValues: readonly T[]
): value is T {
  return typeof value === 'string' && validValues.includes(value as T);
}

// =====================================================
// SPECIFIC ENUM VALIDATORS
// =====================================================

export function safeOTBStatus(value: unknown): OTBPlanStatus {
  return safeEnum(value, OTB_PLAN_STATUSES, 'DRAFT');
}

export function safeSKUStatus(value: unknown): SKUProposalStatus {
  return safeEnum(value, SKU_PROPOSAL_STATUSES, 'DRAFT');
}

export function safeBudgetStatus(value: unknown): BudgetStatus {
  return safeEnum(value, BUDGET_STATUSES, 'DRAFT');
}

export function safeOTBVersion(value: unknown): OTBVersionType {
  return safeEnum(value, OTB_VERSION_TYPES, 'V0_SYSTEM');
}

export function safeWorkflowStatus(value: unknown): WorkflowStatus {
  return safeEnum(value, WORKFLOW_STATUSES, 'PENDING');
}

export function safeUserRole(value: unknown): UserRole {
  return safeEnum(value, USER_ROLES, 'VIEWER');
}

// =====================================================
// ENUM DISPLAY HELPERS
// =====================================================

export const OTB_STATUS_LABELS: Record<OTBPlanStatus, string> = {
  DRAFT: 'Nháp',
  SYSTEM_PROPOSED: 'Hệ thống đề xuất',
  USER_PROPOSED: 'Người dùng đề xuất',
  SUBMITTED: 'Đã gửi',
  UNDER_REVIEW: 'Đang xem xét',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  REVISED: 'Đã sửa',
  FINAL: 'Cuối cùng',
};

export const SKU_STATUS_LABELS: Record<SKUProposalStatus, string> = {
  DRAFT: 'Nháp',
  VALIDATING: 'Đang kiểm tra',
  VALIDATED: 'Đã kiểm tra',
  ENRICHING: 'Đang bổ sung',
  ENRICHED: 'Đã bổ sung',
  SUBMITTED: 'Đã gửi',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  REVISED: 'Đã sửa',
};

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã gửi',
  UNDER_REVIEW: 'Đang xem xét',
  APPROVED: 'Đã duyệt',
  REVISED: 'Đã sửa',
  REJECTED: 'Từ chối',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SYSTEM_PROPOSED: 'bg-blue-100 text-blue-700',
  USER_PROPOSED: 'bg-indigo-100 text-indigo-700',
  SUBMITTED: 'bg-yellow-100 text-yellow-700',
  UNDER_REVIEW: 'bg-orange-100 text-orange-700',
  VALIDATING: 'bg-blue-100 text-blue-700',
  VALIDATED: 'bg-teal-100 text-teal-700',
  ENRICHING: 'bg-purple-100 text-purple-700',
  ENRICHED: 'bg-violet-100 text-violet-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  REVISED: 'bg-purple-100 text-purple-700',
  FINAL: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-gray-200 text-gray-500',
};

/**
 * Get display label for OTB status
 */
export function getOTBStatusLabel(status: string): string {
  return OTB_STATUS_LABELS[status as OTBPlanStatus] || status;
}

/**
 * Get display label for SKU status
 */
export function getSKUStatusLabel(status: string): string {
  return SKU_STATUS_LABELS[status as SKUProposalStatus] || status;
}

/**
 * Get display label for Budget status
 */
export function getBudgetStatusLabel(status: string): string {
  return BUDGET_STATUS_LABELS[status as BudgetStatus] || status;
}

/**
 * Get color class for any status
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
}

// =====================================================
// DATA SANITIZATION
// =====================================================

/**
 * Sanitize an OTB Plan object by validating its enum fields
 */
export function sanitizeOTBPlan<T extends { status?: unknown }>(plan: T): T & { status: OTBPlanStatus } {
  return {
    ...plan,
    status: safeOTBStatus(plan.status),
  };
}

/**
 * Sanitize a SKU Proposal object
 */
export function sanitizeSKUProposal<T extends { status?: unknown }>(proposal: T): T & { status: SKUProposalStatus } {
  return {
    ...proposal,
    status: safeSKUStatus(proposal.status),
  };
}

/**
 * Sanitize a Budget object
 */
export function sanitizeBudget<T extends { status?: unknown }>(budget: T): T & { status: BudgetStatus } {
  return {
    ...budget,
    status: safeBudgetStatus(budget.status),
  };
}

/**
 * Sanitize an array of items
 */
export function sanitizeArray<T, R>(
  items: T[],
  sanitizer: (item: T) => R
): R[] {
  return items.map(sanitizer);
}
