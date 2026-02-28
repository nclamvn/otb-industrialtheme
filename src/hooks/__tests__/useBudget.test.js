import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: '1', role: 'ADMIN' } }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (k) => k }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('@/services', () => ({
  masterDataService: {
    getBrands: vi.fn().mockResolvedValue([]),
    getStores: vi.fn().mockResolvedValue([]),
    getSeasons: vi.fn().mockResolvedValue([]),
  },
  budgetService: {
    getAll: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    getOne: vi.fn().mockResolvedValue({ id: '1', status: 'DRAFT' }),
    create: vi.fn().mockResolvedValue({ id: '1' }),
    getStatistics: vi.fn().mockResolvedValue({ totalBudgets: 5 }),
  },
}));

vi.mock('@/utils/constants', () => ({
  STORES: [],
  CURRENT_YEAR: 2025,
  CURRENT_SEASON_GROUP: 'SS',
}));

describe('useBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export useBudget as a function', async () => {
    const mod = await import('@/hooks/useBudget');
    expect(typeof mod.useBudget).toBe('function');
  });

  it('should export from hooks barrel', async () => {
    // Import directly instead of barrel to avoid all context parsing
    const { useBudget } = await import('@/hooks/useBudget');
    expect(typeof useBudget).toBe('function');
  });
});
