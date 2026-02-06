/**
 * Data Cleaner Tests
 */

import {
  DataCleaner,
  createSKUCleaner,
  analyzeData,
  cleanData,
  duplicateRule,
  missingValueRule,
  outlierRule,
  formatErrorRule,
  consistencyRule,
  invalidRangeRule,
  typeMismatchRule,
  SKU_CLEANER_CONFIG,
} from '../index';

describe('Duplicate Rule', () => {
  it('should detect duplicate rows', () => {
    const data = [
      { sku: 'SKU001', name: 'Product 1' },
      { sku: 'SKU002', name: 'Product 2' },
      { sku: 'SKU001', name: 'Product 1 Duplicate' },
    ];

    const issues = duplicateRule.check(data, { columns: ['sku'] });
    expect(issues.length).toBe(1);
    expect(issues[0].type).toBe('DUPLICATE');
    expect(issues[0].row).toBe(4); // Excel row (1-indexed + header)
  });

  it('should not flag unique rows', () => {
    const data = [
      { sku: 'SKU001', name: 'Product 1' },
      { sku: 'SKU002', name: 'Product 2' },
      { sku: 'SKU003', name: 'Product 3' },
    ];

    const issues = duplicateRule.check(data, { columns: ['sku'] });
    expect(issues.length).toBe(0);
  });

  it('should fix duplicates by removing them', () => {
    const data = [
      { sku: 'SKU001', name: 'Product 1' },
      { sku: 'SKU002', name: 'Product 2' },
      { sku: 'SKU001', name: 'Duplicate' },
    ];

    const issues = duplicateRule.check(data, { columns: ['sku'] });
    const fixed = duplicateRule.fix!(data, issues);

    expect(fixed.length).toBe(2);
    expect(fixed.every(r => r.sku !== 'SKU001' || r.name !== 'Duplicate')).toBe(true);
  });
});

describe('Missing Value Rule', () => {
  it('should detect missing required values', () => {
    const data = [
      { sku: 'SKU001', name: 'Product 1', price: 100 },
      { sku: '', name: 'Product 2', price: 200 },
      { sku: 'SKU003', name: null, price: 300 },
    ];

    const issues = missingValueRule.check(data, { columns: ['sku', 'name'] });
    expect(issues.length).toBe(2);
    expect(issues.every(i => i.type === 'MISSING_VALUE')).toBe(true);
    expect(issues.every(i => i.severity === 'critical')).toBe(true);
  });

  it('should not flag optional columns', () => {
    const data = [
      { sku: 'SKU001', name: 'Product 1', optional: '' },
      { sku: 'SKU002', name: 'Product 2', optional: null },
    ];

    const issues = missingValueRule.check(data, { columns: ['sku', 'name'] });
    expect(issues.length).toBe(0);
  });
});

describe('Outlier Rule', () => {
  it('should detect statistical outliers', () => {
    const data = [
      { price: 100 },
      { price: 110 },
      { price: 105 },
      { price: 95 },
      { price: 102 },
      { price: 1000 }, // Outlier!
    ];

    const issues = outlierRule.check(data, { columns: ['price'], threshold: 2 });
    expect(issues.length).toBe(1);
    expect(issues[0].type).toBe('OUTLIER');
    expect(issues[0].value).toBe(1000);
  });

  it('should not flag values within threshold', () => {
    const data = [
      { price: 100 },
      { price: 110 },
      { price: 105 },
      { price: 95 },
      { price: 102 },
    ];

    const issues = outlierRule.check(data, { columns: ['price'], threshold: 3 });
    expect(issues.length).toBe(0);
  });
});

describe('Format Error Rule', () => {
  it('should detect non-numeric values in numeric columns', () => {
    const data = [
      { price: 100 },
      { price: 'not a number' },
      { price: 150 },
    ];

    const issues = formatErrorRule.check(data, { columns: ['price'] });
    expect(issues.length).toBe(1);
    expect(issues[0].type).toBe('FORMAT_ERROR');
  });

  it('should detect negative values in price columns', () => {
    const data = [
      { retailPrice: 100 },
      { retailPrice: -50 },
    ];

    const issues = formatErrorRule.check(data, { columns: ['retailPrice'] });
    expect(issues.length).toBe(1);
    expect(issues[0].message).toContain('âm');
  });

  it('should auto-fix negative prices', () => {
    const data = [
      { retailPrice: 100 },
      { retailPrice: -50 },
    ];

    const issues = formatErrorRule.check(data, { columns: ['retailPrice'] });
    const fixed = formatErrorRule.fix!(data, issues);

    expect(fixed[1].retailPrice).toBe(50);
  });
});

describe('Consistency Rule', () => {
  it('should detect inconsistent capitalization', () => {
    const data = [
      { category: 'Shirts' },
      { category: 'Shirts' },
      { category: 'shirts' }, // Inconsistent
      { category: 'SHIRTS' }, // Inconsistent
    ];

    const issues = consistencyRule.check(data, { columns: ['category'] });
    expect(issues.length).toBe(2);
    expect(issues.every(i => i.type === 'INCONSISTENT')).toBe(true);
  });

  it('should suggest most common variant', () => {
    const data = [
      { category: 'Shirts' },
      { category: 'Shirts' },
      { category: 'shirts' },
    ];

    const issues = consistencyRule.check(data, { columns: ['category'] });
    expect(issues.length).toBe(1);
    expect(issues[0].fixedValue).toBe('Shirts');
  });

  it('should fix inconsistent values', () => {
    const data = [
      { category: 'Shirts' },
      { category: 'Shirts' },
      { category: 'shirts' },
    ];

    const issues = consistencyRule.check(data, { columns: ['category'] });
    const fixed = consistencyRule.fix!(data, issues);

    expect(fixed[2].category).toBe('Shirts');
  });
});

describe('Invalid Range Rule', () => {
  it('should detect values outside valid range', () => {
    const data = [
      { retailPrice: 100, costPrice: 50 },
      { retailPrice: 0, costPrice: 50 }, // Invalid: price = 0
      { retailPrice: 100, costPrice: 150 }, // Invalid: cost > retail
    ];

    const issues = invalidRangeRule.check(data);
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });

  it('should flag cost >= retail as critical', () => {
    const data = [
      { retailPrice: 100, costPrice: 100 }, // cost = retail
    ];

    const issues = invalidRangeRule.check(data);
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    expect(criticalIssues.length).toBeGreaterThan(0);
  });
});

describe('Type Mismatch Rule', () => {
  it('should detect type mismatches', () => {
    const data = [
      { sku: 'SKU001', retailPrice: 100 },
      { sku: 123, retailPrice: 'not a price' }, // Both mismatched
    ];

    const issues = typeMismatchRule.check(data);
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe('DataCleaner', () => {
  describe('analyze', () => {
    it('should analyze data and return quality score', () => {
      const cleaner = createSKUCleaner();
      const data = [
        { sku: 'SKU001', styleName: 'Shirt', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 },
        { sku: 'SKU002', styleName: 'Pants', category: 'Bottoms', gender: 'Women', retailPrice: 150, costPrice: 75, quantity: 20 },
      ];

      const result = cleaner.analyze(data);

      expect(result.originalRowCount).toBe(2);
      expect(result.qualityScore.overall).toBeGreaterThan(0);
      expect(result.qualityScore.overall).toBeLessThanOrEqual(100);
    });

    it('should detect issues in bad data', () => {
      const cleaner = createSKUCleaner();
      const data = [
        { sku: 'SKU001', styleName: 'Shirt', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 },
        { sku: 'SKU001', styleName: 'Duplicate', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 }, // Duplicate
        { sku: '', styleName: 'Missing SKU', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 }, // Missing
      ];

      const result = cleaner.analyze(data);

      expect(result.issuesFound).toBeGreaterThan(0);
      expect(result.success).toBe(false);
    });
  });

  describe('clean', () => {
    it('should clean data and return fixed data', () => {
      const cleaner = new DataCleaner({
        ...SKU_CLEANER_CONFIG,
        autoFix: true,
        removeDuplicates: true,
      });

      const data = [
        { sku: 'SKU001', styleName: 'Shirt', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 },
        { sku: 'SKU001', styleName: 'Duplicate', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 },
      ];

      const result = cleaner.clean(data);

      expect(result.cleanedData).toBeDefined();
      expect(result.cleanedData!.length).toBe(1);
      expect(result.issuesFixed).toBeGreaterThan(0);
    });

    it('should fix format errors', () => {
      const cleaner = new DataCleaner({
        ...SKU_CLEANER_CONFIG,
        autoFix: true,
      });

      const data = [
        { sku: 'SKU001', styleName: 'Shirt', category: 'Tops', gender: 'Men', retailPrice: -100, costPrice: 50, quantity: 10 },
      ];

      const result = cleaner.clean(data);

      expect(result.cleanedData).toBeDefined();
      expect(result.cleanedData![0].retailPrice).toBe(100);
    });
  });

  describe('getIssuesBySeverity', () => {
    it('should group issues by severity', () => {
      const cleaner = createSKUCleaner();
      const data = [
        { sku: '', styleName: 'Missing SKU', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 },
        { sku: 'SKU002', styleName: 'Shirt', category: 'tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 },
      ];

      const result = cleaner.analyze(data);
      const grouped = cleaner.getIssuesBySeverity(result);

      expect(grouped.critical.length).toBeGreaterThan(0);
      expect(grouped.warning).toBeDefined();
      expect(grouped.info).toBeDefined();
    });
  });

  describe('getIssuesByType', () => {
    it('should group issues by type', () => {
      const cleaner = createSKUCleaner();
      const data = [
        { sku: '', styleName: 'Missing', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 },
        { sku: 'SKU001', styleName: 'Shirt', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 },
        { sku: 'SKU001', styleName: 'Dup', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 },
      ];

      const result = cleaner.analyze(data);
      const grouped = cleaner.getIssuesByType(result);

      expect(grouped['MISSING_VALUE']).toBeDefined();
      expect(grouped['DUPLICATE']).toBeDefined();
    });
  });
});

describe('Convenience Functions', () => {
  describe('analyzeData', () => {
    it('should analyze data with default config', () => {
      const data = [
        { sku: 'SKU001', name: 'Product 1' },
        { sku: 'SKU002', name: 'Product 2' },
      ];

      const result = analyzeData(data);
      expect(result.originalRowCount).toBe(2);
      expect(result.qualityScore).toBeDefined();
    });
  });

  describe('cleanData', () => {
    it('should clean data with autoFix enabled', () => {
      const data = [
        { sku: 'SKU001', name: 'Product 1' },
        { sku: 'SKU001', name: 'Duplicate' },
      ];

      const result = cleanData(data, { requiredColumns: ['sku'] });
      expect(result.cleanedData!.length).toBe(1);
    });
  });

  describe('createSKUCleaner', () => {
    it('should create cleaner with SKU config', () => {
      const cleaner = createSKUCleaner();
      const config = cleaner.getConfig();

      expect(config.requiredColumns).toContain('sku');
      expect(config.requiredColumns).toContain('retailPrice');
      expect(config.numericColumns).toContain('retailPrice');
    });

    it('should allow config overrides', () => {
      const cleaner = createSKUCleaner({ outlierThreshold: 2 });
      const config = cleaner.getConfig();

      expect(config.outlierThreshold).toBe(2);
    });
  });
});

describe('Quality Score', () => {
  it('should return high score for clean data', () => {
    const cleaner = createSKUCleaner();
    const data = [
      { sku: 'SKU001', styleName: 'Shirt', category: 'Tops', gender: 'Men', retailPrice: 100, costPrice: 50, quantity: 10 },
      { sku: 'SKU002', styleName: 'Pants', category: 'Bottoms', gender: 'Women', retailPrice: 150, costPrice: 75, quantity: 20 },
    ];

    const result = cleaner.analyze(data);

    expect(result.qualityScore.overall).toBeGreaterThan(80);
    expect(result.qualityScore.completeness).toBeGreaterThan(80);
  });

  it('should return lower score for problematic data', () => {
    const cleaner = createSKUCleaner();
    const data = [
      { sku: '', styleName: '', category: '', gender: '', retailPrice: 0, costPrice: 0, quantity: 0 },
    ];

    const result = cleaner.analyze(data);

    expect(result.qualityScore.overall).toBeLessThan(80);
    expect(result.qualityScore.completeness).toBeLessThan(100);
  });
});
