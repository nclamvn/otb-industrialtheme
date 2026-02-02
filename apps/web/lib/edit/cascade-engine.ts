// ============================================================
// CASCADE RULES ENGINE - DAFC OTB Platform
// Handles automatic recalculation of dependent fields
// ============================================================

export interface CascadeRule {
  trigger: string; // Field that was changed
  affected: string[]; // Fields that get recalculated
  calculate: (
    values: Record<string, number>,
    newValue: number
  ) => Record<string, number>;
  description: string;
  descriptionVi: string;
}

export const CASCADE_RULES: CascadeRule[] = [
  {
    trigger: 'unitCost',
    affected: [
      'freightCost',
      'taxAmount',
      'importTax',
      'landedCost',
      'landedCostVND',
      'margin',
    ],
    calculate: (values, newUnitCost) => {
      const freightCost = newUnitCost * 0.03;
      const taxAmount = newUnitCost * 0.02;
      const importTax =
        (newUnitCost + freightCost) * (values.importTaxRate || 0.2);
      const landedCost = newUnitCost + freightCost + taxAmount + importTax;
      const exchangeRate = values.exchangeRate || 27500;
      const landedCostVND = landedCost * exchangeRate;
      const margin = values.srp
        ? ((values.srp - landedCostVND) / values.srp) * 100
        : 0;
      return {
        freightCost,
        taxAmount,
        importTax,
        landedCost,
        landedCostVND,
        margin,
      };
    },
    description:
      'Unit Cost → Freight → Tax → Import Tax → Landed Cost → Margin',
    descriptionVi:
      'Giá gốc → Vận chuyển → Thuế → Nhập khẩu → Giá nhập → Biên lợi nhuận',
  },
  {
    trigger: 'srp',
    affected: ['margin', 'marginPercent'],
    calculate: (values, newSrp) => {
      const margin = newSrp - (values.landedCostVND || 0);
      const marginPercent = newSrp > 0 ? (margin / newSrp) * 100 : 0;
      return { margin, marginPercent };
    },
    description: 'SRP → Margin recalculation',
    descriptionVi: 'Giá bán → Tính lại biên lợi nhuận',
  },
  {
    trigger: 'totalUnits',
    affected: ['storeSplit', 'deliveryGrid', 'totalPrice'],
    calculate: (values, newTotal) => {
      const totalPrice = newTotal * (values.unitCost || 0);
      const storeCount = values.storeCount || 1;
      const storeSplit = Math.floor(newTotal / storeCount);
      return { totalPrice, storeSplit, deliveryGrid: newTotal };
    },
    description: 'Total Units → Store Split → Delivery → Total Price',
    descriptionVi: 'Tổng SL → Phân bổ cửa hàng → Giao hàng → Tổng giá',
  },
  {
    trigger: 'sizing',
    affected: ['sizeAllocation', 'deliverySizeBreakdown'],
    calculate: (values, _newValue) => {
      return { sizeAllocation: values.totalUnits || 0 };
    },
    description: 'Size Curve → Delivery Size Allocation',
    descriptionVi: 'Tỷ lệ size → Phân bổ size giao hàng',
  },
  {
    trigger: 'quantity',
    affected: ['totalValue', 'avgUnitCost'],
    calculate: (values, newQuantity) => {
      const totalValue = newQuantity * (values.unitPrice || 0);
      const avgUnitCost = newQuantity > 0 ? totalValue / newQuantity : 0;
      return { totalValue, avgUnitCost };
    },
    description: 'Quantity → Total Value → Avg Unit Cost',
    descriptionVi: 'Số lượng → Tổng giá trị → Giá đơn vị TB',
  },
  {
    trigger: 'discount',
    affected: ['netPrice', 'netTotal', 'margin'],
    calculate: (values, newDiscount) => {
      const netPrice = (values.srp || 0) * (1 - newDiscount / 100);
      const netTotal = netPrice * (values.quantity || 0);
      const margin = netPrice - (values.landedCostVND || 0);
      return { netPrice, netTotal, margin };
    },
    description: 'Discount → Net Price → Net Total → Margin',
    descriptionVi: 'Chiết khấu → Giá net → Tổng net → Biên lợi nhuận',
  },
];

/**
 * Find all cascade rules triggered by a field change
 */
export function findCascadeRules(fieldName: string): CascadeRule[] {
  return CASCADE_RULES.filter((rule) => rule.trigger === fieldName);
}

/**
 * Calculate cascade effects for a field change
 */
export function calculateCascade(
  fieldName: string,
  newValue: number,
  currentValues: Record<string, number>
): { field: string; oldValue: number; newValue: number; rule: string }[] {
  const effects: {
    field: string;
    oldValue: number;
    newValue: number;
    rule: string;
  }[] = [];
  const rules = findCascadeRules(fieldName);

  for (const rule of rules) {
    const results = rule.calculate(currentValues, newValue);
    for (const [field, value] of Object.entries(results)) {
      effects.push({
        field,
        oldValue: currentValues[field] || 0,
        newValue: value,
        rule: rule.descriptionVi,
      });
    }
  }

  return effects;
}

/**
 * Check if a field has cascade effects
 */
export function hasCascadeEffects(fieldName: string): boolean {
  return CASCADE_RULES.some((rule) => rule.trigger === fieldName);
}

/**
 * Get cascade description for a field
 */
export function getCascadeDescription(
  fieldName: string,
  locale: 'en' | 'vi' = 'vi'
): string | null {
  const rule = CASCADE_RULES.find((r) => r.trigger === fieldName);
  return rule ? (locale === 'vi' ? rule.descriptionVi : rule.description) : null;
}
