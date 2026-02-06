/**
 * Context Types for OTB AI Assistant
 */

export interface OTBMetrics {
  totalBudget: number;
  totalUnits: number;
  aur: number;        // Average Unit Retail
  auc: number;        // Average Unit Cost
  margin: number;     // Margin percentage
  sellThrough: number;
  buyPercentage: number;
  salesPercentage: number;
}

export interface CategoryData {
  name: string;
  budget: number;
  units: number;
  margin: number;
  performance?: 'above' | 'below' | 'on-target';
}

export interface AlertData {
  type: 'warning' | 'error' | 'info';
  message: string;
  category?: string;
  metric?: string;
}

export interface OTBContext {
  // Identification
  planId: string;
  planName: string;

  // Dimensions
  division?: string;
  brand?: string;
  season?: string;
  year?: number;

  // Metrics
  metrics: OTBMetrics;

  // Breakdown
  categories: CategoryData[];

  // Alerts & Insights
  alerts: AlertData[];

  // Time context
  asOfDate?: string;
  lastUpdated?: string;
}

export interface ContextBuildOptions {
  includeCategories?: boolean;
  maxCategories?: number;
  includeAlerts?: boolean;
  includeMetrics?: boolean;
}
