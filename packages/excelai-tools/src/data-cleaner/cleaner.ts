/**
 * Data Cleaner
 * Main class for data quality analysis and cleaning
 */

import {
  CleanerConfig,
  CleaningResult,
  CleaningSummary,
  DataIssue,
  DataQualityScore,
  DEFAULT_CLEANER_CONFIG,
  SKU_CLEANER_CONFIG,
} from './types';

import {
  ALL_RULES,
  duplicateRule,
  missingValueRule,
  outlierRule,
  formatErrorRule,
  consistencyRule,
  invalidRangeRule,
  typeMismatchRule,
} from './rules';

/**
 * Data Cleaner Class
 */
export class DataCleaner {
  private config: CleanerConfig;

  constructor(config: Partial<CleanerConfig> = {}) {
    this.config = { ...DEFAULT_CLEANER_CONFIG, ...config };
  }

  /**
   * Analyze data quality without modifying
   */
  analyze(data: Record<string, unknown>[]): CleaningResult {
    const startTime = Date.now();
    const issues: DataIssue[] = [];

    // Run enabled rules
    if (this.config.rules.duplicates) {
      const duplicateIssues = duplicateRule.check(data, {
        columns: this.config.requiredColumns.filter(c => c.includes('sku') || c.includes('code')),
      });
      issues.push(...duplicateIssues);
    }

    if (this.config.rules.missingValues) {
      const missingIssues = missingValueRule.check(data, {
        columns: this.config.requiredColumns,
      });
      issues.push(...missingIssues);
    }

    if (this.config.rules.outliers) {
      const outlierIssues = outlierRule.check(data, {
        columns: this.config.numericColumns,
        threshold: this.config.outlierThreshold,
      });
      issues.push(...outlierIssues);
    }

    if (this.config.rules.formatErrors) {
      const formatIssues = formatErrorRule.check(data, {
        columns: this.config.numericColumns,
      });
      issues.push(...formatIssues);
    }

    if (this.config.rules.consistency) {
      const consistencyIssues = consistencyRule.check(data, {
        columns: this.config.categoryColumns,
      });
      issues.push(...consistencyIssues);
    }

    if (this.config.rules.invalidRange) {
      const rangeIssues = invalidRangeRule.check(data);
      issues.push(...rangeIssues);
    }

    if (this.config.rules.typeMismatch) {
      const typeIssues = typeMismatchRule.check(data);
      issues.push(...typeIssues);
    }

    const executionTime = Date.now() - startTime;

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(data, issues);

    // Create summary
    const summary = this.createSummary(issues, executionTime);

    return {
      success: issues.filter(i => i.severity === 'critical').length === 0,
      originalRowCount: data.length,
      cleanedRowCount: data.length,
      issuesFound: issues.length,
      issuesFixed: 0,
      issues,
      qualityScore,
      summary,
    };
  }

  /**
   * Clean data by fixing auto-fixable issues
   */
  clean(data: Record<string, unknown>[]): CleaningResult {
    const startTime = Date.now();
    let workingData = [...data];
    const allIssues: DataIssue[] = [];
    let issuesFixed = 0;

    // Step 1: Remove duplicates if enabled
    if (this.config.rules.duplicates && this.config.removeDuplicates) {
      const duplicateIssues = duplicateRule.check(workingData, {
        columns: this.config.requiredColumns.filter(c => c.includes('sku') || c.includes('code')),
      });
      allIssues.push(...duplicateIssues);

      if (duplicateIssues.length > 0 && duplicateRule.fix) {
        workingData = duplicateRule.fix(workingData, duplicateIssues);
        issuesFixed += duplicateIssues.length;
      }
    }

    // Step 2: Check and fix format errors
    if (this.config.rules.formatErrors && this.config.autoFix) {
      const formatIssues = formatErrorRule.check(workingData, {
        columns: this.config.numericColumns,
      });
      allIssues.push(...formatIssues);

      const fixableFormatIssues = formatIssues.filter(i => i.autoFixable);
      if (fixableFormatIssues.length > 0 && formatErrorRule.fix) {
        workingData = formatErrorRule.fix(workingData, fixableFormatIssues);
        issuesFixed += fixableFormatIssues.length;
      }
    }

    // Step 3: Fix consistency issues
    if (this.config.rules.consistency && this.config.autoFix) {
      const consistencyIssues = consistencyRule.check(workingData, {
        columns: this.config.categoryColumns,
      });
      allIssues.push(...consistencyIssues);

      const fixableConsistencyIssues = consistencyIssues.filter(i => i.autoFixable);
      if (fixableConsistencyIssues.length > 0 && consistencyRule.fix) {
        workingData = consistencyRule.fix(workingData, fixableConsistencyIssues);
        issuesFixed += fixableConsistencyIssues.length;
      }
    }

    // Step 4: Check remaining issues (non-fixable)
    if (this.config.rules.missingValues) {
      const missingIssues = missingValueRule.check(workingData, {
        columns: this.config.requiredColumns,
      });
      allIssues.push(...missingIssues);
    }

    if (this.config.rules.outliers) {
      const outlierIssues = outlierRule.check(workingData, {
        columns: this.config.numericColumns,
        threshold: this.config.outlierThreshold,
      });
      allIssues.push(...outlierIssues);
    }

    if (this.config.rules.invalidRange) {
      const rangeIssues = invalidRangeRule.check(workingData);
      allIssues.push(...rangeIssues);
    }

    if (this.config.rules.typeMismatch) {
      const typeIssues = typeMismatchRule.check(workingData);
      allIssues.push(...typeIssues);
    }

    const executionTime = Date.now() - startTime;

    // Calculate quality score on cleaned data
    const qualityScore = this.calculateQualityScore(workingData, allIssues);

    // Create summary
    const summary = this.createSummary(allIssues, executionTime, {
      duplicatesRemoved: this.config.removeDuplicates
        ? allIssues.filter(i => i.type === 'DUPLICATE').length
        : 0,
      formatErrorsFixed: issuesFixed,
    });

    return {
      success: allIssues.filter(i => i.severity === 'critical').length === 0,
      originalRowCount: data.length,
      cleanedRowCount: workingData.length,
      issuesFound: allIssues.length,
      issuesFixed,
      issues: allIssues,
      qualityScore,
      cleanedData: workingData,
      summary,
    };
  }

  /**
   * Calculate data quality score
   */
  private calculateQualityScore(data: Record<string, unknown>[], issues: DataIssue[]): DataQualityScore {
    const totalCells = data.length * Object.keys(data[0] || {}).length;
    if (totalCells === 0) {
      return { overall: 0, completeness: 0, accuracy: 0, consistency: 0, validity: 0 };
    }

    // Completeness: percentage of non-empty cells
    const missingCount = issues.filter(i => i.type === 'MISSING_VALUE').length;
    const completeness = Math.max(0, 100 - (missingCount / totalCells) * 100);

    // Accuracy: inverse of outliers and invalid ranges
    const inaccurateCount = issues.filter(i =>
      i.type === 'OUTLIER' || i.type === 'INVALID_RANGE'
    ).length;
    const accuracy = Math.max(0, 100 - (inaccurateCount / data.length) * 100);

    // Consistency: inverse of inconsistency issues
    const inconsistentCount = issues.filter(i => i.type === 'INCONSISTENT').length;
    const consistency = Math.max(0, 100 - (inconsistentCount / data.length) * 100);

    // Validity: inverse of format and type errors
    const invalidCount = issues.filter(i =>
      i.type === 'FORMAT_ERROR' || i.type === 'TYPE_MISMATCH'
    ).length;
    const validity = Math.max(0, 100 - (invalidCount / totalCells) * 100);

    // Overall: weighted average
    const overall = (completeness * 0.3 + accuracy * 0.25 + consistency * 0.25 + validity * 0.2);

    return {
      overall: Math.round(overall * 10) / 10,
      completeness: Math.round(completeness * 10) / 10,
      accuracy: Math.round(accuracy * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
      validity: Math.round(validity * 10) / 10,
    };
  }

  /**
   * Create cleaning summary
   */
  private createSummary(
    issues: DataIssue[],
    executionTimeMs: number,
    overrides: Partial<CleaningSummary> = {}
  ): CleaningSummary {
    return {
      duplicatesRemoved: overrides.duplicatesRemoved ??
        issues.filter(i => i.type === 'DUPLICATE').length,
      missingValuesFilled: overrides.missingValuesFilled ?? 0,
      outliersDetected: issues.filter(i => i.type === 'OUTLIER').length,
      formatErrorsFixed: overrides.formatErrorsFixed ?? 0,
      inconsistenciesFixed: overrides.inconsistenciesFixed ?? 0,
      executionTimeMs,
    };
  }

  /**
   * Get issues by severity
   */
  getIssuesBySeverity(result: CleaningResult): {
    critical: DataIssue[];
    warning: DataIssue[];
    info: DataIssue[];
  } {
    return {
      critical: result.issues.filter(i => i.severity === 'critical'),
      warning: result.issues.filter(i => i.severity === 'warning'),
      info: result.issues.filter(i => i.severity === 'info'),
    };
  }

  /**
   * Get issues by type
   */
  getIssuesByType(result: CleaningResult): Record<string, DataIssue[]> {
    const grouped: Record<string, DataIssue[]> = {};

    for (const issue of result.issues) {
      if (!grouped[issue.type]) {
        grouped[issue.type] = [];
      }
      grouped[issue.type].push(issue);
    }

    return grouped;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<CleanerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CleanerConfig {
    return { ...this.config };
  }
}

/**
 * Create SKU-specific cleaner
 */
export function createSKUCleaner(overrides: Partial<CleanerConfig> = {}): DataCleaner {
  return new DataCleaner({ ...SKU_CLEANER_CONFIG, ...overrides });
}

/**
 * Quick analyze function
 */
export function analyzeData(
  data: Record<string, unknown>[],
  config?: Partial<CleanerConfig>
): CleaningResult {
  const cleaner = new DataCleaner(config);
  return cleaner.analyze(data);
}

/**
 * Quick clean function
 */
export function cleanData(
  data: Record<string, unknown>[],
  config?: Partial<CleanerConfig>
): CleaningResult {
  const cleaner = new DataCleaner({ ...config, autoFix: true, removeDuplicates: true });
  return cleaner.clean(data);
}
