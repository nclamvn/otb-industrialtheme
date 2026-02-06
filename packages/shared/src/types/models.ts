import {
  UserRole,
  UserStatus,
  BudgetStatus,
  Gender,
  OTBPlanStatus,
  OTBVersionType,
  SKUProposalStatus,
  SKUValidationStatus,
  WorkflowType,
  WorkflowStatus,
  WorkflowStepStatus,
  NotificationType,
  NotificationPriority,
} from './enums';

// ============================================
// BASE ENTITIES
// ============================================

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

// ============================================
// BUDGET & OTB ENTITIES
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

// ============================================
// SKU ENTITIES
// ============================================

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
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// WORKFLOW ENTITIES
// ============================================

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

// ============================================
// NOTIFICATION & COMMENT
// ============================================

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
