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

describe('Budget Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export budgetService with required CRUD methods', async () => {
    const { budgetService } = await import('@/services/budgetService');
    expect(budgetService).toBeDefined();
    expect(typeof budgetService.getAll).toBe('function');
    expect(typeof budgetService.getOne).toBe('function');
    expect(typeof budgetService.create).toBe('function');
    expect(typeof budgetService.update).toBe('function');
    expect(typeof budgetService.submit).toBe('function');
    expect(typeof budgetService.delete).toBe('function');
    expect(typeof budgetService.getStatistics).toBe('function');
  });

  it('should call api when invoking getAll', async () => {
    const api = (await import('@/services/api')).default;
    const { budgetService } = await import('@/services/budgetService');
    await budgetService.getAll({});
    expect(api.get).toHaveBeenCalled();
  });
});

describe('Service Barrel Exports', () => {
  it('should export all services from index', async () => {
    const services = await import('@/services/index');
    expect(services.budgetService).toBeDefined();
    expect(services.planningService).toBeDefined();
    expect(services.proposalService).toBeDefined();
    expect(services.approvalService).toBeDefined();
    expect(services.masterDataService).toBeDefined();
    expect(services.analyticsService).toBeDefined();
  });
});
