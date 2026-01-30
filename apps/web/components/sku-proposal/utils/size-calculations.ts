'use client';

import {
  SizeAllocation,
  ProposalProduct,
  HistoricalSizeData,
  SKUWarning,
  SIZE_TEMPLATES,
} from '../types';

/**
 * Calculate size allocations based on total quantity and sales mix percentages
 */
export function calculateSizeUnitsFromQty(
  totalQty: number,
  sizes: SizeAllocation[],
  unitPrice: number
): SizeAllocation[] {
  let distributed = 0;

  return sizes.map((size, index) => {
    const isLast = index === sizes.length - 1;
    let units: number;

    if (isLast) {
      // Last size gets the remainder to ensure exact total
      units = totalQty - distributed;
    } else {
      units = Math.round((size.salesMixPercent / 100) * totalQty);
      distributed += units;
    }

    return {
      ...size,
      units,
      value: units * unitPrice,
    };
  });
}

/**
 * Calculate size allocations based on total value (budget)
 */
export function calculateSizeUnitsFromValue(
  totalValue: number,
  sizes: SizeAllocation[],
  unitPrice: number
): { sizes: SizeAllocation[]; totalQty: number; gap: number } {
  const totalQty = Math.round(totalValue / unitPrice);
  const actualValue = totalQty * unitPrice;
  const gap = totalValue - actualValue;

  const updatedSizes = calculateSizeUnitsFromQty(totalQty, sizes, unitPrice);

  return {
    sizes: updatedSizes,
    totalQty,
    gap,
  };
}

/**
 * Recalculate sales mix percentages when units are manually changed
 */
export function recalculateSalesMix(
  sizes: SizeAllocation[],
  changedSizeCode: string,
  newUnits: number,
  unitPrice: number
): { sizes: SizeAllocation[]; totalQty: number; totalValue: number } {
  const updatedSizes = sizes.map((size) => {
    if (size.sizeCode === changedSizeCode) {
      return {
        ...size,
        units: newUnits,
        value: newUnits * unitPrice,
        isManuallyEdited: true,
      };
    }
    return size;
  });

  const totalQty = updatedSizes.reduce((sum, s) => sum + s.units, 0);
  const totalValue = totalQty * unitPrice;

  // Recalculate percentages
  const finalSizes = updatedSizes.map((size) => ({
    ...size,
    salesMixPercent: totalQty > 0 ? (size.units / totalQty) * 100 : 0,
  }));

  return {
    sizes: finalSizes,
    totalQty,
    totalValue,
  };
}

/**
 * Adjust other sizes when one size's sales mix is changed
 */
export function adjustSalesMixProportionally(
  sizes: SizeAllocation[],
  changedSizeCode: string,
  newPercent: number,
  totalQty: number,
  unitPrice: number
): SizeAllocation[] {
  const otherSizes = sizes.filter((s) => s.sizeCode !== changedSizeCode);
  const remainingPercent = 100 - newPercent;
  const currentOtherTotal = otherSizes.reduce((sum, s) => sum + s.salesMixPercent, 0);

  return sizes.map((size) => {
    if (size.sizeCode === changedSizeCode) {
      const units = Math.round((newPercent / 100) * totalQty);
      return {
        ...size,
        salesMixPercent: newPercent,
        units,
        value: units * unitPrice,
        isManuallyEdited: true,
      };
    }

    // Adjust other sizes proportionally
    const ratio = currentOtherTotal > 0 ? size.salesMixPercent / currentOtherTotal : 1 / otherSizes.length;
    const newSalesPercent = ratio * remainingPercent;
    const units = Math.round((newSalesPercent / 100) * totalQty);

    return {
      ...size,
      salesMixPercent: newSalesPercent,
      units,
      value: units * unitPrice,
    };
  });
}

/**
 * Get default sales mix based on historical data or bell curve
 */
export function getDefaultSalesMix(
  sizeTemplateId: string,
  historicalData?: HistoricalSizeData[]
): Record<string, number> {
  const template = SIZE_TEMPLATES.find((t) => t.id === sizeTemplateId);
  if (!template) return {};

  const sizes = template.sizes;
  const result: Record<string, number> = {};

  if (historicalData && historicalData.length > 0) {
    // Use historical data
    historicalData.forEach((h) => {
      result[h.sizeCode] = h.salesMixPercent;
    });
  } else {
    // Default bell curve distribution
    const n = sizes.length;
    const mid = (n - 1) / 2;
    let totalWeight = 0;
    const weights: number[] = [];

    sizes.forEach((_, i) => {
      const distance = Math.abs(i - mid);
      const weight = Math.exp(-0.5 * Math.pow(distance / (n / 4), 2));
      weights.push(weight);
      totalWeight += weight;
    });

    sizes.forEach((size, i) => {
      result[size] = (weights[i] / totalWeight) * 100;
    });
  }

  return result;
}

/**
 * Initialize size allocations for a new product
 */
export function initializeSizeAllocations(
  sizeTemplateId: string,
  totalQty: number,
  unitPrice: number,
  historicalData?: HistoricalSizeData[]
): SizeAllocation[] {
  const template = SIZE_TEMPLATES.find((t) => t.id === sizeTemplateId);
  if (!template) return [];

  const salesMix = getDefaultSalesMix(sizeTemplateId, historicalData);
  let distributed = 0;

  return template.sizes.map((sizeCode, index) => {
    const isLast = index === template.sizes.length - 1;
    const salesMixPercent = salesMix[sizeCode] || 0;
    const historical = historicalData?.find((h) => h.sizeCode === sizeCode);

    let units: number;
    if (isLast) {
      units = totalQty - distributed;
    } else {
      units = Math.round((salesMixPercent / 100) * totalQty);
      distributed += units;
    }

    return {
      sizeCode,
      salesMixPercent,
      sellThruPercent: historical?.sellThruPercent,
      units,
      value: units * unitPrice,
      isManuallyEdited: false,
    };
  });
}

/**
 * Validate size allocations and return warnings
 */
export function validateSizeAllocations(
  product: ProposalProduct,
  historicalData?: HistoricalSizeData[]
): SKUWarning[] {
  const warnings: SKUWarning[] = [];
  const totalPercent = product.sizes.reduce((sum, s) => sum + s.salesMixPercent, 0);

  // Check total sales mix
  if (Math.abs(totalPercent - 100) > 0.1) {
    warnings.push({
      id: `warn-${product.id}-mix`,
      type: 'invalid-sales-mix',
      severity: 'warning',
      message: `Total Sales Mix = ${totalPercent.toFixed(1)}%, should be 100%`,
      productId: product.id,
      details: { totalPercent },
    });
  }

  // Check for sizes with low sell-through
  product.sizes.forEach((size) => {
    if (size.sellThruPercent !== undefined && size.sellThruPercent < 30 && size.units > 0) {
      warnings.push({
        id: `warn-${product.id}-${size.sizeCode}-sellthru`,
        type: 'low-sell-thru',
        severity: 'warning',
        message: `Size ${size.sizeCode} has low sell-through (${size.sellThruPercent}%)`,
        productId: product.id,
        sizeCode: size.sizeCode,
        details: { sellThruPercent: size.sellThruPercent },
      });
    }

    // Check if size has 0 sell-through
    if (size.sellThruPercent === 0 && size.units > 0) {
      warnings.push({
        id: `warn-${product.id}-${size.sizeCode}-nosellthru`,
        type: 'low-sell-thru',
        severity: 'error',
        message: `Size ${size.sizeCode} has 0% historical sell-through - consider removing`,
        productId: product.id,
        sizeCode: size.sizeCode,
      });
    }
  });

  // Compare with historical data
  if (historicalData) {
    product.sizes.forEach((size) => {
      const historical = historicalData.find((h) => h.sizeCode === size.sizeCode);
      if (historical) {
        const diff = size.salesMixPercent - historical.salesMixPercent;
        if (Math.abs(diff) > 10) {
          warnings.push({
            id: `warn-${product.id}-${size.sizeCode}-historical`,
            type: 'adjust-sales-mix' as any,
            severity: 'info',
            message: `Size ${size.sizeCode}: Current ${size.salesMixPercent.toFixed(1)}% vs Historical ${historical.salesMixPercent.toFixed(1)}%`,
            productId: product.id,
            sizeCode: size.sizeCode,
            details: { current: size.salesMixPercent, historical: historical.salesMixPercent },
          });
        }
      }
    });
  }

  return warnings;
}

/**
 * Calculate rounding gap for a product
 */
export function calculateRoundingGap(product: ProposalProduct): number {
  const expectedValue = product.sizes.reduce((sum, s) => sum + (s.salesMixPercent / 100) * product.totalQty * product.unitPrice, 0);
  return product.totalValue - expectedValue;
}
