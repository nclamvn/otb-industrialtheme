import * as XLSX from 'xlsx';
import { isFormula, evaluateFormula, createSKUFormulaContext } from './formula-helper';

// Types for parsed SKU data
export interface ParsedSKU {
  rowNumber: number;
  skuCode: string;
  styleName: string;
  colorCode?: string;
  colorName?: string;
  material?: string;
  collection?: string;
  gender: string;
  category: string;
  subcategory?: string;
  retailPrice: number;
  costPrice: number;
  margin?: number;
  orderQuantity: number;
  sizeBreakdown?: Record<string, number>;
  supplierSKU?: string;
  leadTime?: number;
  moq?: number;
  countryOfOrigin?: string;
}

export interface ParseResult {
  success: boolean;
  data: ParsedSKU[];
  errors: ParseError[];
  summary: {
    totalRows: number;
    parsedRows: number;
    errorRows: number;
    totalQuantity: number;
    totalValue: number;
    formulasEvaluated: number;
  };
}

export interface ParseError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

// Column mapping configuration
const COLUMN_MAPPING: Record<string, string[]> = {
  skuCode: ['sku', 'sku_code', 'skucode', 'sku code', 'item code', 'itemcode', 'product code'],
  styleName: ['style', 'style_name', 'stylename', 'style name', 'name', 'product name', 'description'],
  colorCode: ['color_code', 'colorcode', 'color code', 'colour code'],
  colorName: ['color', 'color_name', 'colorname', 'color name', 'colour', 'colour name'],
  material: ['material', 'fabric', 'composition'],
  collection: ['collection', 'season collection', 'line'],
  gender: ['gender', 'sex', 'target'],
  category: ['category', 'cat', 'product category', 'main category'],
  subcategory: ['subcategory', 'sub_category', 'sub category', 'subcat'],
  retailPrice: ['retail', 'retail_price', 'retailprice', 'retail price', 'rrp', 'price', 'selling price', 'retail price (usd)'],
  costPrice: ['cost', 'cost_price', 'costprice', 'cost price', 'wholesale', 'wholesale price', 'unit cost', 'cost price (usd)'],
  margin: ['margin', 'margin %', 'margin_pct', 'profit margin'],
  orderQuantity: ['qty', 'quantity', 'order_qty', 'orderqty', 'order quantity', 'order qty', 'units', 'order'],
  supplierSKU: ['supplier_sku', 'suppliersku', 'supplier sku', 'vendor sku', 'factory code'],
  leadTime: ['lead_time', 'leadtime', 'lead time', 'delivery days', 'days', 'lead time (days)'],
  moq: ['moq', 'min_order', 'minimum order', 'min qty'],
  countryOfOrigin: ['coo', 'country', 'country_of_origin', 'origin', 'made in', 'country of origin'],
};

// Size columns to detect
const SIZE_PATTERNS = [
  /^(xs|s|m|l|xl|xxl|xxxl|2xl|3xl)$/i,
  /^size[_\s]?(xs|s|m|l|xl|xxl|xxxl|2xl|3xl)$/i,
  /^(3[5-9]|4[0-9]|5[0-2])$/,  // Shoe sizes EU
  /^(5|5\.5|6|6\.5|7|7\.5|8|8\.5|9|9\.5|10|10\.5|11|11\.5|12)$/,  // Shoe sizes US
  /^size\s+(xs|s|m|l|xl|xxl|xxxl|2xl|3xl)$/i,  // "Size XS", "Size S" format
];

// Parse Excel file buffer
export function parseExcelFile(buffer: ArrayBuffer): ParseResult {
  const errors: ParseError[] = [];
  const data: ParsedSKU[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    });

    if (rawData.length === 0) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, column: '', message: 'No data found in file', severity: 'error' }],
        summary: { totalRows: 0, parsedRows: 0, errorRows: 0, totalQuantity: 0, totalValue: 0, formulasEvaluated: 0 },
      };
    }

    // Get headers and create column mapping
    const headers = Object.keys(rawData[0]);
    const columnMap = createColumnMapping(headers);
    const sizeColumns = detectSizeColumns(headers);

    // Track formula evaluations
    const formulaCount = { count: 0 };

    // Parse each row
    rawData.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row number (1-indexed + header)
      const rowErrors: ParseError[] = [];

      const parsedRow = parseRow(row, columnMap, sizeColumns, rowNumber, rowErrors, formulaCount);

      if (parsedRow) {
        data.push(parsedRow);
      }

      errors.push(...rowErrors);
    });

    // Calculate summary
    const totalQuantity = data.reduce((sum, sku) => sum + sku.orderQuantity, 0);
    const totalValue = data.reduce(
      (sum, sku) => sum + sku.orderQuantity * sku.retailPrice,
      0
    );

    return {
      success: errors.filter((e) => e.severity === 'error').length === 0,
      data,
      errors,
      summary: {
        totalRows: rawData.length,
        parsedRows: data.length,
        errorRows: rawData.length - data.length,
        totalQuantity,
        totalValue,
        formulasEvaluated: formulaCount.count,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [
        {
          row: 0,
          column: '',
          message: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        },
      ],
      summary: { totalRows: 0, parsedRows: 0, errorRows: 0, totalQuantity: 0, totalValue: 0, formulasEvaluated: 0 },
    };
  }
}

// Create mapping from actual headers to standard field names
function createColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const [field, aliases] of Object.entries(COLUMN_MAPPING)) {
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim();
      if (aliases.includes(normalizedHeader)) {
        mapping[field] = header;
        break;
      }
    }
  }

  return mapping;
}

// Detect size columns
function detectSizeColumns(headers: string[]): string[] {
  return headers.filter((header) =>
    SIZE_PATTERNS.some((pattern) => pattern.test(header.trim()))
  );
}

// Parse a single row
function parseRow(
  row: Record<string, unknown>,
  columnMap: Record<string, string>,
  sizeColumns: string[],
  rowNumber: number,
  errors: ParseError[],
  formulaCount: { count: number }
): ParsedSKU | null {
  // Create formula context from row data
  const formulaContext = createSKUFormulaContext(row);

  // Get required fields
  const skuCode = getStringValue(row, columnMap.skuCode);
  const styleName = getStringValue(row, columnMap.styleName);
  const category = getStringValue(row, columnMap.category);
  const gender = normalizeGender(getStringValue(row, columnMap.gender));

  // Get numeric values with formula support
  const retailPriceResult = getNumericValue(row, columnMap.retailPrice, formulaContext);
  const costPriceResult = getNumericValue(row, columnMap.costPrice, formulaContext);
  const orderQuantityResult = getNumericValue(row, columnMap.orderQuantity, formulaContext);

  const retailPrice = retailPriceResult.value;
  const costPrice = costPriceResult.value;
  const orderQuantity = orderQuantityResult.value;

  // Track formula evaluations
  if (retailPriceResult.wasFormula) formulaCount.count++;
  if (costPriceResult.wasFormula) formulaCount.count++;
  if (orderQuantityResult.wasFormula) formulaCount.count++;

  // Validate required fields
  if (!skuCode) {
    errors.push({ row: rowNumber, column: 'SKU Code', message: 'SKU Code is required', severity: 'error' });
    return null;
  }
  if (!styleName) {
    errors.push({ row: rowNumber, column: 'Style Name', message: 'Style Name is required', severity: 'error' });
    return null;
  }
  if (!category) {
    errors.push({ row: rowNumber, column: 'Category', message: 'Category is required', severity: 'error' });
    return null;
  }
  if (!gender) {
    errors.push({ row: rowNumber, column: 'Gender', message: 'Gender is required', severity: 'error' });
    return null;
  }
  if (retailPrice <= 0) {
    errors.push({ row: rowNumber, column: 'Retail Price', message: 'Retail Price must be greater than 0', severity: 'error' });
    return null;
  }
  if (costPrice <= 0) {
    errors.push({ row: rowNumber, column: 'Cost Price', message: 'Cost Price must be greater than 0', severity: 'error' });
    return null;
  }
  if (orderQuantity <= 0) {
    errors.push({ row: rowNumber, column: 'Quantity', message: 'Order Quantity must be greater than 0', severity: 'error' });
    return null;
  }

  // Calculate margin
  const margin = ((retailPrice - costPrice) / retailPrice) * 100;

  // Parse size breakdown
  const sizeBreakdown: Record<string, number> = {};
  let sizeTotal = 0;

  for (const sizeCol of sizeColumns) {
    const sizeQty = getNumericValue(row, sizeCol, formulaContext).value;
    if (sizeQty > 0) {
      const sizeName = sizeCol.toUpperCase();
      sizeBreakdown[sizeName] = sizeQty;
      sizeTotal += sizeQty;
    }
  }

  // Validate size breakdown if provided
  if (sizeTotal > 0 && Math.abs(sizeTotal - orderQuantity) > 1) {
    errors.push({
      row: rowNumber,
      column: 'Size Breakdown',
      message: `Size breakdown total (${sizeTotal}) doesn't match order quantity (${orderQuantity})`,
      severity: 'warning',
    });
  }

  // Validate margin
  if (margin < 40 || margin > 85) {
    errors.push({
      row: rowNumber,
      column: 'Margin',
      message: `Unusual margin (${margin.toFixed(1)}%). Expected 40-85% for luxury goods`,
      severity: 'warning',
    });
  }

  return {
    rowNumber,
    skuCode,
    styleName,
    colorCode: getStringValue(row, columnMap.colorCode) || undefined,
    colorName: getStringValue(row, columnMap.colorName) || undefined,
    material: getStringValue(row, columnMap.material) || undefined,
    collection: getStringValue(row, columnMap.collection) || undefined,
    gender,
    category,
    subcategory: getStringValue(row, columnMap.subcategory) || undefined,
    retailPrice,
    costPrice,
    margin,
    orderQuantity,
    sizeBreakdown: Object.keys(sizeBreakdown).length > 0 ? sizeBreakdown : undefined,
    supplierSKU: getStringValue(row, columnMap.supplierSKU) || undefined,
    leadTime: getNumericValue(row, columnMap.leadTime, formulaContext).value || undefined,
    moq: getNumericValue(row, columnMap.moq, formulaContext).value || undefined,
    countryOfOrigin: getStringValue(row, columnMap.countryOfOrigin) || undefined,
  };
}

// Helper: Get string value from row
function getStringValue(row: Record<string, unknown>, key?: string): string {
  if (!key || !(key in row)) return '';
  const value = row[key];
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

// Helper: Get numeric value from row (with formula support)
function getNumericValue(
  row: Record<string, unknown>,
  key?: string,
  context?: Record<string, unknown>
): { value: number; wasFormula: boolean } {
  if (!key || !(key in row)) return { value: 0, wasFormula: false };
  const value = row[key];
  if (value === null || value === undefined || value === '') return { value: 0, wasFormula: false };

  // Check if value is a formula
  if (isFormula(value)) {
    const formulaContext = context || createSKUFormulaContext(row);
    const result = evaluateFormula(value as string, formulaContext);
    if (result.success && typeof result.value === 'number') {
      return { value: result.value, wasFormula: true };
    }
    return { value: 0, wasFormula: true };
  }

  // Handle string with currency symbols or commas
  const cleaned = String(value).replace(/[$€£,]/g, '');
  const num = parseFloat(cleaned);
  return { value: isNaN(num) ? 0 : num, wasFormula: false };
}

// Legacy helper for backward compatibility
function getNumericValueSimple(row: Record<string, unknown>, key?: string): number {
  return getNumericValue(row, key).value;
}

// Helper: Normalize gender value
function normalizeGender(value: string): string {
  const upper = value.toUpperCase();
  if (['M', 'MALE', 'MEN', "MEN'S", 'MENS'].includes(upper)) return 'MEN';
  if (['F', 'FEMALE', 'WOMEN', "WOMEN'S", 'WOMENS', 'W'].includes(upper)) return 'WOMEN';
  if (['U', 'UNISEX', 'UNI'].includes(upper)) return 'UNISEX';
  if (['K', 'KIDS', 'CHILDREN', 'CHILD'].includes(upper)) return 'KIDS';
  return value; // Return as-is if not recognized
}
