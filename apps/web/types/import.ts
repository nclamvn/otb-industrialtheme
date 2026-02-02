// ═══════════════════════════════════════════════════════════════════════════════
// AI-Powered Data Import — Type Definitions
// DAFC OTB Platform — Legacy Data Migration System
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Import Targets ──────────────────────────────────────────────────────────

export type ImportTarget =
  | 'products'        // Sản phẩm
  | 'otb_budget'      // Ngân sách OTB
  | 'wssi'            // WSSI Plan
  | 'size_profiles'   // Size profiles
  | 'forecasts'       // Dự báo
  | 'clearance'       // Giải hàng tồn
  | 'kpi_targets'     // Mục tiêu KPI
  | 'suppliers'       // Nhà cung cấp
  | 'categories';     // Danh mục

export const IMPORT_TARGET_LABELS: Record<ImportTarget, string> = {
  products: 'Sản phẩm',
  otb_budget: 'Ngân sách OTB',
  wssi: 'Kế hoạch WSSI',
  size_profiles: 'Phân bổ Size',
  forecasts: 'Dự báo bán hàng',
  clearance: 'Giải hàng tồn kho',
  kpi_targets: 'Mục tiêu KPI',
  suppliers: 'Nhà cung cấp',
  categories: 'Danh mục sản phẩm',
};

// ─── Platform Schema Fields ──────────────────────────────────────────────────

export interface PlatformField {
  id: string;
  label: string;
  labelVi: string;
  type: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'select' | 'boolean';
  required: boolean;
  description?: string;
  descriptionVi?: string;
  options?: string[];           // for 'select' type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    dateFormat?: string;
  };
  aliases: string[];            // common alternative names AI will match against
}

// ─── File Upload & Parsing ───────────────────────────────────────────────────

export interface ImportFile {
  name: string;
  size: number;
  type: string;
  sheets?: string[];           // for Excel files with multiple sheets
  selectedSheet?: string;
  headers: string[];
  sampleRows: Record<string, unknown>[];  // first N rows for preview
  totalRows: number;
  encoding?: string;
  delimiter?: string;          // for CSV
}

// ─── AI Column Mapping ───────────────────────────────────────────────────────

export interface AIColumnMapping {
  sourceColumn: string;        // column header from uploaded file
  targetField: string | null;  // platform field id, null if unmapped
  confidence: number;          // 0-1 confidence score
  aiReason: string;            // why AI chose this mapping (Vietnamese)
  alternatives: Array<{
    targetField: string;
    confidence: number;
    reason: string;
  }>;
  transform?: DataTransform;   // suggested transformation
  userOverride?: boolean;      // user manually changed this
}

export interface DataTransform {
  type: 'none' | 'date_format' | 'currency_parse' | 'unit_convert' | 'text_clean' |
        'number_parse' | 'category_map' | 'split' | 'merge' | 'lookup' | 'formula';
  params: Record<string, unknown>;
  description: string;
  descriptionVi: string;
}

// ─── AI Validation & Suggestions ─────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info' | 'suggestion';

export interface ValidationIssue {
  id: string;
  row: number;
  column: string;
  field: string;
  severity: ValidationSeverity;
  message: string;
  messageVi: string;
  currentValue: unknown;
  suggestedValue?: unknown;
  suggestedAction?: string;
  suggestedActionVi?: string;
  autoFixable: boolean;
  category: 'missing' | 'invalid_type' | 'out_of_range' | 'duplicate' |
            'format_mismatch' | 'inconsistent' | 'anomaly' | 'reference_error';
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  issuesByCategory: Record<string, number>;
  issuesBySeverity: Record<ValidationSeverity, number>;
  autoFixableCount: number;
  score: number;               // 0-100 data quality score
  aiInsights: string[];        // AI observations about the data
  aiInsightsVi: string[];
}

// ─── Import Progress & Status ────────────────────────────────────────────────

export type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export type ImportStatus =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'ai_analyzing'
  | 'mapping'
  | 'validating'
  | 'previewing'
  | 'importing'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface ImportProgress {
  status: ImportStatus;
  step: ImportStep;
  currentRow: number;
  totalRows: number;
  percent: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  startTime: number;
  estimatedTimeRemaining?: number;  // seconds
  currentBatch?: number;
  totalBatches?: number;
  message: string;
  messageVi: string;
}

// ─── Import Configuration ────────────────────────────────────────────────────

export interface ImportConfig {
  target: ImportTarget;
  mode: 'insert' | 'upsert' | 'update_only';
  duplicateHandling: 'skip' | 'overwrite' | 'merge' | 'ask';
  matchKey: string[];           // fields to use for duplicate detection
  batchSize: number;
  skipEmptyRows: boolean;
  trimWhitespace: boolean;
  autoFixEnabled: boolean;      // allow AI to auto-fix simple issues
  dateFormat: string;
  currencyCode: string;
  decimalSeparator: '.' | ',';
  thousandsSeparator: '.' | ',' | ' ' | '';
}

// ─── Import Session ──────────────────────────────────────────────────────────

export interface ImportSession {
  id: string;
  file: ImportFile;
  config: ImportConfig;
  mappings: AIColumnMapping[];
  validation: ValidationSummary;
  issues: ValidationIssue[];
  progress: ImportProgress;
  previewData: Record<string, unknown>[];
  transformedData: Record<string, unknown>[];
  createdAt: number;
  completedAt?: number;
}

// ─── Schema Definitions for Each Target ──────────────────────────────────────

export const TARGET_SCHEMAS: Record<ImportTarget, PlatformField[]> = {
  products: [
    { id: 'sku', label: 'SKU', labelVi: 'Mã SKU', type: 'text', required: true, aliases: ['sku code', 'sku_code', 'skucode', 'mã sản phẩm', 'product_code', 'productcode', 'item_code', 'itemcode', 'mã sp', 'ma_sp', 'barcode', 'mã hàng', 'style code', 'style_code', 'stylecode', 'article', 'article code', 'article_code', 'item no', 'item_no', 'product id', 'product_id'] },
    { id: 'name', label: 'Product Name', labelVi: 'Tên sản phẩm', type: 'text', required: true, aliases: ['product name', 'product_name', 'productname', 'tên sp', 'ten_sp', 'product', 'item_name', 'itemname', 'item name', 'tên hàng', 'description', 'style name', 'style_name', 'stylename', 'article name', 'article_name'] },
    { id: 'category', label: 'Category', labelVi: 'Danh mục', type: 'select', required: true, aliases: ['category', 'nhóm hàng', 'nhom_hang', 'loại', 'type', 'product type', 'product_type', 'producttype', 'danh_muc', 'product category', 'product_category', 'main category', 'main_category', 'class', 'division'], options: ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Accessories', 'Footwear'] },
    { id: 'subcategory', label: 'Subcategory', labelVi: 'Danh mục phụ', type: 'text', required: false, aliases: ['subcategory', 'sub-category', 'sub category', 'sub_category', 'nhóm phụ', 'sub_type', 'subtype', 'sub type', 'phân loại', 'sub class', 'sub_class', 'subclass'] },
    { id: 'brand', label: 'Brand', labelVi: 'Thương hiệu', type: 'text', required: true, aliases: ['brand', 'brand name', 'brand_name', 'brandname', 'thương hiệu', 'thuong_hieu', 'nhãn hiệu', 'label', 'make'] },
    { id: 'season', label: 'Season', labelVi: 'Mùa', type: 'select', required: true, aliases: ['season', 'season code', 'season_code', 'seasoncode', 'mùa vụ', 'mua_vu', 'collection', 'bộ sưu tập', 'ssn', 'season year', 'season_year'], options: ['SS25', 'AW25', 'SS26', 'AW26', 'Core', 'W25', 'S25', 'W26', 'S26'] },
    { id: 'cost_price', label: 'Cost Price', labelVi: 'Giá vốn', type: 'currency', required: true, aliases: ['cost price', 'cost_price', 'costprice', 'giá nhập', 'gia_nhap', 'cost', 'unit cost', 'unit_cost', 'unitcost', 'giá gốc', 'gia_von', 'fob', 'fob price', 'fob_price', 'landed cost', 'landed_cost'] },
    { id: 'retail_price', label: 'Retail Price', labelVi: 'Giá bán lẻ', type: 'currency', required: true, aliases: ['retail price', 'retail_price', 'retailprice', 'giá bán', 'gia_ban', 'price', 'selling price', 'selling_price', 'sellingprice', 'retail', 'gia_ban_le', 'rrp', 'srp', 'msrp', 'unit price', 'unit_price', 'unitprice'] },
    { id: 'supplier', label: 'Supplier', labelVi: 'Nhà cung cấp', type: 'text', required: false, aliases: ['supplier', 'supplier name', 'supplier_name', 'suppliername', 'ncc', 'vendor', 'vendor name', 'vendor_name', 'vendorname', 'factory', 'nhà máy', 'xưởng', 'manufacturer'] },
    { id: 'color', label: 'Color', labelVi: 'Màu sắc', type: 'text', required: false, aliases: ['color', 'color code', 'color_code', 'colorcode', 'colour', 'colour code', 'colour_code', 'màu', 'mau_sac', 'color name', 'color_name', 'colorname'] },
    { id: 'material', label: 'Material', labelVi: 'Chất liệu', type: 'text', required: false, aliases: ['material', 'vải', 'fabric', 'chat_lieu', 'composition', 'fabric composition', 'fabric_composition'] },
    { id: 'status', label: 'Status', labelVi: 'Trạng thái', type: 'select', required: false, aliases: ['status', 'tình trạng', 'trang_thai', 'state', 'product status', 'product_status'], options: ['active', 'inactive', 'discontinued', 'pending'] },
    { id: 'gender', label: 'Gender', labelVi: 'Giới tính', type: 'text', required: false, aliases: ['gender', 'giới tính', 'gioi_tinh', 'sex', 'target gender', 'target_gender'] },
    { id: 'theme', label: 'Theme', labelVi: 'Chủ đề', type: 'text', required: false, aliases: ['theme', 'theme name', 'theme_name', 'themename', 'chủ đề', 'chu_de', 'story', 'collection theme'] },
    { id: 'style', label: 'Style', labelVi: 'Phong cách', type: 'text', required: false, aliases: ['style', 'style name', 'phong cách', 'phong_cach', 'style type', 'style_type'] },
    { id: 'rail', label: 'Rail', labelVi: 'Rail', type: 'text', required: false, aliases: ['rail', 'rail code', 'rail_code', 'railcode', 'fixture', 'display'] },
    { id: 'quantity', label: 'Quantity', labelVi: 'Số lượng', type: 'number', required: false, aliases: ['quantity', 'qty', 'so luong', 'số lượng', 'so_luong', 'units', 'pcs', 'pieces', 'total qty', 'total_qty', 'order qty', 'order_qty'] },
    { id: 'total', label: 'Total', labelVi: 'Tổng', type: 'currency', required: false, aliases: ['total', 'total amount', 'total_amount', 'totalamount', 'tổng', 'tong', 'amount', 'value', 'total value', 'total_value'] },
    { id: 'size', label: 'Size', labelVi: 'Size', type: 'text', required: false, aliases: ['size', 'size code', 'size_code', 'sizecode', 'kích cỡ', 'kich_co', 'size name', 'size_name'] },
    { id: 'size_range', label: 'Size Range', labelVi: 'Dải size', type: 'text', required: false, aliases: ['size range', 'size_range', 'sizerange', 'sizes', 'size run', 'size_run'] },
  ],
  otb_budget: [
    { id: 'category', label: 'Category', labelVi: 'Danh mục', type: 'text', required: true, aliases: ['cat', 'category', 'nhóm hàng', 'nhom_hang', 'loại', 'division', 'dept', 'department', 'class'] },
    { id: 'otb_value', label: 'OTB Value', labelVi: 'Giá trị OTB', type: 'currency', required: true, aliases: ['otb', 'otb value', 'otb_value', 'otb amount', 'otb_amount', 'budget', 'budget_amount', 'plan', 'planned'] },
    { id: 'actual', label: 'Actual', labelVi: 'Thực tế', type: 'currency', required: false, aliases: ['actual', 'actual value', 'actual_value', 'thực tế', 'thuc_te', 'received', 'intake'] },
    { id: 'gap', label: 'Gap', labelVi: 'Chênh lệch', type: 'currency', required: false, aliases: ['gap', 'gap value', 'gap_value', 'difference', 'diff', 'variance', 'chênh lệch', 'chenh_lech'] },
    { id: 'gap_percent', label: 'Gap %', labelVi: '% Chênh lệch', type: 'percent', required: false, aliases: ['% gap', '%gap', 'gap %', 'gap_percent', 'gap percent', 'variance %', 'variance_percent', '% chenh lech'] },
    { id: 'style', label: 'Style Type', labelVi: 'Loại Style', type: 'text', required: false, aliases: ['style', 'style type', 'style_type', 'product type', 'loai', 'carryforward', 'replenishment', 'fashion'] },
    { id: 'mix_percent', label: 'Mix %', labelVi: '% Mix', type: 'percent', required: false, aliases: ['% mix', '%mix', 'mix %', 'mix_percent', 'mix percent', 'mix', 'proportion'] },
    { id: 'season', label: 'Season', labelVi: 'Mùa', type: 'text', required: false, aliases: ['season', 'mùa vụ', 'mua_vu', 'period', 'ssn'] },
    { id: 'month', label: 'Month', labelVi: 'Tháng', type: 'text', required: false, aliases: ['month', 'tháng', 'thang', 'period_month'] },
    { id: 'department', label: 'Department', labelVi: 'Bộ phận', type: 'text', required: false, aliases: ['department', 'phòng ban', 'phong_ban', 'dept'] },
    { id: 'committed', label: 'Committed', labelVi: 'Đã cam kết', type: 'currency', required: false, aliases: ['committed', 'đã đặt', 'on_order', 'committed_amount', 'on order'] },
    { id: 'remaining', label: 'Remaining', labelVi: 'Còn lại', type: 'currency', required: false, aliases: ['remaining', 'còn lại', 'balance', 'available', 'open to buy'] },
  ],
  wssi: [
    { id: 'category', label: 'Category', labelVi: 'Danh mục', type: 'text', required: true, aliases: ['nhóm hàng'] },
    { id: 'week', label: 'Week', labelVi: 'Tuần', type: 'text', required: true, aliases: ['tuần', 'wk', 'week_number'] },
    { id: 'sales_plan', label: 'Sales Plan', labelVi: 'KH Doanh thu', type: 'currency', required: true, aliases: ['kế hoạch bán', 'plan_sales', 'target'] },
    { id: 'sales_actual', label: 'Sales Actual', labelVi: 'DT Thực tế', type: 'currency', required: false, aliases: ['thực tế', 'actual_sales', 'actual'] },
    { id: 'stock_plan', label: 'Stock Plan', labelVi: 'KH Tồn kho', type: 'number', required: false, aliases: ['tồn kho KH', 'planned_stock'] },
    { id: 'stock_actual', label: 'Stock Actual', labelVi: 'Tồn thực tế', type: 'number', required: false, aliases: ['tồn thực', 'actual_stock', 'inventory'] },
    { id: 'intake_plan', label: 'Intake Plan', labelVi: 'KH Nhập hàng', type: 'currency', required: false, aliases: ['kế hoạch nhập', 'purchase_plan'] },
    { id: 'markdown_plan', label: 'Markdown Plan', labelVi: 'KH Markdown', type: 'percent', required: false, aliases: ['% giảm giá', 'markdown_rate'] },
  ],
  size_profiles: [
    { id: 'category', label: 'Category', labelVi: 'Danh mục', type: 'text', required: true, aliases: ['nhóm hàng'] },
    { id: 'size', label: 'Size', labelVi: 'Size', type: 'text', required: true, aliases: ['cỡ', 'kích cỡ', 'size_code'] },
    { id: 'percentage', label: 'Percentage', labelVi: 'Tỷ lệ %', type: 'percent', required: true, aliases: ['tỉ lệ', 'ratio', 'split', 'phần trăm', '%'] },
    { id: 'season', label: 'Season', labelVi: 'Mùa', type: 'text', required: false, aliases: ['mùa vụ'] },
    { id: 'region', label: 'Region', labelVi: 'Khu vực', type: 'text', required: false, aliases: ['vùng', 'area', 'store_group'] },
  ],
  forecasts: [
    { id: 'sku', label: 'SKU', labelVi: 'Mã SKU', type: 'text', required: true, aliases: ['mã sản phẩm', 'product_code'] },
    { id: 'period', label: 'Period', labelVi: 'Kỳ', type: 'text', required: true, aliases: ['tuần', 'tháng', 'week', 'month'] },
    { id: 'forecast_qty', label: 'Forecast Qty', labelVi: 'SL Dự báo', type: 'number', required: true, aliases: ['số lượng dự báo', 'predicted_qty', 'forecast'] },
    { id: 'actual_qty', label: 'Actual Qty', labelVi: 'SL Thực tế', type: 'number', required: false, aliases: ['thực tế', 'sold_qty', 'actual'] },
    { id: 'confidence', label: 'Confidence', labelVi: 'Độ tin cậy', type: 'percent', required: false, aliases: ['tin cậy', 'accuracy'] },
  ],
  clearance: [
    { id: 'sku', label: 'SKU', labelVi: 'Mã SKU', type: 'text', required: true, aliases: ['mã sản phẩm'] },
    { id: 'current_stock', label: 'Current Stock', labelVi: 'Tồn hiện tại', type: 'number', required: true, aliases: ['tồn kho', 'stock', 'qty_on_hand'] },
    { id: 'original_price', label: 'Original Price', labelVi: 'Giá gốc', type: 'currency', required: true, aliases: ['giá ban đầu', 'full_price'] },
    { id: 'current_price', label: 'Current Price', labelVi: 'Giá hiện tại', type: 'currency', required: false, aliases: ['giá bán', 'selling_price'] },
    { id: 'markdown_percent', label: 'Markdown %', labelVi: '% Giảm', type: 'percent', required: false, aliases: ['% markdown', 'discount'] },
    { id: 'weeks_on_hand', label: 'Weeks on Hand', labelVi: 'Tuần tồn', type: 'number', required: false, aliases: ['WOH', 'tuần tồn kho'] },
    { id: 'sell_through', label: 'Sell Through %', labelVi: '% Bán qua', type: 'percent', required: false, aliases: ['tỷ lệ bán', 'ST%'] },
  ],
  kpi_targets: [
    { id: 'kpi_name', label: 'KPI Name', labelVi: 'Tên KPI', type: 'text', required: true, aliases: ['chỉ tiêu', 'metric', 'indicator'] },
    { id: 'target_value', label: 'Target', labelVi: 'Mục tiêu', type: 'number', required: true, aliases: ['giá trị mục tiêu', 'target', 'goal'] },
    { id: 'actual_value', label: 'Actual', labelVi: 'Thực tế', type: 'number', required: false, aliases: ['giá trị thực', 'actual', 'achieved'] },
    { id: 'unit', label: 'Unit', labelVi: 'Đơn vị', type: 'text', required: false, aliases: ['đơn vị tính', 'uom'] },
    { id: 'period', label: 'Period', labelVi: 'Kỳ', type: 'text', required: true, aliases: ['thời gian', 'tháng', 'quý'] },
    { id: 'department', label: 'Department', labelVi: 'Bộ phận', type: 'text', required: false, aliases: ['phòng ban'] },
  ],
  suppliers: [
    { id: 'code', label: 'Supplier Code', labelVi: 'Mã NCC', type: 'text', required: true, aliases: ['mã nhà cung cấp', 'vendor_code', 'supplier_id'] },
    { id: 'name', label: 'Name', labelVi: 'Tên NCC', type: 'text', required: true, aliases: ['tên nhà cung cấp', 'vendor_name', 'company'] },
    { id: 'contact', label: 'Contact', labelVi: 'Liên hệ', type: 'text', required: false, aliases: ['người liên hệ', 'contact_person'] },
    { id: 'email', label: 'Email', labelVi: 'Email', type: 'text', required: false, aliases: ['thư điện tử'] },
    { id: 'phone', label: 'Phone', labelVi: 'Điện thoại', type: 'text', required: false, aliases: ['số điện thoại', 'tel', 'mobile'] },
    { id: 'country', label: 'Country', labelVi: 'Quốc gia', type: 'text', required: false, aliases: ['nước', 'quoc_gia', 'origin'] },
    { id: 'lead_time', label: 'Lead Time (days)', labelVi: 'Thời gian giao (ngày)', type: 'number', required: false, aliases: ['thời gian giao hàng', 'delivery_days'] },
    { id: 'moq', label: 'MOQ', labelVi: 'Đặt hàng tối thiểu', type: 'number', required: false, aliases: ['minimum_order', 'min_qty'] },
  ],
  categories: [
    { id: 'code', label: 'Category Code', labelVi: 'Mã danh mục', type: 'text', required: true, aliases: ['mã nhóm', 'category_id', 'cat_code'] },
    { id: 'name', label: 'Name', labelVi: 'Tên danh mục', type: 'text', required: true, aliases: ['tên nhóm', 'category_name'] },
    { id: 'parent', label: 'Parent Category', labelVi: 'Danh mục cha', type: 'text', required: false, aliases: ['nhóm cha', 'parent_code', 'parent_category'] },
    { id: 'margin_target', label: 'Margin Target %', labelVi: 'Mục tiêu biên lợi nhuận %', type: 'percent', required: false, aliases: ['target_margin', 'biên lợi nhuận'] },
    { id: 'season_relevant', label: 'Season Relevant', labelVi: 'Theo mùa', type: 'boolean', required: false, aliases: ['seasonal', 'theo_mua'] },
  ],
};
