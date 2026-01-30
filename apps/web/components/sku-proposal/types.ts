'use client';

// ============================================
// Size Configuration Types
// ============================================

export interface SizeConfig {
  id: string;
  name: string;
  sizes: string[];
}

// Predefined size templates
export const SIZE_TEMPLATES: SizeConfig[] = [
  {
    id: 'men-numeric',
    name: 'Men (Numeric)',
    sizes: ['44', '46', '48', '50', '52', '54'],
  },
  {
    id: 'women-alpha',
    name: 'Women (Alpha)',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 'clothing-alpha',
    name: 'Clothing (Alpha)',
    sizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  },
  {
    id: 'clothing-numeric',
    name: 'Clothing (Numeric)',
    sizes: ['34', '36', '38', '40', '42', '44', '46', '48'],
  },
  {
    id: 'shoes-eu',
    name: 'Shoes (EU)',
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
  },
  {
    id: 'shoes-us-men',
    name: 'Shoes (US Men)',
    sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'],
  },
  {
    id: 'shoes-us-women',
    name: 'Shoes (US Women)',
    sizes: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '11'],
  },
  {
    id: 'accessories',
    name: 'Accessories (One Size)',
    sizes: ['ONE SIZE'],
  },
  {
    id: 'belt',
    name: 'Belt',
    sizes: ['75', '80', '85', '90', '95', '100', '105', '110'],
  },
];

// ============================================
// SKU Proposal Types
// ============================================

export type ProposalStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ORDERED';

export interface SKUProposal {
  id: string;
  name: string;
  version: number;
  status: ProposalStatus;
  seasonId: string;
  seasonCode: string;
  seasonName: string;
  brandId: string;
  brandName: string;
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  totalSKUs: number;
  categories: ProposalCategory[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
}

// ============================================
// Category Types (from Budget Flow)
// ============================================

export type BudgetStatus = 'on-track' | 'warning' | 'over-budget' | 'under-budget';

export interface ProposalCategory {
  id: string;
  name: string;
  budgetAllocated: number;  // From Budget Flow
  budgetUsed: number;       // Sum of products in this category
  budgetRemaining: number;  // budgetAllocated - budgetUsed
  percentUsed: number;      // (budgetUsed / budgetAllocated) * 100
  status: BudgetStatus;     // Based on percentUsed
  productCount: number;
  products: ProposalProduct[];
  children?: ProposalCategory[]; // For nested categories
}

// ============================================
// Product Types
// ============================================

export interface ProposalProduct {
  id: string;
  categoryId: string;
  styleCode: string;
  styleName: string;
  colorCode?: string;
  colorName?: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  unitPrice: number;        // Retail price per unit
  costPrice?: number;       // Cost price per unit
  sizeTemplateId: string;
  totalQty: number;         // Sum of all size quantities
  totalValue: number;       // totalQty * unitPrice
  sizes: SizeAllocation[];
  isExpanded?: boolean;
  hasChanges?: boolean;

  // GAP-6: Item Number field (maps to Excel ITEM NO column)
  itemNo?: string;          // Explicit item number, separate from styleCode

  // GAP-7: Composition field (maps to Excel COMPOSITION column)
  composition?: string;     // Material composition e.g. "95% Cotton, 5% Elastane"
}

// ============================================
// Size Allocation Types
// ============================================

export interface SizeAllocation {
  sizeCode: string;
  salesMixPercent: number;    // % of total qty for this size
  sellThruPercent?: number;   // Historical sell-through rate
  units: number;              // Actual quantity
  value: number;              // units * unitPrice
  isManuallyEdited?: boolean; // Track if user manually changed this
}

export interface HistoricalSizeData {
  sizeCode: string;
  salesMixPercent: number;
  sellThruPercent: number;
  avgUnits: number;
}

// ============================================
// Auto-Generate Types
// ============================================

export type AutoGenerateTrigger = 'totalQty' | 'totalValue' | 'salesMix' | 'sizeUnits';

export interface AutoGenerateInput {
  trigger: AutoGenerateTrigger;
  productId: string;
  value: number;
  sizeCode?: string;        // Required if trigger is 'salesMix' or 'sizeUnits'
}

export interface AutoGenerateResult {
  sizes: SizeAllocation[];
  totalQty: number;
  totalValue: number;
  gap: number;              // Difference due to rounding
  warnings: SKUWarning[];
}

export interface AutoGenerateOptions {
  distributeRemainder?: 'largest' | 'proportional' | 'first';
  respectManualEdits?: boolean;
  useHistoricalData?: boolean;
}

// ============================================
// Warning & Suggestion Types
// ============================================

export type WarningSeverity = 'error' | 'warning' | 'info';
export type WarningType =
  | 'over-budget'
  | 'under-budget'
  | 'invalid-sales-mix'
  | 'low-sell-thru'
  | 'missing-size'
  | 'rounding-gap';

export interface SKUWarning {
  id: string;
  type: WarningType;
  severity: WarningSeverity;
  message: string;
  productId?: string;
  categoryId?: string;
  sizeCode?: string;
  details?: Record<string, unknown>;
}

export type SuggestionType =
  | 'adjust-sales-mix'
  | 'add-size'
  | 'remove-size'
  | 'increase-qty'
  | 'decrease-qty'
  | 'historical-insight';

export interface SKUSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  impact?: {
    budgetChange?: number;
    qtyChange?: number;
  };
  action?: {
    productId: string;
    sizeCode?: string;
    field: string;
    currentValue: number;
    suggestedValue: number;
  };
  confidence: number;       // 0-100
}

// ============================================
// Size Distribution Presets
// ============================================

export interface SizeDistribution {
  id: string;
  name: string;
  distribution: 'uniform' | 'bell-curve' | 'right-skew' | 'left-skew' | 'custom';
}

export const SIZE_DISTRIBUTIONS: SizeDistribution[] = [
  { id: 'uniform', name: 'Uniform (Equal)', distribution: 'uniform' },
  { id: 'bell-curve', name: 'Bell Curve (Middle Heavy)', distribution: 'bell-curve' },
  { id: 'right-skew', name: 'Right Skew (Larger Sizes)', distribution: 'right-skew' },
  { id: 'left-skew', name: 'Left Skew (Smaller Sizes)', distribution: 'left-skew' },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate bell curve distribution for sizes
 */
export function calculateDistribution(
  sizes: string[],
  totalQty: number,
  distribution: SizeDistribution['distribution']
): Record<string, number> {
  const n = sizes.length;
  const result: Record<string, number> = {};

  if (n === 0 || totalQty === 0) return result;

  let weights: number[];

  switch (distribution) {
    case 'bell-curve':
      weights = sizes.map((_, i) => {
        const mid = (n - 1) / 2;
        const distance = Math.abs(i - mid);
        return Math.exp(-0.5 * Math.pow(distance / (n / 4), 2));
      });
      break;
    case 'right-skew':
      weights = sizes.map((_, i) => Math.pow(i + 1, 1.5));
      break;
    case 'left-skew':
      weights = sizes.map((_, i) => Math.pow(n - i, 1.5));
      break;
    case 'uniform':
    default:
      weights = sizes.map(() => 1);
      break;
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let distributed = 0;

  sizes.forEach((size, i) => {
    if (i === n - 1) {
      result[size] = totalQty - distributed;
    } else {
      const qty = Math.round((weights[i] / totalWeight) * totalQty);
      result[size] = qty;
      distributed += qty;
    }
  });

  return result;
}

/**
 * Get budget status based on percentage used
 */
export function getBudgetStatus(percentUsed: number): BudgetStatus {
  if (percentUsed > 100) return 'over-budget';
  if (percentUsed >= 80) return 'warning';
  if (percentUsed < 50) return 'under-budget';
  return 'on-track';
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================
// Product Categories (for dropdown)
// ============================================

export const PRODUCT_CATEGORIES = [
  { id: 'outerwear', name: 'Outerwear', sizeTemplate: 'men-numeric' },
  { id: 'tops', name: 'Tops', sizeTemplate: 'clothing-alpha' },
  { id: 'bottoms', name: 'Bottoms', sizeTemplate: 'clothing-numeric' },
  { id: 'dresses', name: 'Dresses', sizeTemplate: 'women-alpha' },
  { id: 'suits', name: 'Suits', sizeTemplate: 'clothing-numeric' },
  { id: 'knitwear', name: 'Knitwear', sizeTemplate: 'clothing-alpha' },
  { id: 'shoes', name: 'Shoes', sizeTemplate: 'shoes-eu' },
  { id: 'bags', name: 'Bags', sizeTemplate: 'accessories' },
  { id: 'accessories', name: 'Accessories', sizeTemplate: 'accessories' },
  { id: 'belts', name: 'Belts', sizeTemplate: 'belt' },
];

// ============================================
// Demo Data Generator
// ============================================

export function generateDemoProposal(): SKUProposal {
  const categories: ProposalCategory[] = [
    {
      id: 'cat-outerwear',
      name: 'Outerwear',
      budgetAllocated: 150000,
      budgetUsed: 132500,
      budgetRemaining: 17500,
      percentUsed: 88.3,
      status: 'warning',
      productCount: 3,
      products: [
        {
          id: 'prod-1',
          categoryId: 'cat-outerwear',
          styleCode: 'A2501',
          styleName: 'Wool Coat',
          colorCode: 'BLK',
          colorName: 'Black',
          gender: 'MALE',
          unitPrice: 350,
          sizeTemplateId: 'men-numeric',
          totalQty: 200,
          totalValue: 70000,
          sizes: [
            { sizeCode: '44', salesMixPercent: 10, sellThruPercent: 50, units: 20, value: 7000 },
            { sizeCode: '46', salesMixPercent: 45, sellThruPercent: 52, units: 90, value: 31500 },
            { sizeCode: '48', salesMixPercent: 35, sellThruPercent: 48, units: 70, value: 24500 },
            { sizeCode: '50', salesMixPercent: 8, sellThruPercent: 35, units: 16, value: 5600 },
            { sizeCode: '52', salesMixPercent: 2, sellThruPercent: 20, units: 4, value: 1400 },
          ],
        },
        {
          id: 'prod-2',
          categoryId: 'cat-outerwear',
          styleCode: 'B3201',
          styleName: 'Down Jacket',
          colorCode: 'NVY',
          colorName: 'Navy',
          gender: 'MALE',
          unitPrice: 280,
          sizeTemplateId: 'men-numeric',
          totalQty: 150,
          totalValue: 42000,
          sizes: [
            { sizeCode: '44', salesMixPercent: 12, sellThruPercent: 45, units: 18, value: 5040 },
            { sizeCode: '46', salesMixPercent: 40, sellThruPercent: 55, units: 60, value: 16800 },
            { sizeCode: '48', salesMixPercent: 32, sellThruPercent: 50, units: 48, value: 13440 },
            { sizeCode: '50', salesMixPercent: 12, sellThruPercent: 38, units: 18, value: 5040 },
            { sizeCode: '52', salesMixPercent: 4, sellThruPercent: 25, units: 6, value: 1680 },
          ],
        },
        {
          id: 'prod-3',
          categoryId: 'cat-outerwear',
          styleCode: 'C1105',
          styleName: 'Leather Jacket',
          colorCode: 'BRN',
          colorName: 'Brown',
          gender: 'MALE',
          unitPrice: 450,
          sizeTemplateId: 'men-numeric',
          totalQty: 45,
          totalValue: 20250,
          sizes: [
            { sizeCode: '46', salesMixPercent: 30, sellThruPercent: 60, units: 14, value: 6300 },
            { sizeCode: '48', salesMixPercent: 45, sellThruPercent: 58, units: 20, value: 9000 },
            { sizeCode: '50', salesMixPercent: 25, sellThruPercent: 42, units: 11, value: 4950 },
          ],
        },
      ],
    },
    {
      id: 'cat-tops',
      name: 'Tops',
      budgetAllocated: 80000,
      budgetUsed: 45600,
      budgetRemaining: 34400,
      percentUsed: 57,
      status: 'on-track',
      productCount: 2,
      products: [
        {
          id: 'prod-4',
          categoryId: 'cat-tops',
          styleCode: 'T4501',
          styleName: 'Oxford Shirt',
          colorCode: 'WHT',
          colorName: 'White',
          gender: 'MALE',
          unitPrice: 120,
          sizeTemplateId: 'clothing-alpha',
          totalQty: 200,
          totalValue: 24000,
          sizes: [
            { sizeCode: 'S', salesMixPercent: 15, sellThruPercent: 55, units: 30, value: 3600 },
            { sizeCode: 'M', salesMixPercent: 35, sellThruPercent: 65, units: 70, value: 8400 },
            { sizeCode: 'L', salesMixPercent: 35, sellThruPercent: 60, units: 70, value: 8400 },
            { sizeCode: 'XL', salesMixPercent: 15, sellThruPercent: 45, units: 30, value: 3600 },
          ],
        },
        {
          id: 'prod-5',
          categoryId: 'cat-tops',
          styleCode: 'T4502',
          styleName: 'Polo Shirt',
          colorCode: 'BLU',
          colorName: 'Blue',
          gender: 'MALE',
          unitPrice: 90,
          sizeTemplateId: 'clothing-alpha',
          totalQty: 240,
          totalValue: 21600,
          sizes: [
            { sizeCode: 'S', salesMixPercent: 12, sellThruPercent: 50, units: 29, value: 2610 },
            { sizeCode: 'M', salesMixPercent: 38, sellThruPercent: 62, units: 91, value: 8190 },
            { sizeCode: 'L', salesMixPercent: 33, sellThruPercent: 58, units: 80, value: 7200 },
            { sizeCode: 'XL', salesMixPercent: 17, sellThruPercent: 40, units: 40, value: 3600 },
          ],
        },
      ],
    },
    {
      id: 'cat-bottoms',
      name: 'Bottoms',
      budgetAllocated: 60000,
      budgetUsed: 0,
      budgetRemaining: 60000,
      percentUsed: 0,
      status: 'under-budget',
      productCount: 0,
      products: [],
    },
    {
      id: 'cat-knitwear',
      name: 'Knitwear',
      budgetAllocated: 50000,
      budgetUsed: 52500,
      budgetRemaining: -2500,
      percentUsed: 105,
      status: 'over-budget',
      productCount: 1,
      products: [
        {
          id: 'prod-6',
          categoryId: 'cat-knitwear',
          styleCode: 'K2201',
          styleName: 'Cashmere Sweater',
          colorCode: 'GRY',
          colorName: 'Grey',
          gender: 'MALE',
          unitPrice: 350,
          sizeTemplateId: 'clothing-alpha',
          totalQty: 150,
          totalValue: 52500,
          sizes: [
            { sizeCode: 'S', salesMixPercent: 18, sellThruPercent: 48, units: 27, value: 9450 },
            { sizeCode: 'M', salesMixPercent: 37, sellThruPercent: 55, units: 56, value: 19600 },
            { sizeCode: 'L', salesMixPercent: 30, sellThruPercent: 52, units: 45, value: 15750 },
            { sizeCode: 'XL', salesMixPercent: 15, sellThruPercent: 38, units: 22, value: 7700 },
          ],
        },
      ],
    },
  ];

  const totalUsed = categories.reduce((sum, cat) => sum + cat.budgetUsed, 0);

  return {
    id: 'proposal-1',
    name: 'FW25 Collection - Men',
    version: 1,
    status: 'DRAFT',
    seasonId: 'season-fw25',
    seasonCode: 'FW25',
    seasonName: 'Fall/Winter 2025',
    brandId: 'brand-1',
    brandName: 'Premium Collection',
    totalBudget: 340000,
    usedBudget: totalUsed,
    remainingBudget: 340000 - totalUsed,
    totalSKUs: categories.reduce((sum, cat) => sum + cat.products.length, 0),
    categories,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: {
      id: 'user-1',
      name: 'John Buyer',
    },
  };
}

// ============================================
// Legacy Types (for compatibility)
// ============================================

export interface ProductEntry {
  id: string;
  styleCode: string;
  styleName: string;
  colorCode: string;
  colorName: string;
  categoryId: string;
  categoryName: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  retailPrice: number;
  costPrice: number;
  sizeTemplateId: string;
  selectedSizes: string[];
  sizeQuantities: Record<string, number>;
  totalQuantity: number;
  totalValue: number;

  // GAP-6 & GAP-7: Additional Excel fields
  itemNo?: string;          // ITEM NO column
  composition?: string;     // COMPOSITION column (e.g. "95% Cotton, 5% Elastane")
}

export interface GeneratedSKU {
  id: string;
  productId: string;
  styleCode: string;
  styleName: string;
  colorCode: string;
  colorName: string;
  size: string;
  categoryId: string;
  categoryName: string;
  gender: string;
  retailPrice: number;
  costPrice: number;
  quantity: number;
  value: number;

  // GAP-6 & GAP-7: Additional Excel fields
  itemNo?: string;          // ITEM NO column
  composition?: string;     // COMPOSITION column
}
