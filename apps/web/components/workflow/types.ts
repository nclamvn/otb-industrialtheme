/**
 * Workflow Types for Decision Gates
 */

export type WorkflowStep =
  | 'budget'
  | 'otb'
  | 'submit'
  | 'wssi'
  | 'sizing'
  | 'approval';

export type DecisionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'alternate_requested';

export type DecisionType =
  | 'otb_approval'      // After OTB Submit - "Is Alternate OTB Plan accepted?"
  | 'sizing_approval'   // After Sizing - "Is Sizing Change submitted?"
  | 'final_approval';   // Final approval gate

export interface DecisionGateData {
  id: string;
  type: DecisionType;
  status: DecisionStatus;
  question: string;
  submittedBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
  submittedAt?: Date;
  version?: string;
  budgetId: string;
  nodeId?: string;
  metadata?: Record<string, unknown>;
}

export interface DecisionAction {
  type: 'approve' | 'reject' | 'alternate';
  comment?: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

export interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  pendingDecisions: DecisionGateData[];
  isBlocked: boolean;
  blockedReason?: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  'budget',
  'otb',
  'submit',
  'wssi',
  'sizing',
  'approval',
];

export const WORKFLOW_STEP_CONFIG: Record<WorkflowStep, {
  label: string;
  icon: string;
  description: string;
}> = {
  budget: {
    label: 'Budget',
    icon: 'Wallet',
    description: 'Finance team sets season budget',
  },
  otb: {
    label: 'OTB Allocation',
    icon: 'PieChart',
    description: 'Allocate budget across categories',
  },
  submit: {
    label: 'Submit Plan',
    icon: 'Send',
    description: 'Submit OTB plan for review',
  },
  wssi: {
    label: 'WSSI',
    icon: 'Calendar',
    description: 'Weekly Stock & Sales Input',
  },
  sizing: {
    label: 'Sizing',
    icon: 'Ruler',
    description: 'Size breakdown and allocation',
  },
  approval: {
    label: 'Approval',
    icon: 'CheckCircle',
    description: 'Final approval and sign-off',
  },
};
