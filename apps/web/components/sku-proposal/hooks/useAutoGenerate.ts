'use client';

import { useCallback } from 'react';
import {
  ProposalProduct,
  SizeAllocation,
  AutoGenerateInput,
  AutoGenerateResult,
  AutoGenerateOptions,
  SKUWarning,
  HistoricalSizeData,
} from '../types';
import {
  calculateSizeUnitsFromQty,
  calculateSizeUnitsFromValue,
  recalculateSalesMix,
  adjustSalesMixProportionally,
  initializeSizeAllocations,
  validateSizeAllocations,
} from '../utils/size-calculations';

interface UseAutoGenerateOptions {
  defaultOptions?: AutoGenerateOptions;
  historicalData?: Map<string, HistoricalSizeData[]>; // productId -> historical data
}

interface UseAutoGenerateReturn {
  /**
   * Generate size allocations based on input trigger
   */
  autoGenerate: (
    input: AutoGenerateInput,
    product: ProposalProduct,
    options?: AutoGenerateOptions
  ) => AutoGenerateResult;

  /**
   * Generate from total quantity
   * Scenario A: User inputs total qty → distribute to sizes based on sales mix
   */
  generateFromTotalQty: (
    product: ProposalProduct,
    totalQty: number
  ) => AutoGenerateResult;

  /**
   * Generate from total value (budget)
   * Scenario B: User inputs total value → calculate qty, then distribute
   */
  generateFromTotalValue: (
    product: ProposalProduct,
    totalValue: number
  ) => AutoGenerateResult;

  /**
   * Update when sales mix changes
   * Scenario C: User changes sales mix % → recalculate units
   */
  updateSalesMix: (
    product: ProposalProduct,
    sizeCode: string,
    newPercent: number,
    autoAdjustOthers?: boolean
  ) => AutoGenerateResult;

  /**
   * Update when size units change
   * Scenario D: User changes units for a size → recalculate totals and percentages
   */
  updateSizeUnits: (
    product: ProposalProduct,
    sizeCode: string,
    newUnits: number
  ) => AutoGenerateResult;

  /**
   * Initialize sizes for a new product
   */
  initializeProduct: (
    sizeTemplateId: string,
    totalQty: number,
    unitPrice: number
  ) => SizeAllocation[];
}

export function useAutoGenerate({
  defaultOptions = {},
  historicalData,
}: UseAutoGenerateOptions = {}): UseAutoGenerateReturn {
  /**
   * Scenario A: Generate from Total Quantity
   */
  const generateFromTotalQty = useCallback(
    (product: ProposalProduct, totalQty: number): AutoGenerateResult => {
      const warnings: SKUWarning[] = [];

      // Calculate new sizes
      const sizes = calculateSizeUnitsFromQty(
        totalQty,
        product.sizes,
        product.unitPrice
      );

      // Calculate totals
      const totalValue = totalQty * product.unitPrice;

      // Check for rounding issues
      const actualTotal = sizes.reduce((sum, s) => sum + s.units, 0);
      const gap = totalQty - actualTotal;

      if (gap !== 0) {
        warnings.push({
          id: `warn-${product.id}-rounding`,
          type: 'rounding-gap',
          severity: 'info',
          message: `Rounding adjustment: ${gap} units`,
          productId: product.id,
          details: { gap },
        });
      }

      // Validate allocations
      const validationWarnings = validateSizeAllocations(
        { ...product, sizes, totalQty, totalValue },
        historicalData?.get(product.id)
      );
      warnings.push(...validationWarnings);

      return {
        sizes,
        totalQty,
        totalValue,
        gap,
        warnings,
      };
    },
    [historicalData]
  );

  /**
   * Scenario B: Generate from Total Value (Budget)
   */
  const generateFromTotalValue = useCallback(
    (product: ProposalProduct, totalValue: number): AutoGenerateResult => {
      const warnings: SKUWarning[] = [];

      // Calculate qty and sizes
      const { sizes, totalQty, gap } = calculateSizeUnitsFromValue(
        totalValue,
        product.sizes,
        product.unitPrice
      );

      // Actual value after rounding
      const actualValue = totalQty * product.unitPrice;
      const valueGap = totalValue - actualValue;

      if (Math.abs(valueGap) > 0) {
        warnings.push({
          id: `warn-${product.id}-value-gap`,
          type: 'rounding-gap',
          severity: 'info',
          message: `Budget rounding: ${valueGap >= 0 ? '+' : ''}$${valueGap.toFixed(0)} due to unit price constraints`,
          productId: product.id,
          details: { valueGap, targetValue: totalValue, actualValue },
        });
      }

      // Validate allocations
      const validationWarnings = validateSizeAllocations(
        { ...product, sizes, totalQty, totalValue: actualValue },
        historicalData?.get(product.id)
      );
      warnings.push(...validationWarnings);

      return {
        sizes,
        totalQty,
        totalValue: actualValue,
        gap: valueGap,
        warnings,
      };
    },
    [historicalData]
  );

  /**
   * Scenario C: Update Sales Mix
   */
  const updateSalesMix = useCallback(
    (
      product: ProposalProduct,
      sizeCode: string,
      newPercent: number,
      autoAdjustOthers = true
    ): AutoGenerateResult => {
      const warnings: SKUWarning[] = [];

      let sizes: SizeAllocation[];

      if (autoAdjustOthers) {
        // Adjust other sizes proportionally
        sizes = adjustSalesMixProportionally(
          product.sizes,
          sizeCode,
          newPercent,
          product.totalQty,
          product.unitPrice
        );
      } else {
        // Just update the one size
        sizes = product.sizes.map((size) => {
          if (size.sizeCode !== sizeCode) return size;
          const units = Math.round((newPercent / 100) * product.totalQty);
          return {
            ...size,
            salesMixPercent: newPercent,
            units,
            value: units * product.unitPrice,
            isManuallyEdited: true,
          };
        });
      }

      // Check total percentage
      const totalPercent = sizes.reduce((sum, s) => sum + s.salesMixPercent, 0);
      if (Math.abs(totalPercent - 100) > 0.5) {
        warnings.push({
          id: `warn-${product.id}-salesmix-total`,
          type: 'invalid-sales-mix',
          severity: 'warning',
          message: `Total Sales Mix = ${totalPercent.toFixed(1)}%, ${totalPercent < 100 ? 'missing' : 'excess'} ${Math.abs(100 - totalPercent).toFixed(1)}%`,
          productId: product.id,
          details: { totalPercent },
        });
      }

      const totalQty = sizes.reduce((sum, s) => sum + s.units, 0);
      const totalValue = totalQty * product.unitPrice;

      // Validate allocations
      const validationWarnings = validateSizeAllocations(
        { ...product, sizes, totalQty, totalValue },
        historicalData?.get(product.id)
      );
      warnings.push(...validationWarnings);

      return {
        sizes,
        totalQty,
        totalValue,
        gap: 0,
        warnings,
      };
    },
    [historicalData]
  );

  /**
   * Scenario D: Update Size Units
   */
  const updateSizeUnits = useCallback(
    (
      product: ProposalProduct,
      sizeCode: string,
      newUnits: number
    ): AutoGenerateResult => {
      const warnings: SKUWarning[] = [];

      // Recalculate sales mix
      const { sizes, totalQty, totalValue } = recalculateSalesMix(
        product.sizes,
        sizeCode,
        newUnits,
        product.unitPrice
      );

      // Check if over original allocation
      if (totalValue > product.totalValue * 1.1) {
        warnings.push({
          id: `warn-${product.id}-over-original`,
          type: 'over-budget',
          severity: 'warning',
          message: `Product value increased by ${(((totalValue - product.totalValue) / product.totalValue) * 100).toFixed(1)}%`,
          productId: product.id,
          details: {
            original: product.totalValue,
            new: totalValue,
            increase: totalValue - product.totalValue,
          },
        });
      }

      // Validate allocations
      const validationWarnings = validateSizeAllocations(
        { ...product, sizes, totalQty, totalValue },
        historicalData?.get(product.id)
      );
      warnings.push(...validationWarnings);

      return {
        sizes,
        totalQty,
        totalValue,
        gap: 0,
        warnings,
      };
    },
    [historicalData]
  );

  /**
   * Main auto-generate function
   */
  const autoGenerate = useCallback(
    (
      input: AutoGenerateInput,
      product: ProposalProduct,
      options?: AutoGenerateOptions
    ): AutoGenerateResult => {
      const opts = { ...defaultOptions, ...options };

      switch (input.trigger) {
        case 'totalQty':
          return generateFromTotalQty(product, input.value);

        case 'totalValue':
          return generateFromTotalValue(product, input.value);

        case 'salesMix':
          if (!input.sizeCode) {
            throw new Error('sizeCode required for salesMix trigger');
          }
          return updateSalesMix(product, input.sizeCode, input.value, true);

        case 'sizeUnits':
          if (!input.sizeCode) {
            throw new Error('sizeCode required for sizeUnits trigger');
          }
          return updateSizeUnits(product, input.sizeCode, input.value);

        default:
          throw new Error(`Unknown trigger: ${input.trigger}`);
      }
    },
    [defaultOptions, generateFromTotalQty, generateFromTotalValue, updateSalesMix, updateSizeUnits]
  );

  /**
   * Initialize sizes for new product
   */
  const initializeProduct = useCallback(
    (
      sizeTemplateId: string,
      totalQty: number,
      unitPrice: number
    ): SizeAllocation[] => {
      return initializeSizeAllocations(sizeTemplateId, totalQty, unitPrice);
    },
    []
  );

  return {
    autoGenerate,
    generateFromTotalQty,
    generateFromTotalValue,
    updateSalesMix,
    updateSizeUnits,
    initializeProduct,
  };
}

export default useAutoGenerate;
