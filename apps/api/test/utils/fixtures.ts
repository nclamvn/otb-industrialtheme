/**
 * Test Fixtures for API Testing
 * Contains mock data and factory functions for creating test entities
 */

// User fixtures
export const mockUsers = {
  admin: {
    id: 'user-admin-001',
    email: 'admin@dafc.com',
    name: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
    password: '$2a$10$hashedpassword', // bcrypt hash of 'password123'
    avatar: null,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-12-01'),
    assignedBrands: [],
  },
  financeHead: {
    id: 'user-finance-001',
    email: 'finance@dafc.com',
    name: 'Finance Head',
    role: 'FINANCE_HEAD',
    status: 'ACTIVE',
    password: '$2a$10$hashedpassword',
    avatar: null,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-12-01'),
    assignedBrands: [],
  },
  brandManager: {
    id: 'user-brand-001',
    email: 'brand@dafc.com',
    name: 'Brand Manager',
    role: 'BRAND_MANAGER',
    status: 'ACTIVE',
    password: '$2a$10$hashedpassword',
    avatar: null,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-12-01'),
    assignedBrands: [{ id: 'brand-001', name: 'Nike', code: 'NK' }],
  },
  inactiveUser: {
    id: 'user-inactive-001',
    email: 'inactive@dafc.com',
    name: 'Inactive User',
    role: 'BRAND_PLANNER',
    status: 'INACTIVE',
    password: '$2a$10$hashedpassword',
    avatar: null,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: null,
    assignedBrands: [],
  },
};

// Brand fixtures
export const mockBrands = {
  nike: {
    id: 'brand-001',
    name: 'Nike',
    code: 'NK',
    description: 'Nike sportswear',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  adidas: {
    id: 'brand-002',
    name: 'Adidas',
    code: 'AD',
    description: 'Adidas sportswear',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

// Season fixtures
export const mockSeasons = {
  ss2025: {
    id: 'season-001',
    name: 'Spring/Summer 2025',
    code: 'SS25',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-07-31'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  fw2025: {
    id: 'season-002',
    name: 'Fall/Winter 2025',
    code: 'FW25',
    startDate: new Date('2025-08-01'),
    endDate: new Date('2026-01-31'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
};

// Location fixtures
export const mockLocations = {
  hanoi: {
    id: 'loc-001',
    name: 'Hanoi Store',
    code: 'HN001',
    type: 'STORE',
    address: '123 Hang Bai, Hanoi',
    isActive: true,
  },
  hcmc: {
    id: 'loc-002',
    name: 'HCMC Store',
    code: 'HCM001',
    type: 'STORE',
    address: '456 Nguyen Hue, HCMC',
    isActive: true,
  },
  warehouse: {
    id: 'loc-003',
    name: 'Central Warehouse',
    code: 'WH001',
    type: 'WAREHOUSE',
    address: 'Industrial Zone, Binh Duong',
    isActive: true,
  },
};

// Budget fixtures
export const mockBudgets = {
  draft: {
    id: 'budget-001',
    seasonId: 'season-001',
    brandId: 'brand-001',
    locationId: 'loc-001',
    totalBudget: 1000000,
    seasonalBudget: 700000,
    replenishmentBudget: 300000,
    allocatedBudget: 0,
    remainingBudget: 1000000,
    targetUnits: 5000,
    targetGMROI: 2.5,
    targetSellThrough: 0.85,
    status: 'DRAFT',
    version: 1,
    createdById: 'user-admin-001',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-01'),
    comments: null,
    submittedAt: null,
    approvedAt: null,
    approvedById: null,
    rejectedAt: null,
    rejectedById: null,
    rejectionReason: null,
  },
  submitted: {
    id: 'budget-002',
    seasonId: 'season-001',
    brandId: 'brand-002',
    locationId: 'loc-002',
    totalBudget: 2000000,
    seasonalBudget: 1400000,
    replenishmentBudget: 600000,
    allocatedBudget: 500000,
    remainingBudget: 1500000,
    targetUnits: 10000,
    targetGMROI: 2.8,
    targetSellThrough: 0.88,
    status: 'SUBMITTED',
    version: 1,
    createdById: 'user-brand-001',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-05'),
    comments: 'Submitted for approval',
    submittedAt: new Date('2024-12-05'),
    approvedAt: null,
    approvedById: null,
    rejectedAt: null,
    rejectedById: null,
    rejectionReason: null,
  },
  approved: {
    id: 'budget-003',
    seasonId: 'season-002',
    brandId: 'brand-001',
    locationId: 'loc-001',
    totalBudget: 1500000,
    seasonalBudget: 1000000,
    replenishmentBudget: 500000,
    allocatedBudget: 1500000,
    remainingBudget: 0,
    targetUnits: 7500,
    targetGMROI: 3.0,
    targetSellThrough: 0.90,
    status: 'APPROVED',
    version: 2,
    createdById: 'user-admin-001',
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-15'),
    comments: 'Approved by Finance',
    submittedAt: new Date('2024-11-10'),
    approvedAt: new Date('2024-11-15'),
    approvedById: 'user-finance-001',
    rejectedAt: null,
    rejectedById: null,
    rejectionReason: null,
  },
};

// OTB Plan fixtures
export const mockOtbPlans = {
  draft: {
    id: 'otb-001',
    budgetId: 'budget-001',
    seasonId: 'season-001',
    brandId: 'brand-001',
    name: 'Nike SS25 OTB Plan',
    status: 'DRAFT',
    version: 1,
    totalBudget: 1000000,
    allocatedBudget: 0,
    remainingBudget: 1000000,
    plannedUnits: 5000,
    plannedGMROI: 2.5,
    plannedSellThrough: 0.85,
    createdById: 'user-admin-001',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-01'),
  },
  systemProposed: {
    id: 'otb-002',
    budgetId: 'budget-002',
    seasonId: 'season-001',
    brandId: 'brand-002',
    name: 'Adidas SS25 OTB Plan',
    status: 'SYSTEM_PROPOSED',
    version: 1,
    totalBudget: 2000000,
    allocatedBudget: 800000,
    remainingBudget: 1200000,
    plannedUnits: 10000,
    plannedGMROI: 2.8,
    plannedSellThrough: 0.88,
    createdById: 'user-brand-001',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-03'),
  },
};

// SKU Proposal fixtures
export const mockSkuProposals = {
  draft: {
    id: 'sku-001',
    otbPlanId: 'otb-001',
    skuCode: 'NK-RUN-001',
    productName: 'Nike Air Max 2025',
    category: 'Running',
    subCategory: 'Performance',
    status: 'DRAFT',
    quantity: 100,
    unitCost: 80,
    unitPrice: 150,
    margin: 0.467,
    createdById: 'user-admin-001',
    createdAt: new Date('2024-12-01'),
  },
  validated: {
    id: 'sku-002',
    otbPlanId: 'otb-001',
    skuCode: 'NK-LIFE-002',
    productName: 'Nike Lifestyle Hoodie',
    category: 'Lifestyle',
    subCategory: 'Apparel',
    status: 'VALIDATED',
    quantity: 200,
    unitCost: 40,
    unitPrice: 85,
    margin: 0.529,
    createdById: 'user-admin-001',
    createdAt: new Date('2024-12-01'),
  },
};

// Notification fixtures
export const mockNotifications = {
  budgetApproved: {
    id: 'notif-001',
    userId: 'user-brand-001',
    type: 'BUDGET_APPROVED',
    title: 'Budget Approved',
    message: 'Your budget for Nike SS25 has been approved',
    isRead: false,
    priority: 'HIGH',
    data: { budgetId: 'budget-003' },
    createdAt: new Date('2024-12-01'),
  },
  taskAssigned: {
    id: 'notif-002',
    userId: 'user-admin-001',
    type: 'TASK_ASSIGNED',
    title: 'New Task Assigned',
    message: 'Review OTB Plan for Adidas',
    isRead: true,
    priority: 'MEDIUM',
    data: { otbPlanId: 'otb-002' },
    createdAt: new Date('2024-12-01'),
  },
};

// Factory functions
export const createMockUser = (overrides: Partial<typeof mockUsers.admin> = {}) => ({
  ...mockUsers.admin,
  id: `user-${Date.now()}`,
  ...overrides,
});

export const createMockBudget = (overrides: Partial<typeof mockBudgets.draft> = {}) => ({
  ...mockBudgets.draft,
  id: `budget-${Date.now()}`,
  ...overrides,
});

export const createMockOtbPlan = (overrides: Partial<typeof mockOtbPlans.draft> = {}) => ({
  ...mockOtbPlans.draft,
  id: `otb-${Date.now()}`,
  ...overrides,
});

export const createMockSkuProposal = (overrides: Partial<typeof mockSkuProposals.draft> = {}) => ({
  ...mockSkuProposals.draft,
  id: `sku-${Date.now()}`,
  ...overrides,
});

// Pagination helper
export const createPaginatedResponse = <T>(
  data: T[],
  page = 1,
  limit = 20,
  total?: number,
) => ({
  data,
  meta: {
    total: total ?? data.length,
    page,
    limit,
    totalPages: Math.ceil((total ?? data.length) / limit),
  },
});

// JWT payload fixtures
export const mockJwtPayloads = {
  admin: {
    sub: 'user-admin-001',
    email: 'admin@dafc.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
  financeHead: {
    sub: 'user-finance-001',
    email: 'finance@dafc.com',
    name: 'Finance Head',
    role: 'FINANCE_HEAD',
  },
  brandManager: {
    sub: 'user-brand-001',
    email: 'brand@dafc.com',
    name: 'Brand Manager',
    role: 'BRAND_MANAGER',
  },
};
