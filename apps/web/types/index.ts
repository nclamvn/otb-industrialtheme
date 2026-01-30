// ============================================
// ENUMS (defined locally to avoid @prisma/client dependency during build)
// ============================================

export type UserRole =
  | 'ADMIN'
  | 'FINANCE_HEAD'
  | 'FINANCE_USER'
  | 'BRAND_MANAGER'
  | 'BRAND_PLANNER'
  | 'MERCHANDISE_LEAD'
  | 'BOD_MEMBER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export type BudgetStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REVISED'
  | 'REJECTED';

export type Gender = 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';

export type OTBPlanStatus =
  | 'DRAFT'
  | 'SYSTEM_PROPOSED'
  | 'USER_PROPOSED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISED'
  | 'FINAL';

export type OTBVersionType =
  | 'V0_SYSTEM'
  | 'V1_USER'
  | 'V2_ADJUSTED'
  | 'V3_REVIEWED'
  | 'VA_APPROVED'
  | 'VF_FINAL'
  | 'REVISED';

export type SKUProposalStatus =
  | 'DRAFT'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'ENRICHING'
  | 'ENRICHED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISED';

export type SKUValidationStatus = 'PENDING' | 'VALID' | 'WARNING' | 'ERROR';

export type WorkflowType = 'BUDGET_APPROVAL' | 'OTB_APPROVAL' | 'SKU_APPROVAL';

export type WorkflowStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type WorkflowStepStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'REJECTED';

export type NotificationType =
  | 'WORKFLOW_ASSIGNED'
  | 'WORKFLOW_APPROVED'
  | 'WORKFLOW_REJECTED'
  | 'WORKFLOW_REMINDER'
  | 'BUDGET_SUBMITTED'
  | 'OTB_GENERATED'
  | 'SKU_UPLOADED'
  | 'COMMENT_ADDED'
  | 'SYSTEM_ALERT';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string | null;
  assignedBrands?: Brand[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface Division {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  brands?: Brand[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  divisionId: string;
  division?: Division;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  subcategories?: Subcategory[];
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    subcategories: number;
  };
}

export interface Subcategory {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  l4Detail?: string | null; // Level 4 category detail (e.g., "Shoulder Bags", "Totes")
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesLocation {
  id: string;
  name: string;
  code: string;
  type: string;
  storeGroup?: string | null; // REX, TTP, DAFC - for W25 store grouping
  address?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Season {
  id: string;
  name: string;
  code: string;
  seasonGroup: string;
  year: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  FINANCE_HEAD: 'Finance Head',
  FINANCE_USER: 'Finance User',
  BRAND_MANAGER: 'Brand Manager',
  BRAND_PLANNER: 'Brand Planner',
  MERCHANDISE_LEAD: 'Merchandise Lead',
  BOD_MEMBER: 'BOD Member',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
};

export const LOCATION_TYPES = ['STORE', 'OUTLET', 'ONLINE'] as const;
export type LocationType = typeof LOCATION_TYPES[number];

// ============================================
// SPRINT 2 TYPES
// ============================================

export interface BudgetAllocation {
  id: string;
  seasonId: string;
  season?: Season;
  brandId: string;
  brand?: Brand;
  locationId: string;
  location?: SalesLocation;
  totalBudget: number;
  seasonalBudget?: number | null;
  replenishmentBudget?: number | null;
  currency: string;
  status: BudgetStatus;
  version: number;
  parentVersionId?: string | null;
  comments?: string | null;
  assumptions?: Record<string, unknown> | null;
  workflowId?: string | null;
  workflow?: Workflow | null;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  submittedAt?: Date | null;
  approvedById?: string | null;
  approvedBy?: User | null;
  approvedAt?: Date | null;
  rejectedById?: string | null;
  rejectedBy?: User | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  updatedAt: Date;
  otbPlans?: OTBPlan[];
}

export interface OTBPlan {
  id: string;
  budgetId: string;
  budget?: BudgetAllocation;
  seasonId: string;
  season?: Season;
  brandId: string;
  brand?: Brand;
  version: number;
  versionType: OTBVersionType;
  versionName?: string | null;
  parentVersionId?: string | null;
  status: OTBPlanStatus;
  totalOTBValue: number;
  totalSKUCount: number;
  aiConfidenceScore?: number | null;
  aiGeneratedAt?: Date | null;
  aiModelUsed?: string | null;
  comments?: string | null;
  executiveSummary?: string | null;
  workflowId?: string | null;
  workflow?: Workflow | null;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  submittedAt?: Date | null;
  approvedById?: string | null;
  approvedBy?: User | null;
  approvedAt?: Date | null;
  updatedAt: Date;
  lineItems?: OTBLineItem[];
  sizingAnalysis?: SizingAnalysis[];
  skuProposals?: SKUProposal[];
}

export interface OTBLineItem {
  id: string;
  otbPlanId: string;
  level: number;
  collectionId?: string | null;
  collection?: { id: string; name: string; code: string } | null;
  gender?: Gender | null;
  categoryId?: string | null;
  category?: Category | null;
  subcategoryId?: string | null;
  subcategory?: Subcategory | null;
  sizeGroup?: string | null;
  historicalSalesPct?: number | null;
  historicalSalesValue?: number | null;
  historicalUnits?: number | null;
  systemProposedPct?: number | null;
  systemProposedValue?: number | null;
  systemConfidence?: number | null;
  userBuyPct: number;
  userBuyValue: number;
  userUnits?: number | null;
  varianceFromSystem?: number | null;
  varianceFromHist?: number | null;
  comment?: string | null;
  aiGeneratedComment?: string | null;
  hasAnomaly: boolean;
  anomalyType?: string | null;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SizingAnalysis {
  id: string;
  otbPlanId: string;
  categoryId: string;
  category?: Category;
  subcategoryId?: string | null;
  subcategory?: Subcategory | null;
  gender: Gender;
  locationId?: string | null;
  location?: SalesLocation | null;
  sizeData: SizeDataItem[];
  aiInsight?: string | null;
  aiRecommendation?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SizeDataItem {
  size: string;
  historicalPct: number;
  currentPct: number;
  recommendedPct?: number;
  stockoutRate?: number;
}

export interface SKUProposal {
  id: string;
  otbPlanId: string;
  otbPlan?: OTBPlan;
  seasonId: string;
  season?: Season;
  brandId: string;
  brand?: Brand;
  uploadedFileName?: string | null;
  uploadedFileUrl?: string | null;
  uploadedAt?: Date | null;
  status: SKUProposalStatus;
  totalSKUs: number;
  validSKUs: number;
  errorSKUs: number;
  warningSKUs: number;
  totalValue?: number | null;
  totalUnits?: number | null;
  workflowId?: string | null;
  workflow?: Workflow | null;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  submittedAt?: Date | null;
  approvedById?: string | null;
  approvedBy?: User | null;
  approvedAt?: Date | null;
  updatedAt: Date;
  items?: SKUItem[];
}

export interface SKUItem {
  id: string;
  proposalId: string;
  skuCode: string;
  styleName: string;
  colorCode?: string | null;
  colorName?: string | null;
  material?: string | null;
  collectionId?: string | null;
  gender: Gender;
  categoryId: string;

  // GAP-6: Item Number field (maps to Excel ITEM NO column)
  itemNo?: string | null;

  // GAP-7: Composition field (maps to Excel COMPOSITION column)
  // Separate from material - composition is the fabric breakdown like "95% Cotton, 5% Elastane"
  composition?: string | null;
  category?: Category;
  subcategoryId?: string | null;
  subcategory?: Subcategory | null;
  retailPrice: number;
  costPrice: number;
  margin?: number | null;
  orderQuantity: number;
  orderValue?: number | null;
  sizeBreakdown?: Record<string, number> | null;
  supplierSKU?: string | null;
  leadTime?: number | null;
  moq?: number | null;
  countryOfOrigin?: string | null;
  validationStatus: SKUValidationStatus;
  validationErrors?: string[] | null;
  validationWarnings?: string[] | null;
  aiDemandScore?: number | null;
  aiDemandPrediction?: string | null;
  aiRecommendedQty?: number | null;
  aiSimilarSKUs?: { skuCode: string; season: string; sellThrough: number }[] | null;
  aiInsights?: string | null;
  aiEnrichedAt?: Date | null;
  imageUrl?: string | null;
  imageUploadedAt?: Date | null;
  isNew: boolean;
  isActive: boolean;

  // W25 Fields
  fullSeasonRatio?: number | null;    // FSR - Full Season Ratio (0-1)
  carryForward?: boolean;             // CF flag
  carryForwardFrom?: string | null;   // Source season (SS24, FW24, CORE, etc.)
  themeGroup?: string | null;         // Theme grouping
  l4Category?: string | null;         // Level 4 category detail

  createdAt: Date;
  updatedAt: Date;
}

export interface Workflow {
  id: string;
  type: WorkflowType;
  referenceId: string;
  referenceType: string;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  initiatedById: string;
  initiatedBy?: User;
  initiatedAt: Date;
  completedAt?: Date | null;
  slaDeadline?: Date | null;
  slaBreached: boolean;
  steps?: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepNumber: number;
  stepName: string;
  description?: string | null;
  assignedRole?: UserRole | null;
  assignedUserId?: string | null;
  assignedUser?: User | null;
  status: WorkflowStepStatus;
  actionById?: string | null;
  actionBy?: User | null;
  actionAt?: Date | null;
  actionType?: string | null;
  actionComment?: string | null;
  slaHours?: number | null;
  dueAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  referenceId?: string | null;
  referenceType?: string | null;
  referenceUrl?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  emailSent: boolean;
  emailSentAt?: Date | null;
  createdAt: Date;
}

export interface Comment {
  id: string;
  referenceId: string;
  referenceType: string;
  parentId?: string | null;
  content: string;
  isAIGenerated: boolean;
  authorId: string;
  author?: User;
  isResolved: boolean;
  resolvedById?: string | null;
  resolvedBy?: User | null;
  resolvedAt?: Date | null;
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SPRINT 2 LABELS
// ============================================

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REVISED: 'Revised',
  REJECTED: 'Rejected',
};

export const GENDER_LABELS: Record<Gender, string> = {
  MEN: 'Men',
  WOMEN: 'Women',
  UNISEX: 'Unisex',
  KIDS: 'Kids',
};

export const OTB_STATUS_LABELS: Record<OTBPlanStatus, string> = {
  DRAFT: 'Draft',
  SYSTEM_PROPOSED: 'System Proposed',
  USER_PROPOSED: 'User Proposed',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REVISED: 'Revised',
  FINAL: 'Final',
};

export const OTB_VERSION_LABELS: Record<OTBVersionType, string> = {
  V0_SYSTEM: 'V0 - System',
  V1_USER: 'V1 - User',
  V2_ADJUSTED: 'V2 - Adjusted',
  V3_REVIEWED: 'V3 - Reviewed',
  VA_APPROVED: 'VA - Approved',
  VF_FINAL: 'VF - Final',
  REVISED: 'Revised',
};

export const SKU_STATUS_LABELS: Record<SKUProposalStatus, string> = {
  DRAFT: 'Draft',
  VALIDATING: 'Validating',
  VALIDATED: 'Validated',
  ENRICHING: 'Enriching',
  ENRICHED: 'Enriched',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REVISED: 'Revised',
};

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};
