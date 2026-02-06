/**
 * Data Cleaner Rules
 * Implements the 7 quality check rules
 */

import {
  CleanerRule,
  DataIssue,
  IssueType,
  RuleOptions,
} from './types';

/**
 * Generate unique issue ID
 */
function generateIssueId(type: IssueType, row: number, column: string): string {
  return `${type}-${row}-${column}-${Date.now()}`;
}

/**
 * Rule 1: Duplicate Detection
 * Finds duplicate rows based on key columns
 */
export const duplicateRule: CleanerRule = {
  id: 'duplicates',
  name: 'Phát hiện trùng lặp',
  description: 'Tìm các hàng trùng lặp dựa trên cột khóa',
  enabled: true,
  severity: 'critical',

  check(data: Record<string, unknown>[], options?: RuleOptions): DataIssue[] {
    const issues: DataIssue[] = [];
    const seen = new Map<string, number>();
    const keyColumns = options?.columns || ['sku', 'skuCode'];

    data.forEach((row, index) => {
      // Build key from key columns
      const keyParts: string[] = [];
      for (const col of keyColumns) {
        if (row[col] !== undefined) {
          keyParts.push(String(row[col]).toLowerCase().trim());
        }
      }

      if (keyParts.length === 0) return;

      const key = keyParts.join('|');
      const existingRow = seen.get(key);

      if (existingRow !== undefined) {
        issues.push({
          id: generateIssueId('DUPLICATE', index + 2, keyColumns[0]),
          type: 'DUPLICATE',
          severity: 'critical',
          row: index + 2, // Excel row number
          column: keyColumns[0],
          value: keyParts[0],
          message: `Hàng trùng lặp với hàng ${existingRow + 2}`,
          suggestion: 'Xóa hàng trùng lặp hoặc hợp nhất dữ liệu',
          autoFixable: true,
        });
      } else {
        seen.set(key, index);
      }
    });

    return issues;
  },

  fix(data: Record<string, unknown>[], issues: DataIssue[]): Record<string, unknown>[] {
    const duplicateRows = new Set(issues.map(i => i.row - 2)); // Convert back to 0-indexed
    return data.filter((_, index) => !duplicateRows.has(index));
  },
};

/**
 * Rule 2: Missing Value Detection
 * Finds empty or null values in required columns
 */
export const missingValueRule: CleanerRule = {
  id: 'missingValues',
  name: 'Phát hiện giá trị thiếu',
  description: 'Tìm các ô trống hoặc null trong cột bắt buộc',
  enabled: true,
  severity: 'critical',

  check(data: Record<string, unknown>[], options?: RuleOptions): DataIssue[] {
    const issues: DataIssue[] = [];
    const requiredColumns = options?.columns || [];

    data.forEach((row, index) => {
      for (const column of requiredColumns) {
        const value = row[column];

        if (value === undefined || value === null || value === '') {
          issues.push({
            id: generateIssueId('MISSING_VALUE', index + 2, column),
            type: 'MISSING_VALUE',
            severity: 'critical',
            row: index + 2,
            column,
            value,
            message: `Thiếu giá trị bắt buộc trong cột "${column}"`,
            suggestion: 'Điền giá trị hoặc xóa hàng',
            autoFixable: false,
          });
        }
      }
    });

    return issues;
  },
};

/**
 * Rule 3: Outlier Detection
 * Finds values that are statistical outliers
 */
export const outlierRule: CleanerRule = {
  id: 'outliers',
  name: 'Phát hiện giá trị ngoại lai',
  description: 'Tìm các giá trị bất thường (outliers) trong dữ liệu số',
  enabled: true,
  severity: 'warning',

  check(data: Record<string, unknown>[], options?: RuleOptions): DataIssue[] {
    const issues: DataIssue[] = [];
    const threshold = options?.threshold || 3; // Standard deviations
    const numericColumns = options?.columns || [];

    for (const column of numericColumns) {
      // Extract numeric values
      const values: number[] = [];
      const rowIndices: number[] = [];

      data.forEach((row, index) => {
        const value = row[column];
        const numValue = typeof value === 'number' ? value : parseFloat(String(value));

        if (!isNaN(numValue)) {
          values.push(numValue);
          rowIndices.push(index);
        }
      });

      if (values.length < 3) continue; // Need at least 3 values for outlier detection

      // Calculate mean and standard deviation
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
      const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);

      if (stdDev === 0) continue; // All values are the same

      // Find outliers
      values.forEach((value, i) => {
        const zScore = Math.abs((value - mean) / stdDev);

        if (zScore > threshold) {
          const rowIndex = rowIndices[i];
          issues.push({
            id: generateIssueId('OUTLIER', rowIndex + 2, column),
            type: 'OUTLIER',
            severity: 'warning',
            row: rowIndex + 2,
            column,
            value,
            message: `Giá trị ngoại lai (z-score: ${zScore.toFixed(2)})`,
            suggestion: `Giá trị trung bình: ${mean.toFixed(2)}. Kiểm tra xem giá trị ${value} có đúng không`,
            autoFixable: false,
          });
        }
      });
    }

    return issues;
  },
};

/**
 * Rule 4: Format Error Detection
 * Validates data formats (dates, numbers, etc.)
 */
export const formatErrorRule: CleanerRule = {
  id: 'formatErrors',
  name: 'Phát hiện lỗi định dạng',
  description: 'Kiểm tra định dạng dữ liệu (số, ngày, v.v.)',
  enabled: true,
  severity: 'warning',

  check(data: Record<string, unknown>[], options?: RuleOptions): DataIssue[] {
    const issues: DataIssue[] = [];
    const numericColumns = options?.columns || [];

    data.forEach((row, index) => {
      for (const column of numericColumns) {
        const value = row[column];

        if (value === undefined || value === null || value === '') continue;

        // Check if should be numeric but isn't
        const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[$€£,]/g, ''));

        if (isNaN(numValue)) {
          issues.push({
            id: generateIssueId('FORMAT_ERROR', index + 2, column),
            type: 'FORMAT_ERROR',
            severity: 'warning',
            row: index + 2,
            column,
            value,
            message: `Giá trị "${value}" không phải số hợp lệ`,
            suggestion: 'Sửa định dạng thành số',
            autoFixable: true,
            fixedValue: 0,
          });
        }

        // Check for negative values in price/quantity columns
        if (numValue < 0 && ['price', 'quantity', 'cost', 'retail'].some(k => column.toLowerCase().includes(k))) {
          issues.push({
            id: generateIssueId('FORMAT_ERROR', index + 2, column),
            type: 'FORMAT_ERROR',
            severity: 'warning',
            row: index + 2,
            column,
            value,
            message: `Giá trị âm không hợp lệ cho cột "${column}"`,
            suggestion: 'Sửa thành giá trị dương',
            autoFixable: true,
            fixedValue: Math.abs(numValue),
          });
        }
      }
    });

    return issues;
  },

  fix(data: Record<string, unknown>[], issues: DataIssue[]): Record<string, unknown>[] {
    const issueMap = new Map<string, DataIssue>();
    issues.forEach(issue => {
      issueMap.set(`${issue.row}-${issue.column}`, issue);
    });

    return data.map((row, index) => {
      const newRow = { ...row };

      for (const [key] of Object.entries(newRow)) {
        const issue = issueMap.get(`${index + 2}-${key}`);
        if (issue && issue.autoFixable && issue.fixedValue !== undefined) {
          newRow[key] = issue.fixedValue;
        }
      }

      return newRow;
    });
  },
};

/**
 * Rule 5: Consistency Check
 * Validates consistency within categories
 */
export const consistencyRule: CleanerRule = {
  id: 'consistency',
  name: 'Kiểm tra tính nhất quán',
  description: 'Kiểm tra tính nhất quán của dữ liệu phân loại',
  enabled: true,
  severity: 'warning',

  check(data: Record<string, unknown>[], options?: RuleOptions): DataIssue[] {
    const issues: DataIssue[] = [];
    const categoryColumns = options?.columns || ['category', 'gender'];

    for (const column of categoryColumns) {
      // Count occurrences of each value
      const valueCounts = new Map<string, number>();
      const normalizedMap = new Map<string, string[]>(); // normalized -> original values

      data.forEach(row => {
        const value = row[column];
        if (value === undefined || value === null || value === '') return;

        const strValue = String(value).trim();
        const normalized = strValue.toLowerCase();

        valueCounts.set(strValue, (valueCounts.get(strValue) || 0) + 1);

        if (!normalizedMap.has(normalized)) {
          normalizedMap.set(normalized, []);
        }
        if (!normalizedMap.get(normalized)!.includes(strValue)) {
          normalizedMap.get(normalized)!.push(strValue);
        }
      });

      // Find inconsistent capitalization/spelling
      for (const [normalized, variants] of normalizedMap.entries()) {
        if (variants.length > 1) {
          // Find the most common variant
          const sortedVariants = variants.sort((a, b) =>
            (valueCounts.get(b) || 0) - (valueCounts.get(a) || 0)
          );
          const suggestedValue = sortedVariants[0];

          // Report issues for less common variants
          data.forEach((row, index) => {
            const value = row[column];
            if (value === undefined || value === null) return;

            const strValue = String(value).trim();
            if (strValue !== suggestedValue && strValue.toLowerCase() === normalized) {
              issues.push({
                id: generateIssueId('INCONSISTENT', index + 2, column),
                type: 'INCONSISTENT',
                severity: 'warning',
                row: index + 2,
                column,
                value: strValue,
                message: `Giá trị "${strValue}" không nhất quán với "${suggestedValue}"`,
                suggestion: `Đổi thành "${suggestedValue}"`,
                autoFixable: true,
                fixedValue: suggestedValue,
              });
            }
          });
        }
      }
    }

    return issues;
  },

  fix(data: Record<string, unknown>[], issues: DataIssue[]): Record<string, unknown>[] {
    const issueMap = new Map<string, DataIssue>();
    issues.forEach(issue => {
      issueMap.set(`${issue.row}-${issue.column}`, issue);
    });

    return data.map((row, index) => {
      const newRow = { ...row };

      for (const [key] of Object.entries(newRow)) {
        const issue = issueMap.get(`${index + 2}-${key}`);
        if (issue && issue.autoFixable && issue.fixedValue !== undefined) {
          newRow[key] = issue.fixedValue;
        }
      }

      return newRow;
    });
  },
};

/**
 * Rule 6: Invalid Range Detection
 * Validates values are within expected ranges
 */
export const invalidRangeRule: CleanerRule = {
  id: 'invalidRange',
  name: 'Kiểm tra phạm vi giá trị',
  description: 'Kiểm tra giá trị nằm trong phạm vi cho phép',
  enabled: true,
  severity: 'warning',

  check(data: Record<string, unknown>[], options?: RuleOptions): DataIssue[] {
    const issues: DataIssue[] = [];

    // Default ranges for SKU data
    const ranges: Record<string, { min: number; max: number; name: string }> = {
      retailPrice: { min: 0.01, max: 100000, name: 'Giá bán' },
      costPrice: { min: 0.01, max: 50000, name: 'Giá vốn' },
      quantity: { min: 1, max: 100000, name: 'Số lượng' },
      margin: { min: 0, max: 100, name: 'Margin' },
    };

    data.forEach((row, index) => {
      for (const [column, range] of Object.entries(ranges)) {
        const value = row[column];
        if (value === undefined || value === null || value === '') continue;

        const numValue = typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(numValue)) continue;

        if (numValue < range.min || numValue > range.max) {
          issues.push({
            id: generateIssueId('INVALID_RANGE', index + 2, column),
            type: 'INVALID_RANGE',
            severity: 'warning',
            row: index + 2,
            column,
            value: numValue,
            message: `${range.name} (${numValue}) ngoài phạm vi cho phép (${range.min} - ${range.max})`,
            suggestion: 'Kiểm tra lại giá trị',
            autoFixable: false,
          });
        }
      }

      // Special check: costPrice should be less than retailPrice
      const cost = typeof row.costPrice === 'number' ? row.costPrice : parseFloat(String(row.costPrice));
      const retail = typeof row.retailPrice === 'number' ? row.retailPrice : parseFloat(String(row.retailPrice));

      if (!isNaN(cost) && !isNaN(retail) && cost >= retail) {
        issues.push({
          id: generateIssueId('INVALID_RANGE', index + 2, 'costPrice'),
          type: 'INVALID_RANGE',
          severity: 'critical',
          row: index + 2,
          column: 'costPrice',
          value: cost,
          message: `Giá vốn (${cost}) phải nhỏ hơn giá bán (${retail})`,
          suggestion: 'Kiểm tra lại giá vốn và giá bán',
          autoFixable: false,
        });
      }
    });

    return issues;
  },
};

/**
 * Rule 7: Type Mismatch Detection
 * Detects when values don't match expected types
 */
export const typeMismatchRule: CleanerRule = {
  id: 'typeMismatch',
  name: 'Kiểm tra kiểu dữ liệu',
  description: 'Phát hiện khi giá trị không khớp với kiểu dữ liệu mong đợi',
  enabled: true,
  severity: 'warning',

  check(data: Record<string, unknown>[], options?: RuleOptions): DataIssue[] {
    const issues: DataIssue[] = [];

    // Expected types for SKU fields
    const expectedTypes: Record<string, 'string' | 'number'> = {
      sku: 'string',
      skuCode: 'string',
      styleName: 'string',
      category: 'string',
      gender: 'string',
      retailPrice: 'number',
      costPrice: 'number',
      quantity: 'number',
      margin: 'number',
    };

    data.forEach((row, index) => {
      for (const [column, expectedType] of Object.entries(expectedTypes)) {
        const value = row[column];
        if (value === undefined || value === null || value === '') continue;

        const actualType = typeof value;

        if (expectedType === 'number') {
          // Allow strings that can be parsed as numbers
          const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[$€£,]/g, ''));

          if (isNaN(numValue) && actualType === 'string') {
            issues.push({
              id: generateIssueId('TYPE_MISMATCH', index + 2, column),
              type: 'TYPE_MISMATCH',
              severity: 'warning',
              row: index + 2,
              column,
              value,
              message: `Cột "${column}" mong đợi số nhưng nhận được "${value}"`,
              suggestion: 'Chuyển đổi sang định dạng số',
              autoFixable: false,
            });
          }
        } else if (expectedType === 'string' && actualType === 'number') {
          // Usually okay, just informational
        }
      }
    });

    return issues;
  },
};

// Export all rules
export const ALL_RULES: CleanerRule[] = [
  duplicateRule,
  missingValueRule,
  outlierRule,
  formatErrorRule,
  consistencyRule,
  invalidRangeRule,
  typeMismatchRule,
];

// Get rule by ID
export function getRule(id: string): CleanerRule | undefined {
  return ALL_RULES.find(r => r.id === id);
}
