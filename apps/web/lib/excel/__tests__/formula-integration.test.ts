/**
 * Formula Integration Tests
 * Demonstrates formula evaluation in SKU Excel import
 */
import {
  isFormula,
  evaluateFormula,
  createSKUFormulaContext,
  processRowWithFormulas,
  SKU_FORMULA_TEMPLATES,
} from '../formula-helper';

describe('Formula Helper', () => {
  describe('isFormula', () => {
    it('should detect formulas starting with =', () => {
      expect(isFormula('=SUM(A1:A3)')).toBe(true);
      expect(isFormula('=A1+B1')).toBe(true);
      expect(isFormula('  =AVERAGE(1,2,3)')).toBe(true);
    });

    it('should not detect non-formulas', () => {
      expect(isFormula('Hello')).toBe(false);
      expect(isFormula('123')).toBe(false);
      expect(isFormula('')).toBe(false);
      expect(isFormula(null)).toBe(false);
      expect(isFormula(undefined)).toBe(false);
    });
  });

  describe('evaluateFormula', () => {
    it('should evaluate simple math formulas', () => {
      const result = evaluateFormula('=1+2+3', {});
      expect(result.success).toBe(true);
      expect(result.value).toBe(6);
    });

    it('should evaluate formulas with context', () => {
      const context = { A1: 10, B1: 20 };
      const result = evaluateFormula('=A1+B1', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(30);
    });

    it('should evaluate margin calculation', () => {
      const context = { retailPrice: 100, costPrice: 40 };
      const result = evaluateFormula('=(retailPrice-costPrice)/retailPrice*100', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(60); // 60% margin
    });

    it('should handle division by zero', () => {
      const result = evaluateFormula('=1/0', {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('#DIV/0!');
    });
  });

  describe('createSKUFormulaContext', () => {
    it('should extract numeric fields from row', () => {
      const row = {
        'SKU': 'ABC123',
        'Retail Price': '150',
        'Cost Price': '60',
        'Quantity': '100',
      };

      const context = createSKUFormulaContext(row);

      expect(context.retailPrice).toBe(150);
      expect(context.costPrice).toBe(60);
      expect(context.quantity).toBe(100);
    });

    it('should handle currency symbols', () => {
      const row = {
        'Retail Price': '$150.00',
        'Cost Price': '€60',
      };

      const context = createSKUFormulaContext(row);

      expect(context.retailPrice).toBe(150);
      expect(context.costPrice).toBe(60);
    });
  });

  describe('processRowWithFormulas', () => {
    it('should evaluate formulas in row data', () => {
      const row = {
        retailPrice: 100,
        costPrice: 40,
        margin: '=(retailPrice-costPrice)/retailPrice*100',
      };

      const processed = processRowWithFormulas(row);

      expect(processed.retailPrice).toBe(100);
      expect(processed.costPrice).toBe(40);
      expect(processed.margin).toBe(60);
    });

    it('should handle multiple formulas', () => {
      const row = {
        quantity: 10,
        price: 50,
        total: '=quantity*price',
        doubled: '=total*2',
      };

      const processed = processRowWithFormulas(row);

      expect(processed.total).toBe(500);
      expect(processed.doubled).toBe(1000);
    });
  });

  describe('SKU Formula Templates', () => {
    it('should calculate margin correctly', () => {
      const context = { retailPrice: 200, costPrice: 80 };
      const result = evaluateFormula(SKU_FORMULA_TEMPLATES.margin, context);

      expect(result.success).toBe(true);
      expect(result.value).toBe(60); // (200-80)/200*100 = 60%
    });

    it('should calculate total value correctly', () => {
      const context = { quantity: 50, retailPrice: 100 };
      const result = evaluateFormula(SKU_FORMULA_TEMPLATES.totalValue, context);

      expect(result.success).toBe(true);
      expect(result.value).toBe(5000);
    });

    it('should calculate profit correctly', () => {
      const context = { quantity: 100, retailPrice: 50, costPrice: 20 };
      const result = evaluateFormula(SKU_FORMULA_TEMPLATES.profit, context);

      expect(result.success).toBe(true);
      expect(result.value).toBe(3000); // 100 * (50-20) = 3000
    });
  });
});

describe('SKU Excel Import with Formulas', () => {
  it('should process SKU row with calculated margin', () => {
    // Simulate a row from Excel with formula in margin column
    const excelRow = {
      sku: 'SKU001',
      styleName: 'Classic Shirt',
      category: 'Shirts',
      gender: 'Men',
      retailPrice: 150,
      costPrice: 60,
      margin: '=(retailPrice-costPrice)/retailPrice*100', // Formula!
      orderQuantity: 100,
    };

    // Create context and evaluate
    const context = createSKUFormulaContext(excelRow);
    const marginResult = evaluateFormula(excelRow.margin, context);

    expect(marginResult.success).toBe(true);
    expect(marginResult.value).toBe(60); // 60% margin
  });

  it('should process SKU row with calculated retail price', () => {
    // Excel row where retail price is calculated from cost + markup
    const excelRow = {
      sku: 'SKU002',
      costPrice: 40,
      markup: 2.5, // 2.5x markup
      retailPrice: '=costPrice*markup', // Calculated!
      orderQuantity: 50,
    };

    const processed = processRowWithFormulas(excelRow);

    expect(processed.retailPrice).toBe(100); // 40 * 2.5 = 100
  });

  it('should handle complex pricing formulas', () => {
    const excelRow = {
      baseCost: 30,
      shippingCost: 5,
      tariff: 10, // 10%
      costPrice: '=baseCost+shippingCost+(baseCost*tariff/100)', // Total cost
      targetMargin: 60, // 60% margin
      retailPrice: '=costPrice/(1-targetMargin/100)', // Calculate retail from margin
    };

    const processed = processRowWithFormulas(excelRow);

    // costPrice = 30 + 5 + (30*10/100) = 30 + 5 + 3 = 38
    expect(processed.costPrice).toBe(38);

    // retailPrice = 38 / (1 - 0.6) = 38 / 0.4 = 95
    expect(processed.retailPrice).toBe(95);
  });
});
