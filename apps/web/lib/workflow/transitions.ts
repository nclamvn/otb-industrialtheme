import { WorkflowType, UserRole } from '@prisma/client';

export interface StepDefinition {
  name: string;
  description: string;
  assignedRole?: UserRole;
  slaHours?: number;
  canSkip?: boolean;
}

export interface WorkflowDefinition {
  type: WorkflowType;
  name: string;
  description: string;
  steps: StepDefinition[];
  totalSLAHours?: number;
}

// Workflow definitions for each type
export const WORKFLOW_DEFINITIONS: Record<WorkflowType, WorkflowDefinition> = {
  BUDGET_APPROVAL: {
    type: 'BUDGET_APPROVAL',
    name: 'Budget Approval',
    description: 'Approval workflow for budget allocations',
    totalSLAHours: 72,
    steps: [
      {
        name: 'Finance Review',
        description: 'Review budget allocation details and verify amounts',
        assignedRole: 'FINANCE_HEAD',
        slaHours: 24,
      },
      {
        name: 'BOD Approval',
        description: 'Final approval by Board of Directors',
        assignedRole: 'BOD_MEMBER',
        slaHours: 48,
      },
    ],
  },

  OTB_APPROVAL: {
    type: 'OTB_APPROVAL',
    name: 'OTB Plan Approval',
    description: 'Approval workflow for OTB plans',
    totalSLAHours: 96,
    steps: [
      {
        name: 'Brand Manager Review',
        description: 'Review OTB allocations and category breakdown',
        assignedRole: 'BRAND_MANAGER',
        slaHours: 24,
      },
      {
        name: 'Finance Review',
        description: 'Verify budget alignment and financial metrics',
        assignedRole: 'FINANCE_HEAD',
        slaHours: 24,
      },
      {
        name: 'Merchandise Review',
        description: 'Review sizing and SKU selection strategy',
        assignedRole: 'MERCHANDISE_LEAD',
        slaHours: 24,
        canSkip: true,
      },
      {
        name: 'BOD Approval',
        description: 'Final approval by Board of Directors',
        assignedRole: 'BOD_MEMBER',
        slaHours: 24,
      },
    ],
  },

  SKU_APPROVAL: {
    type: 'SKU_APPROVAL',
    name: 'SKU Proposal Approval',
    description: 'Approval workflow for SKU proposals',
    totalSLAHours: 72,
    steps: [
      {
        name: 'Brand Planner Review',
        description: 'Verify SKU details and alignment with OTB plan',
        assignedRole: 'BRAND_PLANNER',
        slaHours: 24,
      },
      {
        name: 'Brand Manager Approval',
        description: 'Approve SKU selection and quantities',
        assignedRole: 'BRAND_MANAGER',
        slaHours: 24,
      },
      {
        name: 'Finance Sign-off',
        description: 'Final financial verification and sign-off',
        assignedRole: 'FINANCE_USER',
        slaHours: 24,
      },
    ],
  },
};

// Get step index by name
export function getStepIndex(
  workflowType: WorkflowType,
  stepName: string
): number {
  const definition = WORKFLOW_DEFINITIONS[workflowType];
  return definition.steps.findIndex((s) => s.name === stepName);
}

// Check if user can act on workflow step
export function canUserActOnStep(
  userRole: UserRole,
  userId: string,
  step: {
    assignedRole?: UserRole | null;
    assignedUserId?: string | null;
  }
): boolean {
  // User is specifically assigned
  if (step.assignedUserId && step.assignedUserId === userId) {
    return true;
  }

  // User has the required role
  if (step.assignedRole && step.assignedRole === userRole) {
    return true;
  }

  // Admin can act on any step
  if (userRole === 'ADMIN') {
    return true;
  }

  return false;
}

// Get next assignee role for a workflow
export function getNextAssigneeRole(
  workflowType: WorkflowType,
  currentStep: number
): UserRole | null {
  const definition = WORKFLOW_DEFINITIONS[workflowType];
  const nextStep = definition.steps[currentStep]; // 0-indexed, currentStep is 1-indexed

  return nextStep?.assignedRole || null;
}

// Calculate estimated completion time
export function calculateEstimatedCompletion(
  workflowType: WorkflowType,
  currentStep: number
): Date {
  const definition = WORKFLOW_DEFINITIONS[workflowType];
  const remainingSteps = definition.steps.slice(currentStep - 1);
  const remainingHours = remainingSteps.reduce(
    (sum, step) => sum + (step.slaHours || 24),
    0
  );

  return new Date(Date.now() + remainingHours * 60 * 60 * 1000);
}

// Get workflow progress percentage
export function getProgressPercentage(
  totalSteps: number,
  currentStep: number,
  status: string
): number {
  if (status === 'APPROVED' || status === 'REJECTED') {
    return 100;
  }

  if (status === 'PENDING') {
    return 0;
  }

  // IN_PROGRESS
  return Math.round(((currentStep - 1) / totalSteps) * 100);
}

// Format workflow status for display
export function formatWorkflowStatus(
  status: string
): { label: string; color: string; icon: string } {
  const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    PENDING: { label: 'Pending', color: 'gray', icon: 'clock' },
    IN_PROGRESS: { label: 'In Progress', color: 'blue', icon: 'loader' },
    APPROVED: { label: 'Approved', color: 'green', icon: 'check-circle' },
    REJECTED: { label: 'Rejected', color: 'red', icon: 'x-circle' },
    CANCELLED: { label: 'Cancelled', color: 'gray', icon: 'ban' },
  };

  return statusMap[status] || { label: status, color: 'gray', icon: 'help-circle' };
}

// Format step status for display
export function formatStepStatus(
  status: string
): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: 'gray' },
    IN_PROGRESS: { label: 'In Progress', color: 'blue' },
    APPROVED: { label: 'Approved', color: 'green' },
    REJECTED: { label: 'Rejected', color: 'red' },
    SKIPPED: { label: 'Skipped', color: 'yellow' },
  };

  return statusMap[status] || { label: status, color: 'gray' };
}

// Get SLA status
export function getSLAStatus(
  dueAt: Date | null,
  completedAt: Date | null
): { status: 'ok' | 'warning' | 'breached'; message: string } {
  if (!dueAt) {
    return { status: 'ok', message: 'No SLA set' };
  }

  const now = completedAt || new Date();
  const diff = dueAt.getTime() - now.getTime();
  const hoursRemaining = diff / (1000 * 60 * 60);

  if (diff < 0) {
    const hoursOverdue = Math.abs(hoursRemaining);
    return {
      status: 'breached',
      message: `Overdue by ${hoursOverdue.toFixed(1)} hours`,
    };
  }

  if (hoursRemaining < 4) {
    return {
      status: 'warning',
      message: `Due in ${hoursRemaining.toFixed(1)} hours`,
    };
  }

  return {
    status: 'ok',
    message: `${hoursRemaining.toFixed(0)} hours remaining`,
  };
}
