/**
 * Portfo Integration Types
 *
 * Workflow: OTB Plan Approved → Upload SRD to Portfo → Continue to WSSI
 */

export interface SRDAllocation {
  collection: string;
  gender: string;
  category: string;
  subcategory?: string;
  amount: number;
  percentage?: number;
}

export interface SRDDocument {
  id: string;
  type: 'otb_plan';
  version: string;
  season: string;
  brand: string;
  data: {
    totalBudget: number;
    allocations: SRDAllocation[];
  };
  metadata: {
    createdAt: Date;
    createdBy: string;
    approvedAt: Date;
    approvedBy: string;
    ticketId?: string;
    approvalId?: string;
  };
}

export interface PortfoUploadRequest {
  document: SRDDocument;
  options?: {
    notifyStakeholders?: boolean;
    createBackup?: boolean;
  };
}

export interface PortfoUploadResponse {
  success: boolean;
  portfoId?: string;
  portfoUrl?: string;
  timestamp?: Date;
  error?: string;
}

export type PortfoUploadStatusType = 'pending' | 'uploading' | 'success' | 'failed';

export interface PortfoUploadStatus {
  id: string;
  status: PortfoUploadStatusType;
  progress: number; // 0-100
  currentStep: PortfoUploadStep;
  documentId: string;
  portfoId?: string;
  portfoUrl?: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export type PortfoUploadStep =
  | 'validating'
  | 'transforming'
  | 'uploading'
  | 'verifying'
  | 'backup'
  | 'complete';

export const PORTFO_UPLOAD_STEPS: PortfoUploadStep[] = [
  'validating',
  'transforming',
  'uploading',
  'verifying',
  'backup',
  'complete',
];

export const PORTFO_STEP_CONFIG: Record<PortfoUploadStep, {
  label: string;
  description: string;
  progress: number;
}> = {
  validating: {
    label: 'Validating document...',
    description: 'Checking document format and data integrity',
    progress: 10,
  },
  transforming: {
    label: 'Transforming data format...',
    description: 'Converting to Portfo-compatible format',
    progress: 30,
  },
  uploading: {
    label: 'Uploading to Portfo...',
    description: 'Sending data to Portfo servers',
    progress: 60,
  },
  verifying: {
    label: 'Verifying upload...',
    description: 'Confirming successful upload',
    progress: 85,
  },
  backup: {
    label: 'Creating backup...',
    description: 'Saving local backup copy',
    progress: 95,
  },
  complete: {
    label: 'Upload complete',
    description: 'Document successfully uploaded',
    progress: 100,
  },
};

export interface PortfoUploadHistory {
  id: string;
  documentId: string;
  documentType: string;
  season: string;
  brand: string;
  portfoId: string;
  portfoUrl: string;
  status: 'success' | 'failed';
  uploadedAt: Date;
  uploadedBy: {
    id: string;
    name: string;
  };
  budget: number;
  error?: string;
}
