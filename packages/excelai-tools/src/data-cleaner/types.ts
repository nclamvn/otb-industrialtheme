/**
 * Data Cleaner Types
 * Types for data quality analysis and cleaning
 */

export type IssueSeverity = 'critical' | 'warning' | 'info';

export type IssueType =
  | 'DUPLICATE'
  | 'MISSING_VALUE'
  | 'OUTLIER'
  | 'FORMAT_ERROR'
  | 'INCONSISTENT'
  | 'INVALID_RANGE'
  | 'TYPE_MISMATCH';

export interface DataIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  row: number;
  column: string;
  value: unknown;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  fixedValue?: unknown;
}

export interface DataQualityScore {
  overall: number; // 0-100
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
}

export interface CleaningResult {
  success: boolean;
  originalRowCount: number;
  cleanedRowCount: number;
  issuesFound: number;
  issuesFixed: number;
  issues: DataIssue[];
  qualityScore: DataQualityScore;
  cleanedData?: Record<string, unknown>[];
  summary: CleaningSummary;
}

export interface CleaningSummary {
  duplicatesRemoved: number;
  missingValuesFilled: number;
  outliersDetected: number;
  formatErrorsFixed: number;
  inconsistenciesFixed: number;
  executionTimeMs: number;
}

export interface CleanerRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: IssueSeverity;
  check: (data: Record<string, unknown>[], options?: RuleOptions) => DataIssue[];
  fix?: (data: Record<string, unknown>[], issues: DataIssue[]) => Record<string, unknown>[];
}

export interface RuleOptions {
  threshold?: number;
  columns?: string[];
  ignoreColumns?: string[];
  customValidation?: (value: unknown) => boolean;
}

export interface CleanerConfig {
  rules: {
    duplicates: boolean;
    missingValues: boolean;
    outliers: boolean;
    formatErrors: boolean;
    consistency: boolean;
    invalidRange: boolean;
    typeMismatch: boolean;
  };
  outlierThreshold: number; // Standard deviations
  requiredColumns: string[];
  numericColumns: string[];
  dateColumns: string[];
  categoryColumns: string[];
  autoFix: boolean;
  removeDuplicates: boolean;
}

export const DEFAULT_CLEANER_CONFIG: CleanerConfig = {
  rules: {
    duplicates: true,
    missingValues: true,
    outliers: true,
    formatErrors: true,
    consistency: true,
    invalidRange: true,
    typeMismatch: true,
  },
  outlierThreshold: 3,
  requiredColumns: [],
  numericColumns: [],
  dateColumns: [],
  categoryColumns: [],
  autoFix: false,
  removeDuplicates: false,
};

// SKU-specific configuration
export const SKU_CLEANER_CONFIG: CleanerConfig = {
  rules: {
    duplicates: true,
    missingValues: true,
    outliers: true,
    formatErrors: true,
    consistency: true,
    invalidRange: true,
    typeMismatch: true,
  },
  outlierThreshold: 3,
  requiredColumns: ['sku', 'styleName', 'category', 'gender', 'retailPrice', 'costPrice', 'quantity'],
  numericColumns: ['retailPrice', 'costPrice', 'quantity', 'margin'],
  dateColumns: [],
  categoryColumns: ['category', 'gender', 'color'],
  autoFix: false,
  removeDuplicates: true,
};
