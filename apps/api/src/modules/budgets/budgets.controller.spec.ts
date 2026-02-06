import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { mockBudgets, createPaginatedResponse } from '../../../test/utils/fixtures';

describe('BudgetsController', () => {
  let controller: BudgetsController;
  let budgetsService: jest.Mocked<BudgetsService>;

  const mockBudgetsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    submit: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    getChangeLogs: jest.fn(),
    getVersionHistory: jest.fn(),
    getSummaryStats: jest.fn(),
  };

  const mockUser = { id: 'user-001', email: 'admin@dafc.com', role: 'ADMIN' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [{ provide: BudgetsService, useValue: mockBudgetsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BudgetsController>(BudgetsController);
    budgetsService = module.get(BudgetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated list of budgets', async () => {
      const paginatedResult = createPaginatedResponse([mockBudgets.draft, mockBudgets.submitted]);
      mockBudgetsService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(mockBudgetsService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(paginatedResult);
    });

    it('should pass filter parameters to service', async () => {
      const query = { page: 1, limit: 10, seasonId: 'season-001', status: 'DRAFT' };
      mockBudgetsService.findAll.mockResolvedValue(createPaginatedResponse([]));

      await controller.findAll(query);

      expect(mockBudgetsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return budget by ID', async () => {
      mockBudgetsService.findOne.mockResolvedValue(mockBudgets.draft);

      const result = await controller.findOne('budget-001');

      expect(mockBudgetsService.findOne).toHaveBeenCalledWith('budget-001');
      expect(result).toEqual(mockBudgets.draft);
    });
  });

  describe('create', () => {
    it('should create new budget', async () => {
      const createData = {
        seasonId: 'season-001',
        brandId: 'brand-001',
        totalBudget: 1000000,
      };
      const createdBudget = { id: 'budget-new', ...createData, status: 'DRAFT' };
      mockBudgetsService.create.mockResolvedValue(createdBudget);

      const result = await controller.create(createData, mockUser as any);

      expect(mockBudgetsService.create).toHaveBeenCalledWith(createData, 'user-001');
      expect(result).toEqual(createdBudget);
    });
  });

  describe('update', () => {
    it('should update budget with change reason', async () => {
      const updateData = {
        totalBudget: 1500000,
        changeReason: 'Budget increase approved',
      };
      const updatedBudget = { ...mockBudgets.draft, totalBudget: 1500000 };
      mockBudgetsService.update.mockResolvedValue(updatedBudget);

      const result = await controller.update('budget-001', updateData, mockUser as any);

      expect(mockBudgetsService.update).toHaveBeenCalledWith(
        'budget-001',
        { totalBudget: 1500000 },
        'user-001',
        'Budget increase approved',
      );
      expect(result).toEqual(updatedBudget);
    });

    it('should update without change reason', async () => {
      const updateData = { totalBudget: 1500000 };
      mockBudgetsService.update.mockResolvedValue({ ...mockBudgets.draft, totalBudget: 1500000 });

      await controller.update('budget-001', updateData, mockUser as any);

      expect(mockBudgetsService.update).toHaveBeenCalledWith(
        'budget-001',
        { totalBudget: 1500000 },
        'user-001',
        undefined,
      );
    });
  });

  describe('remove', () => {
    it('should delete budget', async () => {
      mockBudgetsService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('budget-001');

      expect(mockBudgetsService.remove).toHaveBeenCalledWith('budget-001');
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('submit', () => {
    it('should submit budget for approval', async () => {
      const submittedBudget = { ...mockBudgets.draft, status: 'SUBMITTED' };
      mockBudgetsService.submit.mockResolvedValue(submittedBudget);

      const result = await controller.submit('budget-001', mockUser as any);

      expect(mockBudgetsService.submit).toHaveBeenCalledWith('budget-001', 'user-001');
      expect(result.status).toBe('SUBMITTED');
    });
  });

  describe('approve', () => {
    it('should approve budget with comments', async () => {
      const approvedBudget = { ...mockBudgets.submitted, status: 'APPROVED' };
      mockBudgetsService.approve.mockResolvedValue(approvedBudget);

      const result = await controller.approve(
        'budget-002',
        { comments: 'Approved' },
        mockUser as any,
      );

      expect(mockBudgetsService.approve).toHaveBeenCalledWith(
        'budget-002',
        'user-001',
        'Approved',
      );
      expect(result.status).toBe('APPROVED');
    });

    it('should approve without comments', async () => {
      mockBudgetsService.approve.mockResolvedValue({ ...mockBudgets.submitted, status: 'APPROVED' });

      await controller.approve('budget-002', {}, mockUser as any);

      expect(mockBudgetsService.approve).toHaveBeenCalledWith(
        'budget-002',
        'user-001',
        undefined,
      );
    });
  });

  describe('reject', () => {
    it('should reject budget with reason', async () => {
      const rejectedBudget = { ...mockBudgets.submitted, status: 'REJECTED' };
      mockBudgetsService.reject.mockResolvedValue(rejectedBudget);

      const result = await controller.reject(
        'budget-002',
        { reason: 'Budget too high' },
        mockUser as any,
      );

      expect(mockBudgetsService.reject).toHaveBeenCalledWith(
        'budget-002',
        'user-001',
        'Budget too high',
      );
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('getChangeLogs', () => {
    it('should return budget change history', async () => {
      const changeLogs = createPaginatedResponse([
        { id: 'log-001', fieldName: 'totalBudget', oldValue: '1000000', newValue: '1500000' },
      ]);
      mockBudgetsService.getChangeLogs.mockResolvedValue(changeLogs);

      const result = await controller.getChangeLogs('budget-001', { page: 1, limit: 10 });

      expect(mockBudgetsService.getChangeLogs).toHaveBeenCalledWith('budget-001', { page: 1, limit: 10 });
      expect(result).toEqual(changeLogs);
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history with OTB plans', async () => {
      const versionHistory = { ...mockBudgets.draft, otbPlans: [] };
      mockBudgetsService.getVersionHistory.mockResolvedValue(versionHistory);

      const result = await controller.getVersionHistory('budget-001');

      expect(mockBudgetsService.getVersionHistory).toHaveBeenCalledWith('budget-001');
      expect(result).toEqual(versionHistory);
    });
  });

  describe('getSummaryStats', () => {
    it('should return budget summary statistics', async () => {
      const stats = {
        totalBudgets: 10,
        totalBudgetValue: 15000000,
        byStatus: { DRAFT: 2, SUBMITTED: 3, APPROVED: 5, REJECTED: 0 },
      };
      mockBudgetsService.getSummaryStats.mockResolvedValue(stats);

      const result = await controller.getSummaryStats({ seasonId: 'season-001' });

      expect(mockBudgetsService.getSummaryStats).toHaveBeenCalledWith({ seasonId: 'season-001' });
      expect(result).toEqual(stats);
    });
  });
});
