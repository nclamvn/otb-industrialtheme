/**
 * Ticket System Types
 *
 * Workflow: Create Ticket → Submit → Approval Chain → Approved/Rejected
 */

export type TicketType = 'otb_plan' | 'sku_proposal' | 'sizing_change';

export type TicketStatus =
  | 'draft'      // Created but not submitted
  | 'submitted'  // Submitted for approval
  | 'in_review'  // Being reviewed
  | 'approved'   // Fully approved
  | 'rejected'   // Rejected, needs update
  | 'updated'    // Updated after rejection
  | 'cancelled'; // Cancelled by user

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TicketHistoryAction =
  | 'created'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'updated'
  | 'cancelled'
  | 'commented';

export interface TicketItem {
  id: string;
  type: 'otb_plan' | 'sku_proposal' | 'sizing';
  entityId: string;
  name: string;
  version: string;
  budget: number;
}

export interface TicketHistory {
  id: string;
  action: TicketHistoryAction;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  comment?: string;
  metadata?: Record<string, unknown>;
}

export interface Ticket {
  id: string;
  number: string; // e.g., "TKT-2026-0001"
  type: TicketType;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;

  // Related entities
  items: TicketItem[];

  // Metadata
  season: string;
  brand: string;
  totalBudget: number;

  // Users
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };

  // Timestamps
  createdAt: Date;
  submittedAt?: Date;
  updatedAt: Date;
  deadline?: Date;

  // Approval link
  approvalRequestId?: string;

  // History
  history: TicketHistory[];
}

export interface CreateTicketInput {
  type: TicketType;
  title: string;
  description?: string;
  priority: TicketPriority;
  season: string;
  brand: string;
  items: {
    type: TicketItem['type'];
    entityId: string;
    name: string;
    version: string;
    budget: number;
  }[];
  deadline?: Date;
}

// Configuration
export const TICKET_TYPE_CONFIG: Record<TicketType, {
  label: string;
  icon: string;
  color: string;
}> = {
  otb_plan: {
    label: 'OTB Plan Submission',
    icon: 'PieChart',
    color: 'blue',
  },
  sku_proposal: {
    label: 'SKU Proposal',
    icon: 'Package',
    color: 'purple',
  },
  sizing_change: {
    label: 'Sizing Change',
    icon: 'Ruler',
    color: 'emerald',
  },
};

export const TICKET_STATUS_CONFIG: Record<TicketStatus, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  draft: {
    label: 'Draft',
    icon: 'FileEdit',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-muted',
  },
  submitted: {
    label: 'Submitted',
    icon: 'Send',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  in_review: {
    label: 'In Review',
    icon: 'Clock',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  approved: {
    label: 'Approved',
    icon: 'CheckCircle',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  rejected: {
    label: 'Rejected',
    icon: 'XCircle',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  updated: {
    label: 'Updated',
    icon: 'RefreshCw',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'Ban',
    color: 'text-slate-500 dark:text-slate-500',
    bgColor: 'bg-muted dark:bg-slate-900',
  },
};

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dot: string;
}> = {
  low: {
    label: 'Low',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-muted/50 dark:bg-slate-900',
    borderColor: 'border-border',
    dot: '⚪',
  },
  normal: {
    label: 'Normal',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    dot: '🔵',
  },
  high: {
    label: 'High',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    dot: '🟡',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    dot: '🔴',
  },
};

// Generate ticket number
export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TKT-${year}-${random}`;
}
