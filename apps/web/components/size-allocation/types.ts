/**
 * Size Allocation Types
 *
 * For tracking Choice A/B/C quantities by size
 * Maps to Excel columns: QTY A, QTY B, QTY C
 */

export type ChoiceType = 'A' | 'B' | 'C';

export interface SizeQuantity {
  size: string;
  qtyA: number;
  qtyB: number;
  qtyC: number;
  total: number;
  percentage: number;
}

export interface ChoiceAllocationData {
  id: string;
  skuId: string;
  skuCode: string;
  productName: string;
  category: string;
  gender: 'Male' | 'Female' | 'Unisex';

  // Choice totals
  totalA: number;
  totalB: number;
  totalC: number;
  grandTotal: number;

  // Size breakdown
  sizes: SizeQuantity[];

  // Allocation status
  status: 'draft' | 'allocated' | 'confirmed';
  isLocked: boolean;
  lastModified?: Date;
  modifiedBy?: string;
}

export interface ChoiceSummary {
  choice: ChoiceType;
  totalUnits: number;
  totalValue: number;
  percentage: number;
  skuCount: number;
}

export interface SizeTemplate {
  id: string;
  name: string;
  sizes: string[];
  defaultDistribution: Record<string, number>; // size -> percentage
}

export const DEFAULT_SIZE_TEMPLATES: SizeTemplate[] = [
  {
    id: 'mens-clothing',
    name: 'Men\'s Clothing',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    defaultDistribution: { XS: 5, S: 15, M: 30, L: 30, XL: 15, XXL: 5 },
  },
  {
    id: 'womens-clothing',
    name: 'Women\'s Clothing',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    defaultDistribution: { XS: 10, S: 25, M: 30, L: 25, XL: 10 },
  },
  {
    id: 'numeric-shoes',
    name: 'Numeric (Shoes)',
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    defaultDistribution: { '38': 5, '39': 10, '40': 20, '41': 20, '42': 20, '43': 15, '44': 7, '45': 3 },
  },
  {
    id: 'onesize',
    name: 'One Size',
    sizes: ['OS'],
    defaultDistribution: { OS: 100 },
  },
];

export const CHOICE_CONFIG: Record<ChoiceType, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}> = {
  A: {
    label: 'Choice A',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-500',
    description: 'Primary allocation - highest priority',
  },
  B: {
    label: 'Choice B',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-500',
    description: 'Secondary allocation - backup option',
  },
  C: {
    label: 'Choice C',
    color: 'text-sky-700 dark:text-sky-300',
    bgColor: 'bg-sky-50 dark:bg-sky-900/20',
    borderColor: 'border-sky-500',
    description: 'Tertiary allocation - optional',
  },
};

// ============================================
// Sizing Version Types
// ============================================

export type SizingVersionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CURRENT' | 'FINAL';

export interface SizingVersionChange {
  id: string;
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  sizeName?: string;
  skuCode?: string;
  changeType: 'UPDATE' | 'CREATE' | 'DELETE';
}

export interface SizingVersion {
  id: string;
  versionNumber: number;
  name: string;
  description?: string;
  status: SizingVersionStatus;
  snapshotData: ChoiceAllocationData[];
  totalUnits: number;
  totalValue: number;
  changes: SizingVersionChange[];
  tags: string[];
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  approvedAt?: Date;
  approvedBy?: {
    id: string;
    name: string;
  };
}

export interface SizingVersionComparison {
  leftVersion: SizingVersion;
  rightVersion: SizingVersion;
  changes: {
    added: SizingVersionChange[];
    removed: SizingVersionChange[];
    modified: SizingVersionChange[];
  };
  summary: {
    totalChanges: number;
    unitsDiff: number;
    valueDiff: number;
  };
}

export const SIZING_VERSION_STATUS_CONFIG: Record<SizingVersionStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-slate-600',
    bgColor: 'bg-muted',
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  APPROVED: {
    label: 'Approved',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  CURRENT: {
    label: 'Current',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  FINAL: {
    label: 'Final',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
};
