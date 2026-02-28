import { vi } from 'vitest';

// Mock all 12 services
export const mockAuthService = {
  login: vi.fn().mockResolvedValue({ accessToken: 'mock-token', refreshToken: 'mock-refresh' }),
  register: vi.fn().mockResolvedValue({ id: '1', name: 'Test User' }),
  logout: vi.fn(),
  refreshToken: vi.fn().mockResolvedValue({ accessToken: 'new-token' }),
  getProfile: vi.fn().mockResolvedValue({ id: '1', name: 'Test User', role: 'ADMIN' }),
};

export const mockBudgetService = {
  getAll: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
  getOne: vi.fn().mockResolvedValue({ id: '1', budgetCode: 'BUD-001', status: 'DRAFT' }),
  create: vi.fn().mockResolvedValue({ id: '1' }),
  update: vi.fn().mockResolvedValue({ id: '1' }),
  submit: vi.fn().mockResolvedValue({ id: '1', status: 'SUBMITTED' }),
  delete: vi.fn().mockResolvedValue(true),
  getStatistics: vi.fn().mockResolvedValue({ totalBudgets: 0, totalAmount: 0 }),
  approveL1: vi.fn().mockResolvedValue({ status: 'LEVEL1_APPROVED' }),
  approveL2: vi.fn().mockResolvedValue({ status: 'APPROVED' }),
  rejectL1: vi.fn().mockResolvedValue({ status: 'REJECTED' }),
  rejectL2: vi.fn().mockResolvedValue({ status: 'REJECTED' }),
  archive: vi.fn().mockResolvedValue(true),
};

export const mockPlanningService = {
  getAll: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
  getOne: vi.fn().mockResolvedValue({ id: '1' }),
  create: vi.fn().mockResolvedValue({ id: '1' }),
  update: vi.fn().mockResolvedValue({ id: '1' }),
  submit: vi.fn().mockResolvedValue({ id: '1' }),
  getVersions: vi.fn().mockResolvedValue([]),
};

export const mockProposalService = {
  getAll: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
  getOne: vi.fn().mockResolvedValue({ id: '1' }),
  create: vi.fn().mockResolvedValue({ id: '1' }),
  update: vi.fn().mockResolvedValue({ id: '1' }),
  submit: vi.fn().mockResolvedValue({ id: '1' }),
};

export const mockApprovalService = {
  getPending: vi.fn().mockResolvedValue([]),
  approve: vi.fn().mockResolvedValue(true),
  reject: vi.fn().mockResolvedValue(true),
};

export const mockApprovalWorkflowService = {
  getWorkflows: vi.fn().mockResolvedValue([]),
  getWorkflow: vi.fn().mockResolvedValue(null),
};

export const mockMasterDataService = {
  getBrands: vi.fn().mockResolvedValue([]),
  getStores: vi.fn().mockResolvedValue([]),
  getSeasons: vi.fn().mockResolvedValue([]),
  getCategories: vi.fn().mockResolvedValue([]),
};

export const mockAiService = {
  getSuggestions: vi.fn().mockResolvedValue([]),
  analyze: vi.fn().mockResolvedValue({}),
};

export const mockAnalyticsService = {
  getDashboard: vi.fn().mockResolvedValue({}),
  getKPIs: vi.fn().mockResolvedValue([]),
};

export const mockImportService = {
  upload: vi.fn().mockResolvedValue({ id: '1' }),
  getStatus: vi.fn().mockResolvedValue({ status: 'completed' }),
};

export const mockOrderService = {
  getAll: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
  getOne: vi.fn().mockResolvedValue({ id: '1' }),
  create: vi.fn().mockResolvedValue({ id: '1' }),
};

export const mockApi = {
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
  patch: vi.fn().mockResolvedValue({ data: {} }),
  delete: vi.fn().mockResolvedValue({ data: {} }),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

// Setup all service mocks
export function setupServiceMocks() {
  vi.mock('@/services/authService', () => ({ authService: mockAuthService }));
  vi.mock('@/services/budgetService', () => ({ budgetService: mockBudgetService }));
  vi.mock('@/services/planningService', () => ({ planningService: mockPlanningService }));
  vi.mock('@/services/proposalService', () => ({ proposalService: mockProposalService }));
  vi.mock('@/services/approvalService', () => ({ approvalService: mockApprovalService }));
  vi.mock('@/services/approvalWorkflowService', () => ({ approvalWorkflowService: mockApprovalWorkflowService }));
  vi.mock('@/services/masterDataService', () => ({ masterDataService: mockMasterDataService }));
  vi.mock('@/services/aiService', () => ({ aiService: mockAiService }));
  vi.mock('@/services/analyticsService', () => ({ analyticsService: mockAnalyticsService }));
  vi.mock('@/services/importService', () => ({ importService: mockImportService }));
  vi.mock('@/services/orderService', () => ({ orderService: mockOrderService }));
  vi.mock('@/services/api', () => ({ default: mockApi }));
}
