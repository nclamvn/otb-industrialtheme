import * as XLSX from 'xlsx';

// Template configuration
interface TemplateConfig {
  brand?: string;
  season?: string;
  categories: { code: string; name: string }[];
  sizes?: string[];
}

// Generate SKU upload template
export function generateSKUTemplate(config: TemplateConfig): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // Main data sheet
  const mainHeaders = [
    'SKU Code*',
    'Style Name*',
    'Color Code',
    'Color Name',
    'Material',
    'Collection',
    'Gender*',
    'Category*',
    'Subcategory',
    'Retail Price*',
    'Cost Price*',
    'Order Quantity*',
    'Supplier SKU',
    'Lead Time (Days)',
    'MOQ',
    'Country of Origin',
  ];

  // Add size columns
  const sizeColumns = config.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  mainHeaders.push(...sizeColumns);

  // Sample data row
  const sampleData = [
    'BAG-2501-BK',
    'Leather Tote',
    'BK',
    'Black',
    'Full Grain Leather',
    'Main',
    'WOMEN',
    config.categories[0]?.code || 'BAGS',
    '',
    '1200',
    '480',
    '100',
    'SUP-BAG-001',
    '60',
    '50',
    'Italy',
    ...sizeColumns.map((_, i) => (i === 2 ? '40' : i === 1 || i === 3 ? '25' : '5')),
  ];

  const mainData = [mainHeaders, sampleData];
  const mainSheet = XLSX.utils.aoa_to_sheet(mainData);

  // Set column widths
  mainSheet['!cols'] = [
    { wch: 15 }, // SKU Code
    { wch: 25 }, // Style Name
    { wch: 12 }, // Color Code
    { wch: 15 }, // Color Name
    { wch: 20 }, // Material
    { wch: 12 }, // Collection
    { wch: 10 }, // Gender
    { wch: 12 }, // Category
    { wch: 15 }, // Subcategory
    { wch: 12 }, // Retail Price
    { wch: 12 }, // Cost Price
    { wch: 15 }, // Order Quantity
    { wch: 15 }, // Supplier SKU
    { wch: 15 }, // Lead Time
    { wch: 8 },  // MOQ
    { wch: 18 }, // Country of Origin
    ...sizeColumns.map(() => ({ wch: 6 })),
  ];

  XLSX.utils.book_append_sheet(workbook, mainSheet, 'SKU Data');

  // Reference sheet for valid values
  const refHeaders = ['Field', 'Valid Values', 'Notes'];
  const refData = [
    refHeaders,
    ['Gender', 'MEN, WOMEN, UNISEX, KIDS', 'Required field'],
    ['Category', config.categories.map((c) => c.code).join(', ') || 'BAGS, SHOES, RTW, ACCESSORIES', 'Required field'],
    ['Collection', 'Main, Pre-Collection, Capsule', 'Optional'],
    ['Country of Origin', 'Italy, France, UK, China, Vietnam', 'Common values'],
  ];

  const refSheet = XLSX.utils.aoa_to_sheet(refData);
  refSheet['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 30 }];

  XLSX.utils.book_append_sheet(workbook, refSheet, 'Reference');

  // Instructions sheet
  const instructionsData = [
    ['SKU Upload Template Instructions'],
    [''],
    ['Required Fields (marked with *):'],
    ['- SKU Code: Unique identifier (format: BRAND-CAT-CODE)'],
    ['- Style Name: Product name or description'],
    ['- Gender: MEN, WOMEN, UNISEX, or KIDS'],
    ['- Category: Product category from reference list'],
    ['- Retail Price: Selling price in USD'],
    ['- Cost Price: Purchase cost in USD'],
    ['- Order Quantity: Total units to order'],
    [''],
    ['Optional Fields:'],
    ['- Color Code/Name: Product color information'],
    ['- Material: Product material/fabric'],
    ['- Collection: Season collection name'],
    ['- Subcategory: More specific category'],
    ['- Supplier SKU: Vendor/factory item code'],
    ['- Lead Time: Manufacturing time in days'],
    ['- MOQ: Minimum order quantity'],
    ['- Country of Origin: Manufacturing country'],
    [''],
    ['Size Columns:'],
    ['- Fill in quantity for each size'],
    ['- Size quantities should sum to Order Quantity'],
    ['- Leave blank for one-size items'],
    [''],
    ['Tips:'],
    ['- Do not modify header row'],
    ['- Delete sample data row before uploading'],
    ['- Check Reference sheet for valid values'],
    ['- Save as .xlsx format'],
    [''],
    config.brand ? [`Brand: ${config.brand}`] : [],
    config.season ? [`Season: ${config.season}`] : [],
  ].filter((row) => row.length > 0);

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsSheet['!cols'] = [{ wch: 60 }];

  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return buffer;
}

// Export validation results to Excel
export function exportValidationResults(
  results: {
    sku: {
      rowNumber: number;
      skuCode: string;
      styleName: string;
    };
    status: 'valid' | 'warning' | 'error';
    errors: { field: string; message: string }[];
    warnings: { field: string; message: string }[];
  }[]
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const validCount = results.filter((r) => r.status === 'valid').length;
  const warningCount = results.filter((r) => r.status === 'warning').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  const summaryData = [
    ['Validation Summary'],
    [''],
    ['Total SKUs', results.length],
    ['Valid', validCount],
    ['Warnings', warningCount],
    ['Errors', errorCount],
    [''],
    ['Status', errorCount === 0 ? 'Can proceed with upload' : 'Fix errors before uploading'],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Detail sheet
  const detailHeaders = ['Row', 'SKU Code', 'Style Name', 'Status', 'Field', 'Issue'];
  const detailData = [detailHeaders];

  for (const result of results) {
    if (result.errors.length === 0 && result.warnings.length === 0) {
      detailData.push([
        result.sku.rowNumber.toString(),
        result.sku.skuCode,
        result.sku.styleName,
        'Valid',
        '-',
        '-',
      ]);
    } else {
      for (const error of result.errors) {
        detailData.push([
          result.sku.rowNumber.toString(),
          result.sku.skuCode,
          result.sku.styleName,
          'Error',
          error.field,
          error.message,
        ]);
      }
      for (const warning of result.warnings) {
        detailData.push([
          result.sku.rowNumber.toString(),
          result.sku.skuCode,
          result.sku.styleName,
          'Warning',
          warning.field,
          warning.message,
        ]);
      }
    }
  }

  const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
  detailSheet['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 25 },
    { wch: 10 },
    { wch: 15 },
    { wch: 50 },
  ];

  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Details');

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return buffer;
}

// Export OTB plan to Excel
export function exportOTBPlan(
  plan: {
    brand: string;
    season: string;
    budget: number;
    version: string;
    lineItems: {
      collection: string;
      gender: string;
      category: string;
      subcategory?: string;
      historicalPct: number;
      systemPct: number;
      userPct: number;
      value: number;
    }[];
  }
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const totalValue = plan.lineItems.reduce((sum, item) => sum + item.value, 0);
  const utilization = (totalValue / plan.budget) * 100;

  const summaryData = [
    ['OTB Plan Export'],
    [''],
    ['Brand', plan.brand],
    ['Season', plan.season],
    ['Version', plan.version],
    [''],
    ['Budget', `$${plan.budget.toLocaleString()}`],
    ['Planned Value', `$${totalValue.toLocaleString()}`],
    ['Utilization', `${utilization.toFixed(1)}%`],
    [''],
    ['Export Date', new Date().toISOString()],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Allocation detail sheet
  const allocationHeaders = [
    'Collection',
    'Gender',
    'Category',
    'Subcategory',
    '% Historical',
    '% System',
    '% User',
    'Variance',
    'Value ($)',
  ];

  const allocationData = [
    allocationHeaders,
    ...plan.lineItems.map((item) => [
      item.collection,
      item.gender,
      item.category,
      item.subcategory || '-',
      `${item.historicalPct.toFixed(1)}%`,
      `${item.systemPct.toFixed(1)}%`,
      `${item.userPct.toFixed(1)}%`,
      `${(item.userPct - item.systemPct) > 0 ? '+' : ''}${(item.userPct - item.systemPct).toFixed(1)}%`,
      item.value.toLocaleString(),
    ]),
    [],
    ['Total', '', '', '', '100%', '100%', '100%', '', totalValue.toLocaleString()],
  ];

  const allocationSheet = XLSX.utils.aoa_to_sheet(allocationData);
  allocationSheet['!cols'] = [
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, allocationSheet, 'Allocation');

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return buffer;
}

// Convert ArrayBuffer to downloadable Blob
export function arrayBufferToBlob(buffer: ArrayBuffer, type: string): Blob {
  return new Blob([buffer], { type });
}

// Trigger download in browser
export function downloadExcel(buffer: ArrayBuffer, filename: string): void {
  const blob = arrayBufferToBlob(
    buffer,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
