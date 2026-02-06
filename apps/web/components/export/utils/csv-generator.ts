/**
 * CSV Generation Utilities for Planning Export
 */

export interface PlanningCSVRow {
  season: string;
  collection: string;
  gender: string;
  category: string;
  styleCode: string;
  productName: string;
  size: string;
  units: number;
  unitPrice: number;
  totalValue: number;
  status: string;
}

export interface ExportOptions {
  includeHeaders: boolean;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY';
  delimiter: ',' | ';' | '\t';
  filename?: string;
  columns?: (keyof PlanningCSVRow)[];
}

export const DEFAULT_COLUMNS: (keyof PlanningCSVRow)[] = [
  'season',
  'collection',
  'gender',
  'category',
  'styleCode',
  'productName',
  'size',
  'units',
  'unitPrice',
  'totalValue',
  'status',
];

export const COLUMN_HEADERS: Record<keyof PlanningCSVRow, string> = {
  season: 'Season',
  collection: 'Collection',
  gender: 'Gender',
  category: 'Category',
  styleCode: 'Style Code',
  productName: 'Product Name',
  size: 'Size',
  units: 'Units',
  unitPrice: 'Unit Price',
  totalValue: 'Total Value',
  status: 'Status',
};

/**
 * Escape CSV value to handle special characters
 */
function escapeCSVValue(value: string | number, delimiter: string): string {
  const stringValue = String(value);

  // Check if value needs quoting
  if (
    stringValue.includes(delimiter) ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Format date based on options
 */
export function formatDate(date: Date, format: ExportOptions['dateFormat']): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  return `${year}-${month}-${day}`;
}

/**
 * Generate CSV content from rows
 */
export function generateCSV(
  rows: PlanningCSVRow[],
  options: ExportOptions
): string {
  const { includeHeaders, delimiter, columns = DEFAULT_COLUMNS } = options;
  const lines: string[] = [];

  // Add header row
  if (includeHeaders) {
    const headerRow = columns
      .map((col) => escapeCSVValue(COLUMN_HEADERS[col], delimiter))
      .join(delimiter);
    lines.push(headerRow);
  }

  // Add data rows
  for (const row of rows) {
    const dataRow = columns
      .map((col) => escapeCSVValue(row[col], delimiter))
      .join(delimiter);
    lines.push(dataRow);
  }

  return lines.join('\n');
}

/**
 * Generate filename with date
 */
export function generateFilename(
  prefix: string,
  dateFormat: ExportOptions['dateFormat']
): string {
  const now = new Date();
  const dateStr = formatDate(now, dateFormat).replace(/\//g, '-');
  return `${prefix}_${dateStr}.csv`;
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Flatten budget hierarchy to CSV rows
 */
export interface BudgetNode {
  id: string;
  name: string;
  level: number;
  budget: number;
  allocated: number;
  percentage: number;
  status: string;
  children?: BudgetNode[];
  products?: ProductData[];
  metadata?: {
    collection?: string;
    gender?: string;
    category?: string;
    seasonYear?: string;
  };
}

export interface ProductData {
  id: string;
  styleCode: string;
  name: string;
  unitPrice: number;
  totalQty: number;
  totalValue: number;
  sizes: SizeData[];
  status: string;
}

export interface SizeData {
  size: string;
  units: number;
  value: number;
}

/**
 * Flatten budget tree to CSV rows
 */
export function flattenBudgetToCSV(
  node: BudgetNode,
  seasonName: string = 'SS26',
  parentPath: { collection?: string; gender?: string; category?: string } = {}
): PlanningCSVRow[] {
  const rows: PlanningCSVRow[] = [];

  // Build current path
  const currentPath = {
    collection: node.metadata?.collection || parentPath.collection || node.name,
    gender: node.metadata?.gender || parentPath.gender || '',
    category: node.metadata?.category || parentPath.category || '',
  };

  // Update path based on level
  if (node.level === 1) {
    currentPath.collection = node.name;
  } else if (node.level === 2) {
    currentPath.gender = node.name;
  } else if (node.level === 3) {
    currentPath.category = node.name;
  }

  // If node has products, add product rows
  if (node.products && node.products.length > 0) {
    for (const product of node.products) {
      for (const size of product.sizes) {
        rows.push({
          season: seasonName,
          collection: currentPath.collection,
          gender: currentPath.gender,
          category: currentPath.category,
          styleCode: product.styleCode,
          productName: product.name,
          size: size.size,
          units: size.units,
          unitPrice: product.unitPrice,
          totalValue: size.value,
          status: product.status,
        });
      }
    }
  }

  // Recursively process children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const childRows = flattenBudgetToCSV(child, seasonName, currentPath);
      rows.push(...childRows);
    }
  }

  return rows;
}

/**
 * Flatten SKU Proposal to CSV rows
 */
export interface SKUProposal {
  seasonCode: string;
  categories: {
    id: string;
    name: string;
    products: {
      id: string;
      styleCode: string;
      styleName: string;
      colorName?: string;
      gender: string;
      unitPrice: number;
      sizes: {
        sizeCode: string;
        units: number;
        value: number;
      }[];
    }[];
  }[];
}

export function flattenSKUProposalToCSV(
  proposal: SKUProposal,
  collectionName: string = ''
): PlanningCSVRow[] {
  const rows: PlanningCSVRow[] = [];

  for (const category of proposal.categories) {
    for (const product of category.products) {
      for (const size of product.sizes) {
        rows.push({
          season: proposal.seasonCode,
          collection: collectionName,
          gender: product.gender,
          category: category.name,
          styleCode: product.styleCode,
          productName: product.styleName + (product.colorName ? ` (${product.colorName})` : ''),
          size: size.sizeCode,
          units: size.units,
          unitPrice: product.unitPrice,
          totalValue: size.value,
          status: 'Draft',
        });
      }
    }
  }

  return rows;
}
