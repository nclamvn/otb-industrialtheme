/**
 * Test Data Fixtures for E2E Tests
 * Centralized test data for consistent testing
 */

export const TestUsers = {
  admin: {
    email: 'admin@dafc.com',
    password: 'admin123',
    role: 'ADMIN',
    name: 'Admin User',
    permissions: ['all'],
  },
  financeHead: {
    email: 'finance.head@dafc.com',
    password: 'finance123',
    role: 'FINANCE_HEAD',
    name: 'Finance Head',
    permissions: ['budget.approve', 'budget.reject', 'budget.view', 'reports.view'],
  },
  brandManager: {
    email: 'brand.manager@dafc.com',
    password: 'brand123',
    role: 'BRAND_MANAGER',
    name: 'Brand Manager',
    permissions: ['budget.approve', 'budget.reject', 'budget.view', 'sku.approve', 'sku.view'],
  },
  brandPlanner: {
    email: 'brand.planner@dafc.com',
    password: 'planner123',
    role: 'BRAND_PLANNER',
    name: 'Brand Planner',
    permissions: ['budget.create', 'budget.edit', 'budget.submit', 'sku.create', 'sku.edit'],
  },
  viewer: {
    email: 'viewer@dafc.com',
    password: 'viewer123',
    role: 'BOD_MEMBER',
    name: 'BOD Member',
    permissions: ['budget.view', 'reports.view'],
  },
};

export const TestBrands = {
  rex: { name: 'REX', code: 'REX', storeGroup: 'REX' },
  ttp: { name: 'TTP', code: 'TTP', storeGroup: 'TTP' },
  dafc: { name: 'DAFC', code: 'DAFC', storeGroup: 'DAFC' },
  nike: { name: 'Nike', code: 'NIKE', storeGroup: 'REX' },
  adidas: { name: 'Adidas', code: 'ADID', storeGroup: 'TTP' },
  puma: { name: 'Puma', code: 'PUMA', storeGroup: 'DAFC' },
};

export const TestSeasons = {
  ss2025: {
    name: 'Spring/Summer 2025',
    code: 'SS25',
    startDate: '2025-01-01',
    endDate: '2025-06-30',
  },
  fw2025: {
    name: 'Fall/Winter 2025',
    code: 'FW25',
    startDate: '2025-07-01',
    endDate: '2025-12-31',
  },
  ss2026: {
    name: 'Spring/Summer 2026',
    code: 'SS26',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
  },
};

export const TestCategories = {
  bags: { name: 'Bags', code: 'BAGS' },
  shoes: { name: 'Shoes', code: 'SHOES' },
  accessories: { name: 'Accessories', code: 'ACC' },
  clothing: { name: 'Clothing', code: 'CLOTH' },
  outerwear: { name: 'Outerwear', code: 'OUT' },
};

export const TestGenders = {
  men: { name: 'Men', code: 'M' },
  women: { name: 'Women', code: 'W' },
  unisex: { name: 'Unisex', code: 'U' },
  kids: { name: 'Kids', code: 'K' },
};

export const TestBudget = {
  valid: {
    name: 'Test Budget SS25',
    seasonalBudget: 1000000000,
    replenishmentBudget: 500000000,
    totalBudget: 1500000000,
    currency: 'VND',
  },
  minimal: {
    name: 'Minimal Budget',
    totalBudget: 100000000,
    currency: 'VND',
  },
  large: {
    name: 'Large Budget FW25',
    seasonalBudget: 5000000000,
    replenishmentBudget: 2500000000,
    totalBudget: 7500000000,
    currency: 'VND',
  },
};

export const TestOTBPlan = {
  valid: {
    name: 'Test OTB Plan SS25',
    status: 'DRAFT',
    totalBudget: 1500000000,
    allocatedBudget: 0,
  },
  partial: {
    name: 'Partial OTB Plan',
    status: 'DRAFT',
    totalBudget: 1000000000,
    allocatedBudget: 500000000,
  },
  complete: {
    name: 'Complete OTB Plan',
    status: 'SUBMITTED',
    totalBudget: 1000000000,
    allocatedBudget: 1000000000,
  },
};

export const TestSKU = {
  valid: {
    skuCode: 'SKU-TEST-001',
    styleName: 'Test Style',
    color: 'Black',
    category: 'BAGS',
    gender: 'WOMEN',
    retailPrice: 500000,
    costPrice: 200000,
    quantity: 100,
    leadTime: 60,
    moq: 50,
    margin: 60, // 60% margin
  },
  lowMargin: {
    skuCode: 'SKU-LOW-001',
    styleName: 'Low Margin Style',
    color: 'White',
    category: 'ACCESSORIES',
    gender: 'UNISEX',
    retailPrice: 200000,
    costPrice: 150000,
    quantity: 200,
    margin: 25, // 25% margin - warning
  },
  invalidMargin: {
    skuCode: 'SKU-INV-001',
    styleName: 'Invalid Margin Style',
    retailPrice: 100000,
    costPrice: 90000, // 10% margin - too low
    margin: 10,
  },
  invalidCost: {
    skuCode: 'SKU-INV-002',
    styleName: 'Invalid Cost Style',
    retailPrice: 100000,
    costPrice: 150000, // Cost > Retail - negative margin
    margin: -50,
  },
  premium: {
    skuCode: 'SKU-PREM-001',
    styleName: 'Premium Item',
    color: 'Gold',
    category: 'BAGS',
    gender: 'WOMEN',
    retailPrice: 5000000,
    costPrice: 1500000,
    quantity: 20,
    leadTime: 90,
    moq: 10,
    margin: 70,
  },
};

export const TestSizeProfiles = {
  standard: {
    name: 'Standard',
    sizes: { XS: 5, S: 15, M: 30, L: 30, XL: 15, XXL: 5 },
  },
  topHeavy: {
    name: 'Top Heavy',
    sizes: { XS: 10, S: 25, M: 35, L: 20, XL: 8, XXL: 2 },
  },
  bottomHeavy: {
    name: 'Bottom Heavy',
    sizes: { XS: 2, S: 8, M: 20, L: 35, XL: 25, XXL: 10 },
  },
  shoes: {
    name: 'Shoes Standard',
    sizes: { 36: 5, 37: 10, 38: 20, 39: 25, 40: 20, 41: 12, 42: 8 },
  },
};

export const TestCosting = {
  valid: {
    unitCost: 150000,
    freightPercent: 5,
    taxPercent: 10,
    importDutyPercent: 15,
    landedCost: 195750, // calculated
    srp: 500000,
    margin: 60.85, // calculated
  },
  lowMargin: {
    unitCost: 150000,
    freightPercent: 5,
    taxPercent: 10,
    importDutyPercent: 15,
    landedCost: 195750,
    srp: 250000,
    margin: 21.7, // below threshold
  },
};

export const TestRoutes = {
  public: ['/auth/login', '/auth/forgot-password', '/auth/register'],
  protected: [
    '/dashboard',
    '/budget',
    '/budget/new',
    '/otb-plans',
    '/otb-plans/new',
    '/sku-proposal',
    '/sku-proposal/import',
    '/analytics',
    '/settings',
  ],
  adminOnly: ['/admin/users', '/admin/settings', '/admin/audit-log'],
  financeOnly: ['/finance/reports', '/finance/approvals'],
};

export const ValidationMessages = {
  required: /required|bắt buộc/i,
  invalidEmail: /email.*invalid|email không hợp lệ/i,
  invalidCredentials: /invalid|incorrect|sai|không đúng/i,
  success: /success|thành công/i,
  error: /error|lỗi|failed|thất bại/i,
  saved: /saved|đã lưu/i,
  deleted: /deleted|đã xóa/i,
  approved: /approved|đã duyệt/i,
  rejected: /rejected|từ chối/i,
  submitted: /submitted|đã gửi/i,
  lowMargin: /margin.*low|margin.*thấp/i,
  budgetExceeded: /budget.*exceeded|vượt.*ngân sách/i,
};

export const PerformanceThresholds = {
  pageLoad: 3000, // ms
  apiResponse: 1000, // ms
  chartRender: 2000, // ms
  tableRender: 1500, // ms
  formSubmit: 2000, // ms
  fileUpload: 10000, // ms
  excelImport: 30000, // ms
  reportGeneration: 5000, // ms
};

export const TestStoreGroups = {
  rex: {
    name: 'REX',
    stores: ['REX Saigon Centre', 'REX Vincom Dong Khoi', 'REX Crescent Mall'],
  },
  ttp: {
    name: 'TTP',
    stores: ['TTP AEON Mall', 'TTP Landmark 81', 'TTP Gigamall'],
  },
  dafc: {
    name: 'DAFC',
    stores: ['DAFC Pearl Plaza', 'DAFC Estella', 'DAFC Gateway'],
  },
};

export const TestDeliveryWindows = {
  jan: { code: 'JAN', name: 'January', month: 1 },
  feb: { code: 'FEB', name: 'February', month: 2 },
  mar: { code: 'MAR', name: 'March', month: 3 },
  apr: { code: 'APR', name: 'April', month: 4 },
  may: { code: 'MAY', name: 'May', month: 5 },
  jun: { code: 'JUN', name: 'June', month: 6 },
};
