// What-If Simulator Types

export type ScenarioStatus = 'DRAFT' | 'ANALYZING' | 'COMPLETED' | 'APPLIED' | 'ARCHIVED';

export interface ScenarioParameter {
  name: string;
  label: string;
  baseValue: number;
  newValue: number;
  changePercent: number;
  unit: string;
  min: number;
  max: number;
  step: number;
}

export interface ScenarioImpact {
  metric: string;
  label: string;
  baseValue: number;
  projectedValue: number;
  change: number;
  changePercent: number;
  direction: 'positive' | 'negative' | 'neutral';
  significance: 'low' | 'medium' | 'high';
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  baseSeasonId: string;
  baseBudgetId?: string;
  parameters: ScenarioParameter[];
  impactSummary: ScenarioImpact[];
  detailedResults?: ScenarioDetailedResults;
  status: ScenarioStatus;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenarioDetailedResults {
  byBrand: {
    brandId: string;
    brandName: string;
    impacts: ScenarioImpact[];
  }[];
  byCategory: {
    categoryId: string;
    categoryName: string;
    impacts: ScenarioImpact[];
  }[];
  timeline: {
    period: string;
    impacts: ScenarioImpact[];
  }[];
}

export interface SimulationRequest {
  baseSeasonId: string;
  baseBudgetId?: string;
  parameters: {
    name: string;
    newValue: number;
  }[];
}

export interface SimulationResult {
  scenarioId?: string;
  parameters: ScenarioParameter[];
  baselineMetrics: MetricSet;
  projectedMetrics: MetricSet;
  impacts: ScenarioImpact[];
  risks: string[];
  opportunities: string[];
  recommendation: string;
  confidence: number;
}

export interface MetricSet {
  totalBudget: number;
  totalOTB: number;
  grossMargin: number;
  sellThrough: number;
  inventoryTurn: number;
  skuCount: number;
  averageOrderValue: number;
}

// Adjustable parameters
export const SIMULATION_PARAMETERS = {
  BUDGET_CHANGE: {
    name: 'budgetChange',
    label: 'Budget Change',
    unit: '%',
    min: -50,
    max: 50,
    step: 5,
    defaultValue: 0,
  },
  CATEGORY_MIX: {
    name: 'categoryMix',
    label: 'Category Mix',
    unit: 'reallocation',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 0,
  },
  PRICE_SHIFT: {
    name: 'priceShift',
    label: 'Price Point Shift',
    unit: '%',
    min: -20,
    max: 20,
    step: 2,
    defaultValue: 0,
  },
  MARKDOWN_TIMING: {
    name: 'markdownTiming',
    label: 'Markdown Timing',
    unit: 'weeks',
    min: -4,
    max: 4,
    step: 1,
    defaultValue: 0,
  },
  SKU_COUNT: {
    name: 'skuCount',
    label: 'SKU Count',
    unit: '%',
    min: -30,
    max: 30,
    step: 5,
    defaultValue: 0,
  },
} as const;
