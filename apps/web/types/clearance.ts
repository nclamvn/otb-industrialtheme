export type MarkdownPlanType = 'SEASONAL' | 'PROMOTIONAL' | 'CLEARANCE' | 'FLASH_SALE';
export type MarkdownPlanStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type MarkdownAction = 'NO_ACTION' | 'INCLUDE_PHASE_1' | 'INCLUDE_PHASE_2' | 'INCLUDE_PHASE_3' | 'IMMEDIATE_CLEAR' | 'REMOVE_FROM_FLOOR';

export interface MarkdownPhase {
  id: string;
  phaseName: string;
  phaseOrder: number;
  startDate: string;
  endDate: string;
  markdownPct: number;
}

export interface MarkdownSKUPlan {
  id: string;
  skuId: string;
  skuCode?: string;
  currentStock: number;
  currentWoC: number;
  currentSellThrough: number;
  recommendedAction: MarkdownAction;
  recommendedMarkdownPct?: number;
  predictedSellThrough?: number;
  predictedRevenue?: number;
  confidenceScore?: number;
  isOverridden: boolean;
}

export interface MarkdownPlan {
  id: string;
  planName: string;
  planType: MarkdownPlanType;
  status: MarkdownPlanStatus;
  seasonId: string;
  brandId: string;
  categoryId?: string;
  planStartDate: string;
  planEndDate: string;
  targetSellThroughPct: number;
  maxMarkdownPct: number;
  phases: MarkdownPhase[];
  skuPlans?: MarkdownSKUPlan[];
  createdAt: string;
}

export interface OptimizationResult {
  planId: string;
  totalSKUs: number;
  recommendations: MarkdownSKUPlan[];
  summary: {
    byAction: Record<MarkdownAction, number>;
    totalExpectedRevenue: number;
    avgConfidence: number;
  };
}

export interface SimulationResult {
  scenario: { markdownPct: number; skuIds: string[] };
  results: { totalRevenue: number; totalUnits: number; avgSellThrough: number; skuCount: number };
}
