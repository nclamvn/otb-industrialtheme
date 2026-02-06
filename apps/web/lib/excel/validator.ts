import { ParsedSKU, ParseError } from './parser';

export interface ValidationResult {
  sku: ParsedSKU;
  status: 'valid' | 'warning' | 'error';
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface ValidationContext {
  existingSKUs: string[];
  validCategories: { id: string; code: string; name: string }[];
  validSubcategories: { id: string; code: string; categoryId: string; name: string }[];
  validCollections: { id: string; code: string; name: string }[];
  seasonBudget: number;
  minMargin?: number;
  maxMargin?: number;
}

// SKU Code validation pattern (brand prefix + category + number)
const SKU_CODE_PATTERN = /^[A-Z]{2,4}-[A-Z0-9]{2,4}-[A-Z0-9]{2,8}$/i;

// Validate all SKUs
export function validateSKUs(
  skus: ParsedSKU[],
  context: ValidationContext
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const skuCodes = new Set<string>();

  for (const sku of skus) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate SKU Code format
    if (!SKU_CODE_PATTERN.test(sku.skuCode)) {
      warnings.push({
        field: 'skuCode',
        message: `SKU code format may not match standard pattern (expected: BRAND-CAT-CODE)`,
        code: 'SKU_FORMAT_WARN',
      });
    }

    // Check for duplicate SKU codes within upload
    if (skuCodes.has(sku.skuCode)) {
      errors.push({
        field: 'skuCode',
        message: `Duplicate SKU code in upload: ${sku.skuCode}`,
        code: 'DUPLICATE_SKU',
      });
    } else {
      skuCodes.add(sku.skuCode);
    }

    // Check for existing SKU in database
    if (context.existingSKUs.includes(sku.skuCode)) {
      warnings.push({
        field: 'skuCode',
        message: `SKU already exists in system. Will update if proceeding.`,
        code: 'EXISTING_SKU',
      });
    }

    // Validate category
    const categoryMatch = context.validCategories.find(
      (c) =>
        c.code.toLowerCase() === sku.category.toLowerCase() ||
        c.name.toLowerCase() === sku.category.toLowerCase()
    );
    if (!categoryMatch) {
      errors.push({
        field: 'category',
        message: `Invalid category: "${sku.category}". Valid categories: ${context.validCategories.map((c) => c.code).join(', ')}`,
        code: 'INVALID_CATEGORY',
      });
    }

    // Validate subcategory if provided
    if (sku.subcategory && categoryMatch) {
      const subcategoryMatch = context.validSubcategories.find(
        (s) =>
          (s.code.toLowerCase() === sku.subcategory?.toLowerCase() ||
            s.name.toLowerCase() === sku.subcategory?.toLowerCase()) &&
          s.categoryId === categoryMatch.id
      );
      if (!subcategoryMatch) {
        warnings.push({
          field: 'subcategory',
          message: `Subcategory "${sku.subcategory}" not found for category "${sku.category}"`,
          code: 'INVALID_SUBCATEGORY',
        });
      }
    }

    // Validate collection if provided
    if (sku.collection) {
      const collectionMatch = context.validCollections.find(
        (c) =>
          c.code.toLowerCase() === sku.collection?.toLowerCase() ||
          c.name.toLowerCase() === sku.collection?.toLowerCase()
      );
      if (!collectionMatch) {
        warnings.push({
          field: 'collection',
          message: `Collection "${sku.collection}" not found in system`,
          code: 'INVALID_COLLECTION',
        });
      }
    }

    // Validate gender
    const validGenders = ['MEN', 'WOMEN', 'UNISEX', 'KIDS'];
    if (!validGenders.includes(sku.gender.toUpperCase())) {
      errors.push({
        field: 'gender',
        message: `Invalid gender: "${sku.gender}". Valid values: ${validGenders.join(', ')}`,
        code: 'INVALID_GENDER',
      });
    }

    // Validate margin range
    const minMargin = context.minMargin || 40;
    const maxMargin = context.maxMargin || 85;
    if (sku.margin !== undefined) {
      if (sku.margin < minMargin) {
        warnings.push({
          field: 'margin',
          message: `Margin (${sku.margin.toFixed(1)}%) is below minimum threshold (${minMargin}%)`,
          code: 'LOW_MARGIN',
        });
      }
      if (sku.margin > maxMargin) {
        warnings.push({
          field: 'margin',
          message: `Margin (${sku.margin.toFixed(1)}%) exceeds maximum threshold (${maxMargin}%)`,
          code: 'HIGH_MARGIN',
        });
      }
    }

    // Validate cost < retail
    if (sku.costPrice >= sku.retailPrice) {
      errors.push({
        field: 'pricing',
        message: `Cost price ($${sku.costPrice}) must be less than retail price ($${sku.retailPrice})`,
        code: 'INVALID_PRICING',
      });
    }

    // Validate order quantity
    if (sku.orderQuantity < 1) {
      errors.push({
        field: 'orderQuantity',
        message: `Order quantity must be at least 1`,
        code: 'INVALID_QUANTITY',
      });
    }

    // Validate MOQ if provided
    if (sku.moq && sku.orderQuantity < sku.moq) {
      warnings.push({
        field: 'orderQuantity',
        message: `Order quantity (${sku.orderQuantity}) is below MOQ (${sku.moq})`,
        code: 'BELOW_MOQ',
      });
    }

    // Validate size breakdown totals
    if (sku.sizeBreakdown) {
      const sizeTotal = Object.values(sku.sizeBreakdown).reduce(
        (sum, qty) => sum + qty,
        0
      );
      if (Math.abs(sizeTotal - sku.orderQuantity) > 1) {
        errors.push({
          field: 'sizeBreakdown',
          message: `Size breakdown total (${sizeTotal}) doesn't match order quantity (${sku.orderQuantity})`,
          code: 'SIZE_MISMATCH',
        });
      }
    }

    // Validate lead time
    if (sku.leadTime !== undefined && sku.leadTime > 180) {
      warnings.push({
        field: 'leadTime',
        message: `Lead time (${sku.leadTime} days) is unusually long`,
        code: 'LONG_LEAD_TIME',
      });
    }

    // Check for high value orders
    const orderValue = sku.orderQuantity * sku.retailPrice;
    if (orderValue > context.seasonBudget * 0.1) {
      warnings.push({
        field: 'orderValue',
        message: `High value order: $${orderValue.toLocaleString()} (>${10}% of season budget)`,
        code: 'HIGH_VALUE_ORDER',
      });
    }

    // Determine overall status
    let status: 'valid' | 'warning' | 'error' = 'valid';
    if (errors.length > 0) status = 'error';
    else if (warnings.length > 0) status = 'warning';

    results.push({
      sku,
      status,
      errors,
      warnings,
    });
  }

  return results;
}

// Get validation summary
export function getValidationSummary(results: ValidationResult[]): {
  total: number;
  valid: number;
  warnings: number;
  errors: number;
  canProceed: boolean;
  errorsByField: Record<string, number>;
  warningsByField: Record<string, number>;
} {
  const valid = results.filter((r) => r.status === 'valid').length;
  const warnings = results.filter((r) => r.status === 'warning').length;
  const errors = results.filter((r) => r.status === 'error').length;

  const errorsByField: Record<string, number> = {};
  const warningsByField: Record<string, number> = {};

  for (const result of results) {
    for (const error of result.errors) {
      errorsByField[error.field] = (errorsByField[error.field] || 0) + 1;
    }
    for (const warning of result.warnings) {
      warningsByField[warning.field] = (warningsByField[warning.field] || 0) + 1;
    }
  }

  return {
    total: results.length,
    valid,
    warnings,
    errors,
    canProceed: errors === 0,
    errorsByField,
    warningsByField,
  };
}

// Convert validation result to ParseError format for UI
export function toParseErrors(results: ValidationResult[]): ParseError[] {
  const errors: ParseError[] = [];

  for (const result of results) {
    for (const error of result.errors) {
      errors.push({
        row: result.sku.rowNumber,
        column: error.field,
        message: error.message,
        severity: 'error',
      });
    }
    for (const warning of result.warnings) {
      errors.push({
        row: result.sku.rowNumber,
        column: warning.field,
        message: warning.message,
        severity: 'warning',
      });
    }
  }

  return errors.sort((a, b) => a.row - b.row);
}

// Auto-fix common issues
export function autoFixSKU(sku: ParsedSKU): {
  fixed: ParsedSKU;
  changes: string[];
} {
  const changes: string[] = [];
  const fixed = { ...sku };

  // Normalize SKU code (uppercase)
  if (fixed.skuCode !== fixed.skuCode.toUpperCase()) {
    fixed.skuCode = fixed.skuCode.toUpperCase();
    changes.push('SKU code converted to uppercase');
  }

  // Normalize gender
  const genderMap: Record<string, string> = {
    M: 'MEN',
    MALE: 'MEN',
    F: 'WOMEN',
    FEMALE: 'WOMEN',
    W: 'WOMEN',
    U: 'UNISEX',
    K: 'KIDS',
  };
  const normalizedGender = genderMap[fixed.gender.toUpperCase()];
  if (normalizedGender && normalizedGender !== fixed.gender) {
    fixed.gender = normalizedGender;
    changes.push(`Gender normalized to ${normalizedGender}`);
  }

  // Trim whitespace from string fields
  if (fixed.styleName !== fixed.styleName.trim()) {
    fixed.styleName = fixed.styleName.trim();
    changes.push('Style name trimmed');
  }

  // Calculate margin if not provided
  if (fixed.margin === undefined && fixed.retailPrice > 0) {
    fixed.margin = ((fixed.retailPrice - fixed.costPrice) / fixed.retailPrice) * 100;
    changes.push('Margin calculated');
  }

  return { fixed, changes };
}
