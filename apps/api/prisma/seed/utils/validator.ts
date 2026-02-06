export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FieldValidator {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'email';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any, row: Record<string, any>) => string | null;
}

export class DataValidator {
  private validators: FieldValidator[];

  constructor(validators: FieldValidator[]) {
    this.validators = validators;
  }

  validateRow(row: Record<string, any>, rowIndex: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const validator of this.validators) {
      const value = row[validator.field];
      const fieldLabel = `Row ${rowIndex + 1}, field "${validator.field}"`;

      // Required check
      if (validator.required && (value === null || value === undefined || value === '')) {
        errors.push(`${fieldLabel}: required but missing`);
        continue;
      }

      // Skip further validation if value is empty and not required
      if (value === null || value === undefined || value === '') {
        continue;
      }

      // Type checks
      if (validator.type) {
        const typeError = this.validateType(value, validator.type, fieldLabel);
        if (typeError) errors.push(typeError);
      }

      // String length checks
      if (validator.minLength && typeof value === 'string' && value.length < validator.minLength) {
        errors.push(`${fieldLabel}: minimum length is ${validator.minLength}`);
      }

      if (validator.maxLength && typeof value === 'string' && value.length > validator.maxLength) {
        errors.push(`${fieldLabel}: maximum length is ${validator.maxLength}`);
      }

      // Number range checks
      if (validator.min !== undefined && typeof value === 'number' && value < validator.min) {
        errors.push(`${fieldLabel}: minimum value is ${validator.min}`);
      }

      if (validator.max !== undefined && typeof value === 'number' && value > validator.max) {
        errors.push(`${fieldLabel}: maximum value is ${validator.max}`);
      }

      // Pattern check
      if (validator.pattern && typeof value === 'string' && !validator.pattern.test(value)) {
        errors.push(`${fieldLabel}: invalid format`);
      }

      // Enum check
      if (validator.enum && !validator.enum.includes(value)) {
        errors.push(`${fieldLabel}: must be one of [${validator.enum.join(', ')}]`);
      }

      // Custom validation
      if (validator.custom) {
        const customError = validator.custom(value, row);
        if (customError) errors.push(`${fieldLabel}: ${customError}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateAll(rows: Record<string, any>[]): {
    validRows: Record<string, any>[];
    invalidRows: { row: Record<string, any>; errors: string[] }[];
    summary: { total: number; valid: number; invalid: number };
  } {
    const validRows: Record<string, any>[] = [];
    const invalidRows: { row: Record<string, any>; errors: string[] }[] = [];

    rows.forEach((row, index) => {
      const result = this.validateRow(row, index);
      if (result.valid) {
        validRows.push(row);
      } else {
        invalidRows.push({ row, errors: result.errors });
      }
    });

    return {
      validRows,
      invalidRows,
      summary: {
        total: rows.length,
        valid: validRows.length,
        invalid: invalidRows.length,
      },
    };
  }

  private validateType(value: any, type: string, fieldLabel: string): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${fieldLabel}: expected string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${fieldLabel}: expected number`;
        }
        break;
      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return `${fieldLabel}: expected valid date`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && !['true', 'false', '1', '0', 'yes', 'no'].includes(String(value).toLowerCase())) {
          return `${fieldLabel}: expected boolean`;
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `${fieldLabel}: expected valid email`;
        }
        break;
    }
    return null;
  }
}

// Common transformers
export const transformers = {
  toNumber: (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  },

  toBoolean: (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase();
    return ['true', '1', 'yes', 'y'].includes(str);
  },

  toDate: (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },

  toUpperCase: (value: any): string | null => {
    if (!value) return null;
    return String(value).toUpperCase().trim();
  },

  toLowerCase: (value: any): string | null => {
    if (!value) return null;
    return String(value).toLowerCase().trim();
  },

  trim: (value: any): string | null => {
    if (!value) return null;
    return String(value).trim();
  },

  toDecimal: (value: any, decimals: number = 2): number | null => {
    const num = transformers.toNumber(value);
    if (num === null) return null;
    return Number(num.toFixed(decimals));
  },
};
