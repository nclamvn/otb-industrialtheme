/**
 * Multi-level Approval Chain Types
 *
 * Workflow: Submit → GMD → Finance → CEO → Complete
 */

export type ApprovalLevel = 'gmd' | 'finance' | 'ceo';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export type ApprovalRequestStatus = 'in_progress' | 'approved' | 'rejected';

export type ApprovalRequestType = 'otb_plan' | 'sku_proposal' | 'sizing';

export type ApprovalPriority = 'high' | 'medium' | 'normal';

export interface Approver {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface ApprovalStep {
  id: string;
  level: ApprovalLevel;
  status: ApprovalStatus;
  approver?: Approver;
  approvedAt?: Date;
  comment?: string;
  deadline?: Date;
}

export interface ApprovalRequest {
  id: string;
  type: ApprovalRequestType;
  entityId: string;
  entityName: string;
  requestedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  requestedAt: Date;
  currentLevel: ApprovalLevel;
  steps: ApprovalStep[];
  status: ApprovalRequestStatus;
  priority: ApprovalPriority;
  metadata: {
    season: string;
    brand?: string;
    category?: string;
    totalBudget: number;
    skuCount?: number;
  };
}

export interface ApprovalAction {
  requestId: string;
  level: ApprovalLevel;
  action: 'approve' | 'reject';
  comment?: string;
  timestamp: Date;
  userId: string;
}

// Configuration for approval levels
export const APPROVAL_LEVELS: ApprovalLevel[] = ['gmd', 'finance', 'ceo'];

export const APPROVAL_LEVEL_CONFIG: Record<ApprovalLevel, {
  label: string;
  fullLabel: string;
  description: string;
  icon: string;
}> = {
  gmd: {
    label: 'GMD',
    fullLabel: 'General Merchandise Director',
    description: 'Category-level review and merchandise validation',
    icon: 'ShoppingBag',
  },
  finance: {
    label: 'Finance',
    fullLabel: 'Finance Director',
    description: 'Budget validation and financial review',
    icon: 'Calculator',
  },
  ceo: {
    label: 'CEO',
    fullLabel: 'Chief Executive Officer',
    description: 'Final approval and sign-off',
    icon: 'Crown',
  },
};

export const APPROVAL_REQUEST_TYPE_CONFIG: Record<ApprovalRequestType, {
  label: string;
  icon: string;
  color: string;
}> = {
  otb_plan: {
    label: 'OTB Plan',
    icon: 'PieChart',
    color: 'blue',
  },
  sku_proposal: {
    label: 'SKU Proposal',
    icon: 'Package',
    color: 'purple',
  },
  sizing: {
    label: 'Sizing',
    icon: 'Ruler',
    color: 'emerald',
  },
};

export const PRIORITY_CONFIG: Record<ApprovalPriority, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  high: {
    label: 'High Priority',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  normal: {
    label: 'Normal',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
};
