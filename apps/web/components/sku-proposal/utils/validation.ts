'use client';

import {
  SKUProposal,
  ProposalCategory,
  ProposalProduct,
  SKUWarning,
  SKUSuggestion,
  getBudgetStatus,
} from '../types';

/**
 * Validate entire proposal and return all warnings
 */
export function validateProposal(proposal: SKUProposal): SKUWarning[] {
  const warnings: SKUWarning[] = [];

  // Check overall budget
  if (proposal.usedBudget > proposal.totalBudget) {
    warnings.push({
      id: 'warn-proposal-overbudget',
      type: 'over-budget',
      severity: 'error',
      message: `Proposal over budget by ${formatCurrency(proposal.usedBudget - proposal.totalBudget)} (${((proposal.usedBudget / proposal.totalBudget) * 100).toFixed(1)}%)`,
      details: {
        used: proposal.usedBudget,
        total: proposal.totalBudget,
        overage: proposal.usedBudget - proposal.totalBudget,
      },
    });
  }

  // Check each category
  proposal.categories.forEach((category) => {
    const categoryWarnings = validateCategory(category);
    warnings.push(...categoryWarnings);

    // Check each product
    category.products.forEach((product) => {
      const productWarnings = validateProduct(product);
      warnings.push(...productWarnings);
    });
  });

  return warnings;
}

/**
 * Validate a category budget
 */
export function validateCategory(category: ProposalCategory): SKUWarning[] {
  const warnings: SKUWarning[] = [];

  if (category.status === 'over-budget') {
    warnings.push({
      id: `warn-cat-${category.id}-overbudget`,
      type: 'over-budget',
      severity: 'error',
      message: `Category "${category.name}" over budget by ${formatCurrency(Math.abs(category.budgetRemaining))} (${category.percentUsed.toFixed(1)}%)`,
      categoryId: category.id,
      details: {
        allocated: category.budgetAllocated,
        used: category.budgetUsed,
        overage: Math.abs(category.budgetRemaining),
      },
    });
  } else if (category.status === 'warning') {
    warnings.push({
      id: `warn-cat-${category.id}-warning`,
      type: 'over-budget',
      severity: 'warning',
      message: `Category "${category.name}" at ${category.percentUsed.toFixed(1)}% of budget`,
      categoryId: category.id,
      details: {
        allocated: category.budgetAllocated,
        used: category.budgetUsed,
        remaining: category.budgetRemaining,
      },
    });
  }

  return warnings;
}

/**
 * Validate a single product
 */
export function validateProduct(product: ProposalProduct): SKUWarning[] {
  const warnings: SKUWarning[] = [];

  // Check total sales mix
  const totalSalesMix = product.sizes.reduce((sum, s) => sum + s.salesMixPercent, 0);
  if (Math.abs(totalSalesMix - 100) > 0.5) {
    warnings.push({
      id: `warn-prod-${product.id}-salesmix`,
      type: 'invalid-sales-mix',
      severity: 'warning',
      message: `Product "${product.styleName}": Total Sales Mix = ${totalSalesMix.toFixed(1)}%, missing ${(100 - totalSalesMix).toFixed(1)}%`,
      productId: product.id,
      details: { totalSalesMix },
    });
  }

  // Check for zero quantity sizes
  product.sizes.forEach((size) => {
    if (size.units === 0 && size.salesMixPercent > 0) {
      warnings.push({
        id: `warn-prod-${product.id}-size-${size.sizeCode}-zero`,
        type: 'rounding-gap',
        severity: 'info',
        message: `Size ${size.sizeCode} has 0 units due to rounding`,
        productId: product.id,
        sizeCode: size.sizeCode,
      });
    }
  });

  return warnings;
}

/**
 * Generate AI suggestions for a proposal
 */
export function generateSuggestions(
  proposal: SKUProposal,
  historicalData?: Map<string, Map<string, number>>
): SKUSuggestion[] {
  const suggestions: SKUSuggestion[] = [];

  proposal.categories.forEach((category) => {
    // Suggest for empty categories
    if (category.products.length === 0 && category.budgetAllocated > 0) {
      suggestions.push({
        id: `sug-cat-${category.id}-empty`,
        type: 'historical-insight',
        title: `Add products to ${category.name}`,
        description: `Category has ${formatCurrency(category.budgetAllocated)} allocated budget but no products yet.`,
        confidence: 100,
      });
    }

    category.products.forEach((product) => {
      // Check for sizes with low sell-through
      product.sizes.forEach((size) => {
        if (size.sellThruPercent !== undefined && size.sellThruPercent < 25 && size.units > 0) {
          suggestions.push({
            id: `sug-prod-${product.id}-${size.sizeCode}-sellthru`,
            type: 'decrease-qty',
            title: `Reduce Size ${size.sizeCode} quantity`,
            description: `Size ${size.sizeCode} has only ${size.sellThruPercent}% historical sell-through. Consider reducing allocation.`,
            impact: {
              qtyChange: -Math.ceil(size.units * 0.3),
              budgetChange: -Math.ceil(size.units * 0.3) * product.unitPrice,
            },
            action: {
              productId: product.id,
              sizeCode: size.sizeCode,
              field: 'units',
              currentValue: size.units,
              suggestedValue: Math.ceil(size.units * 0.7),
            },
            confidence: 75,
          });
        }
      });

      // Check for missing popular sizes (based on template)
      const template = getSizeTemplate(product.sizeTemplateId);
      if (template) {
        const missingSizes = template.filter(
          (s) => !product.sizes.find((ps) => ps.sizeCode === s)
        );
        if (missingSizes.length > 0) {
          suggestions.push({
            id: `sug-prod-${product.id}-missing-sizes`,
            type: 'add-size',
            title: `Consider adding sizes`,
            description: `Product "${product.styleName}" is missing sizes: ${missingSizes.join(', ')}`,
            confidence: 60,
          });
        }
      }
    });
  });

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get size template by ID
 */
function getSizeTemplate(templateId: string): string[] | null {
  const templates: Record<string, string[]> = {
    'men-numeric': ['44', '46', '48', '50', '52', '54'],
    'women-alpha': ['XS', 'S', 'M', 'L', 'XL'],
    'clothing-alpha': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'clothing-numeric': ['36', '38', '40', '42', '44', '46'],
  };
  return templates[templateId] || null;
}

/**
 * Format currency helper
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
