import {
  UserRole,
  UserStatus,
  BudgetStatus,
  Gender,
  OTBPlanStatus,
  OTBVersionType,
  SKUProposalStatus,
  WorkflowStatus,
  NotificationPriority,
} from '../types/enums';

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.FINANCE_HEAD]: 'Finance Head',
  [UserRole.FINANCE_USER]: 'Finance User',
  [UserRole.BRAND_MANAGER]: 'Brand Manager',
  [UserRole.BRAND_PLANNER]: 'Brand Planner',
  [UserRole.MERCHANDISE_LEAD]: 'Merchandise Lead',
  [UserRole.BOD_MEMBER]: 'BOD Member',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'Active',
  [UserStatus.INACTIVE]: 'Inactive',
  [UserStatus.PENDING]: 'Pending',
};

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  [BudgetStatus.DRAFT]: 'Draft',
  [BudgetStatus.SUBMITTED]: 'Submitted',
  [BudgetStatus.UNDER_REVIEW]: 'Under Review',
  [BudgetStatus.APPROVED]: 'Approved',
  [BudgetStatus.REVISED]: 'Revised',
  [BudgetStatus.REJECTED]: 'Rejected',
};

export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.MEN]: 'Men',
  [Gender.WOMEN]: 'Women',
  [Gender.UNISEX]: 'Unisex',
  [Gender.KIDS]: 'Kids',
};

export const OTB_STATUS_LABELS: Record<OTBPlanStatus, string> = {
  [OTBPlanStatus.DRAFT]: 'Draft',
  [OTBPlanStatus.SYSTEM_PROPOSED]: 'System Proposed',
  [OTBPlanStatus.USER_PROPOSED]: 'User Proposed',
  [OTBPlanStatus.SUBMITTED]: 'Submitted',
  [OTBPlanStatus.UNDER_REVIEW]: 'Under Review',
  [OTBPlanStatus.APPROVED]: 'Approved',
  [OTBPlanStatus.REJECTED]: 'Rejected',
  [OTBPlanStatus.REVISED]: 'Revised',
  [OTBPlanStatus.FINAL]: 'Final',
};

export const OTB_VERSION_LABELS: Record<OTBVersionType, string> = {
  [OTBVersionType.V0_SYSTEM]: 'V0 - System',
  [OTBVersionType.V1_USER]: 'V1 - User',
  [OTBVersionType.V2_ADJUSTED]: 'V2 - Adjusted',
  [OTBVersionType.V3_REVIEWED]: 'V3 - Reviewed',
  [OTBVersionType.VA_APPROVED]: 'VA - Approved',
  [OTBVersionType.VF_FINAL]: 'VF - Final',
  [OTBVersionType.REVISED]: 'Revised',
};

export const SKU_STATUS_LABELS: Record<SKUProposalStatus, string> = {
  [SKUProposalStatus.DRAFT]: 'Draft',
  [SKUProposalStatus.VALIDATING]: 'Validating',
  [SKUProposalStatus.VALIDATED]: 'Validated',
  [SKUProposalStatus.ENRICHING]: 'Enriching',
  [SKUProposalStatus.ENRICHED]: 'Enriched',
  [SKUProposalStatus.SUBMITTED]: 'Submitted',
  [SKUProposalStatus.APPROVED]: 'Approved',
  [SKUProposalStatus.REJECTED]: 'Rejected',
  [SKUProposalStatus.REVISED]: 'Revised',
};

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  [WorkflowStatus.PENDING]: 'Pending',
  [WorkflowStatus.IN_PROGRESS]: 'In Progress',
  [WorkflowStatus.APPROVED]: 'Approved',
  [WorkflowStatus.REJECTED]: 'Rejected',
  [WorkflowStatus.CANCELLED]: 'Cancelled',
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: 'Low',
  [NotificationPriority.MEDIUM]: 'Medium',
  [NotificationPriority.HIGH]: 'High',
  [NotificationPriority.CRITICAL]: 'Critical',
};
