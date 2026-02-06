/**
 * WEB WORKER for Excel Processing
 *
 * Moves heavy Excel parsing OFF the main thread
 * Prevents UI blocking during large file processing
 *
 * Usage:
 * const worker = new Worker(new URL('./worker.ts', import.meta.url));
 * worker.postMessage({ type: 'parse', buffer: arrayBuffer });
 * worker.onmessage = (e) => { handleResult(e.data); };
 */

import * as XLSX from 'xlsx';

// Worker message types
interface WorkerMessage {
  type: 'parse' | 'validate' | 'abort';
  id: string;
  buffer?: ArrayBuffer;
  data?: unknown[];
  options?: WorkerParseOptions;
}

interface WorkerParseOptions {
  chunkSize?: number;
  maxRows?: number;
  validateOnParse?: boolean;
}

interface WorkerResponse {
  type: 'progress' | 'chunk' | 'complete' | 'error';
  id: string;
  data?: unknown;
  error?: string;
}

// Column mapping
const COLUMN_MAPPING: Record<string, string[]> = {
  skuCode: ['sku', 'sku_code', 'skucode', 'sku code', 'item code', 'itemcode', 'product code', 'article'],
  styleName: ['style', 'style_name', 'stylename', 'style name', 'name', 'product name', 'description'],
  colorCode: ['color_code', 'colorcode', 'color code', 'colour code'],
  colorName: ['color', 'color_name', 'colorname', 'color name', 'colour'],
  material: ['material', 'fabric', 'composition'],
  collection: ['collection', 'season collection', 'line', 'season'],
  gender: ['gender', 'sex', 'target'],
  category: ['category', 'cat', 'product category', 'main category', 'division'],
  subcategory: ['subcategory', 'sub_category', 'sub category', 'subcat'],
  retailPrice: ['retail', 'retail_price', 'retailprice', 'retail price', 'rrp', 'price', 'selling price'],
  costPrice: ['cost', 'cost_price', 'costprice', 'cost price', 'wholesale', 'unit cost', 'fob'],
  margin: ['margin', 'margin %', 'margin_pct', 'profit margin'],
  orderQuantity: ['qty', 'quantity', 'order_qty', 'order quantity', 'units', 'order', 'total qty'],
  supplierSKU: ['supplier_sku', 'suppliersku', 'supplier sku', 'vendor sku', 'factory code'],
  leadTime: ['lead_time', 'leadtime', 'lead time', 'delivery days', 'lt'],
  moq: ['moq', 'min_order', 'minimum order', 'min qty'],
  countryOfOrigin: ['coo', 'country', 'country_of_origin', 'origin', 'made in'],
};

const SIZE_PATTERNS = [
  /^(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl)$/i,
  /^size[_\s-]?(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl)$/i,
  /^(3[5-9]|4[0-9]|5[0-2])$/,
];

const GENDER_MAP: Record<string, string> = {
  'M': 'MEN', 'MALE': 'MEN', 'MEN': 'MEN', "MEN'S": 'MEN', 'MENS': 'MEN',
  'F': 'WOMEN', 'FEMALE': 'WOMEN', 'WOMEN': 'WOMEN', "WOMEN'S": 'WOMEN', 'WOMENS': 'WOMEN', 'W': 'WOMEN',
  'U': 'UNISEX', 'UNISEX': 'UNISEX', 'UNI': 'UNISEX',
  'K': 'KIDS', 'KIDS': 'KIDS', 'CHILDREN': 'KIDS', 'CHILD': 'KIDS',
};

let currentJobId: string | null = null;

// Main message handler
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, id, buffer, options } = e.data;

  switch (type) {
    case 'parse':
      currentJobId = id;
      await parseExcel(id, buffer!, options);
      break;

    case 'abort':
      currentJobId = null;
      break;
  }
};

async function parseExcel(
  jobId: string,
  buffer: ArrayBuffer,
  options: WorkerParseOptions = {}
) {
  const { chunkSize = 1000, maxRows = 100000 } = options;
  const startTime = performance.now();

  try {
    // Send initial progress
    sendResponse({ type: 'progress', id: jobId, data: { phase: 'reading', percentage: 0 } });

    // Parse workbook
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellStyles: false,
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const totalRows = Math.min(range.e.r, maxRows);

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: true,
    });

    if (rawData.length === 0) {
      sendResponse({
        type: 'complete',
        id: jobId,
        data: {
          success: false,
          totalRows: 0,
          parsedRows: 0,
          errors: [{ row: 0, column: '', message: 'No data found', severity: 'error' }],
        },
      });
      return;
    }

    // Create mappings
    const headers = Object.keys(rawData[0]);
    const columnMap = createColumnMapping(headers);
    const sizeColumns = headers.filter(h => SIZE_PATTERNS.some(p => p.test(h.trim())));

    // Process in chunks
    const allData: unknown[] = [];
    const allErrors: unknown[] = [];
    let totalQuantity = 0;
    let totalValue = 0;

    const totalChunks = Math.ceil(rawData.length / chunkSize);

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      // Check if aborted
      if (currentJobId !== jobId) {
        return;
      }

      const startIdx = chunkIdx * chunkSize;
      const endIdx = Math.min(startIdx + chunkSize, rawData.length);
      const chunkData = rawData.slice(startIdx, endIdx);

      const chunkRows: unknown[] = [];
      const chunkErrors: unknown[] = [];

      for (let i = 0; i < chunkData.length; i++) {
        const rowNumber = startIdx + i + 2;
        const row = chunkData[i];
        const rowErrors: unknown[] = [];

        const parsed = parseRow(row, columnMap, sizeColumns, rowNumber, rowErrors);

        if (parsed) {
          chunkRows.push(parsed);
          const qty = parsed.orderQuantity as number;
          const price = parsed.retailPrice as number;
          totalQuantity += qty;
          totalValue += qty * price;
        }

        chunkErrors.push(...rowErrors);
      }

      allData.push(...chunkRows);
      allErrors.push(...chunkErrors);

      // Send progress
      const percentage = Math.round((endIdx / rawData.length) * 100);
      sendResponse({
        type: 'progress',
        id: jobId,
        data: {
          phase: 'parsing',
          percentage,
          currentRow: endIdx,
          totalRows: rawData.length,
          parsedRows: allData.length,
          errors: allErrors.length,
        },
      });

      // Send chunk for streaming processing
      if (chunkRows.length > 0) {
        sendResponse({
          type: 'chunk',
          id: jobId,
          data: {
            chunkIndex: chunkIdx,
            rows: chunkRows,
            startRow: startIdx + 2,
            endRow: endIdx + 1,
          },
        });
      }
    }

    // Complete
    sendResponse({
      type: 'complete',
      id: jobId,
      data: {
        success: allErrors.filter((e) => (e as Record<string, unknown>).severity === 'error').length === 0,
        totalRows: rawData.length,
        parsedRows: allData.length,
        errorRows: rawData.length - allData.length,
        totalQuantity,
        totalValue,
        errors: allErrors.slice(0, 500),
        processingTime: performance.now() - startTime,
      },
    });

  } catch (error) {
    sendResponse({
      type: 'error',
      id: jobId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function createColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const headerLower = new Map(headers.map(h => [h.toLowerCase().trim(), h]));

  for (const [field, aliases] of Object.entries(COLUMN_MAPPING)) {
    for (const alias of aliases) {
      if (headerLower.has(alias)) {
        mapping[field] = headerLower.get(alias)!;
        break;
      }
    }
  }

  return mapping;
}

function parseRow(
  row: Record<string, unknown>,
  columnMap: Record<string, string>,
  sizeColumns: string[],
  rowNumber: number,
  errors: unknown[]
): Record<string, unknown> | null {
  const skuCode = getString(row, columnMap.skuCode);
  const styleName = getString(row, columnMap.styleName);
  const category = getString(row, columnMap.category);
  const gender = GENDER_MAP[getString(row, columnMap.gender).toUpperCase()] || getString(row, columnMap.gender);
  const retailPrice = getNumber(row, columnMap.retailPrice);
  const costPrice = getNumber(row, columnMap.costPrice);
  const orderQuantity = getNumber(row, columnMap.orderQuantity);

  // Validate required
  if (!skuCode) {
    errors.push({ row: rowNumber, column: 'SKU', message: 'Required', severity: 'error' });
    return null;
  }
  if (!styleName) {
    errors.push({ row: rowNumber, column: 'Style', message: 'Required', severity: 'error' });
    return null;
  }
  if (!category) {
    errors.push({ row: rowNumber, column: 'Category', message: 'Required', severity: 'error' });
    return null;
  }
  if (retailPrice <= 0 || costPrice <= 0 || orderQuantity <= 0) {
    errors.push({ row: rowNumber, column: 'Price/Qty', message: 'Invalid values', severity: 'error' });
    return null;
  }

  const margin = ((retailPrice - costPrice) / retailPrice) * 100;

  // Size breakdown
  let sizeBreakdown: Record<string, number> | undefined;
  if (sizeColumns.length > 0) {
    sizeBreakdown = {};
    for (const col of sizeColumns) {
      const qty = getNumber(row, col);
      if (qty > 0) sizeBreakdown[col.toUpperCase()] = qty;
    }
    if (Object.keys(sizeBreakdown).length === 0) sizeBreakdown = undefined;
  }

  return {
    rowNumber,
    skuCode,
    styleName,
    colorCode: getString(row, columnMap.colorCode) || undefined,
    colorName: getString(row, columnMap.colorName) || undefined,
    material: getString(row, columnMap.material) || undefined,
    collection: getString(row, columnMap.collection) || undefined,
    gender,
    category,
    subcategory: getString(row, columnMap.subcategory) || undefined,
    retailPrice,
    costPrice,
    margin,
    orderQuantity,
    sizeBreakdown,
    supplierSKU: getString(row, columnMap.supplierSKU) || undefined,
    leadTime: getNumber(row, columnMap.leadTime) || undefined,
    moq: getNumber(row, columnMap.moq) || undefined,
    countryOfOrigin: getString(row, columnMap.countryOfOrigin) || undefined,
  };
}

function getString(row: Record<string, unknown>, key?: string): string {
  if (!key) return '';
  const val = row[key];
  return val == null ? '' : String(val).trim();
}

const numRegex = /[$€£¥₫,\s]/g;
function getNumber(row: Record<string, unknown>, key?: string): number {
  if (!key) return 0;
  const val = row[key];
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(numRegex, ''));
  return isNaN(num) ? 0 : num;
}

function sendResponse(response: WorkerResponse) {
  self.postMessage(response);
}

export {};
