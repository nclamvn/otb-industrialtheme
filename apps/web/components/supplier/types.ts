/**
 * Supplier Request Types
 *
 * Workflow: All Approvals Complete → Send Planning Request to Supplier → Export
 */

export type SupplierRequestMethod = 'email' | 'api' | 'manual';

export type SupplierRequestStatus =
  | 'draft'
  | 'pending'
  | 'sent'
  | 'acknowledged'
  | 'confirmed'
  | 'failed';

export interface Supplier {
  id: string;
  name: string;
  code: string;
  email: string;
  contactPerson?: string;
  phone?: string;
  method: SupplierRequestMethod;
  apiEndpoint?: string;
}

export interface PlanningRequestItem {
  styleCode: string;
  productName: string;
  category: string;
  gender: string;
  size: string;
  units: number;
  unitPrice: number;
  totalValue: number;
  deliveryDate?: string;
}

export interface PlanningRequest {
  id: string;
  requestNumber: string; // e.g., "PR-2026-0001"

  // Source
  ticketId: string;
  ticketNumber: string;
  approvalId: string;

  // Metadata
  season: string;
  brand: string;
  totalUnits: number;
  totalValue: number;

  // Supplier
  supplier: Supplier;

  // Items
  items: PlanningRequestItem[];

  // Status
  status: SupplierRequestStatus;
  method: SupplierRequestMethod;

  // Timestamps
  createdAt: Date;
  sentAt?: Date;
  acknowledgedAt?: Date;
  confirmedAt?: Date;

  // Response
  supplierResponse?: {
    confirmedUnits?: number;
    estimatedDelivery?: Date;
    notes?: string;
  };

  // Attachments
  csvFileUrl?: string;
  pdfFileUrl?: string;
}

export interface SendRequestInput {
  ticketId: string;
  supplierId: string;
  items: PlanningRequestItem[];
  deliveryDate?: Date;
  notes?: string;
  attachCSV?: boolean;
  attachPDF?: boolean;
}

export interface SendRequestResult {
  success: boolean;
  requestId?: string;
  requestNumber?: string;
  error?: string;
}

// Demo suppliers
export const DEMO_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    name: 'Fashion Manufacturing Co.',
    code: 'FMC',
    email: 'orders@fashionmfg.com',
    contactPerson: 'John Smith',
    phone: '+1 555-0123',
    method: 'email',
  },
  {
    id: 'sup-002',
    name: 'Global Textile Partners',
    code: 'GTP',
    email: 'procurement@globaltextile.com',
    contactPerson: 'Sarah Lee',
    phone: '+1 555-0456',
    method: 'api',
    apiEndpoint: 'https://api.globaltextile.com/orders',
  },
  {
    id: 'sup-003',
    name: 'Premium Garments Ltd.',
    code: 'PGL',
    email: 'sales@premiumgarments.com',
    contactPerson: 'Michael Chen',
    phone: '+1 555-0789',
    method: 'email',
  },
];

export const SUPPLIER_METHOD_CONFIG: Record<SupplierRequestMethod, {
  label: string;
  icon: string;
  description: string;
}> = {
  email: {
    label: 'Email',
    icon: 'Mail',
    description: 'Send request via email',
  },
  api: {
    label: 'API Integration',
    icon: 'Globe',
    description: 'Direct API connection',
  },
  manual: {
    label: 'Manual',
    icon: 'FileText',
    description: 'Download and send manually',
  },
};

export const SUPPLIER_STATUS_CONFIG: Record<SupplierRequestStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  draft: {
    label: 'Draft',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-muted',
  },
  pending: {
    label: 'Pending',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  sent: {
    label: 'Sent',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  acknowledged: {
    label: 'Acknowledged',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
};

// Generate request number
export function generateRequestNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PR-${year}-${random}`;
}
