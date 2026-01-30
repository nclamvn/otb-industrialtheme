'use client';

// Size configuration types
export interface SizeConfig {
  id: string;
  name: string;
  sizes: string[];
}

// Predefined size templates
export const SIZE_TEMPLATES: SizeConfig[] = [
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

// Product entry for auto-generation
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
}

// Generated SKU item
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
}

// Size distribution preset
export interface SizeDistribution {
  id: string;
  name: string;
  // Distribution percentages by size position (first, middle, last)
  distribution: 'uniform' | 'bell-curve' | 'right-skew' | 'left-skew' | 'custom';
}

export const SIZE_DISTRIBUTIONS: SizeDistribution[] = [
  { id: 'uniform', name: 'Uniform (Equal)', distribution: 'uniform' },
  { id: 'bell-curve', name: 'Bell Curve (Middle Heavy)', distribution: 'bell-curve' },
  { id: 'right-skew', name: 'Right Skew (Larger Sizes)', distribution: 'right-skew' },
  { id: 'left-skew', name: 'Left Skew (Smaller Sizes)', distribution: 'left-skew' },
];

// Helper to calculate bell curve distribution
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
      // Bell curve distribution (higher in middle)
      weights = sizes.map((_, i) => {
        const mid = (n - 1) / 2;
        const distance = Math.abs(i - mid);
        return Math.exp(-0.5 * Math.pow(distance / (n / 4), 2));
      });
      break;
    case 'right-skew':
      // Right skew (more in larger sizes)
      weights = sizes.map((_, i) => Math.pow(i + 1, 1.5));
      break;
    case 'left-skew':
      // Left skew (more in smaller sizes)
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
      // Last size gets remainder to ensure total is exact
      result[size] = totalQty - distributed;
    } else {
      const qty = Math.round((weights[i] / totalWeight) * totalQty);
      result[size] = qty;
      distributed += qty;
    }
  });

  return result;
}

// Categories for dropdown
export const PRODUCT_CATEGORIES = [
  { id: 'outerwear', name: 'Outerwear', sizeTemplate: 'clothing-alpha' },
  { id: 'tops', name: 'Tops', sizeTemplate: 'clothing-alpha' },
  { id: 'bottoms', name: 'Bottoms', sizeTemplate: 'clothing-numeric' },
  { id: 'dresses', name: 'Dresses', sizeTemplate: 'clothing-alpha' },
  { id: 'suits', name: 'Suits', sizeTemplate: 'clothing-numeric' },
  { id: 'shoes', name: 'Shoes', sizeTemplate: 'shoes-eu' },
  { id: 'bags', name: 'Bags', sizeTemplate: 'accessories' },
  { id: 'accessories', name: 'Accessories', sizeTemplate: 'accessories' },
  { id: 'belts', name: 'Belts', sizeTemplate: 'belt' },
];
