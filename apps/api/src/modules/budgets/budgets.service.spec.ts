import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockBudgets, mockSeasons, mockBrands, mockLocations, mockUsers, createPaginatedResponse } from '../../../test/utils/fixtures';
import { createMockPrismaService } from '../../../test/utils/test-utils';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated list of budgets', async () => {
      const budgets = [mockBudgets.draft, mockBudgets.submitted];
      prismaService.budgetAllocation.findMany.mockResolvedValue(budgets);
      prismaService.budgetAllocation.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: budgets,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should apply filters for seasonId, brandId, and status', async () => {
      prismaService.budgetAllocation.findMany.mockResolvedValue([mockBudgets.draft]);
      prismaService.budgetAllocation.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        seasonId: 'season-001',
        brandId: 'brand-001',
        status: 'DRAFT',
      });

      expect(prismaService.budgetAllocation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            seasonId: 'season-001',
            brandId: 'brand-001',
            status: 'DRAFT',
          },
        }),
      );
    });

    it('should use default pagination when not provided', async () => {
      prismaService.budgetAllocation.findMany.mockResolvedValue([]);
      prismaService.budgetAllocation.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should cap limit at 100', async () => {
      prismaService.budgetAllocation.findMany.mockResolvedValue([]);
      prismaService.budgetAllocation.count.mockResolvedValue(0);

      const result = await service.findAll({ limit: 500 });

      expect(result.meta.limit).toBe(100);
    });

    it('should include season, brand, location, and createdBy relations', async () => {
      prismaService.budgetAllocation.findMany.mockResolvedValue([]);
      prismaService.budgetAllocation.count.mockResolvedValue(0);

      await service.findAll({});

      expect(prismaService.budgetAllocation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            season: true,
            brand: true,
            location: true,
            createdBy: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return budget with full relations', async () => {
      const budgetWithRelations = {
        ...mockBudgets.draft,
        season: mockSeasons.ss2025,
        brand: mockBrands.nike,
        location: mockLocations.hanoi,
        createdBy: { id: mockUsers.admin.id, name: mockUsers.admin.name, email: mockUsers.admin.email },
        approvedBy: null,
        otbPlans: [],
      };
      prismaService.budgetAllocation.findUnique.mockResolvedValue(budgetWithRelations);

      const result = await service.findOne('budget-001');

      expect(result).toEqual(budgetWithRelations);
      expect(prismaService.budgetAllocation.findUnique).toHaveBeenCalledWith({
        where: { id: 'budget-001' },
        include: expect.objectContaining({
          season: true,
          brand: true,
          location: true,
          createdBy: expect.any(Object),
          approvedBy: expect.any(Object),
          otbPlans: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException for non-existent budget', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('Budget not found'),
      );
    });
  });

  describe('create', () => {
    it('should create new budget with DRAFT status', async () => {
      const createData = {
        seasonId: 'season-001',
        brandId: 'brand-001',
        locationId: 'loc-001',
        totalBudget: 1000000,
        targetUnits: 5000,
      };
      const createdBudget = {
        id: 'budget-new',
        ...createData,
        status: 'DRAFT',
        version: 1,
        createdById: 'user-001',
      };
      prismaService.budgetAllocation.create.mockResolvedValue(createdBudget);

      const result = await service.create(createData, 'user-001');

      expect(prismaService.budgetAllocation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createData,
          createdById: 'user-001',
          status: 'DRAFT',
          version: 1,
        }),
        include: expect.any(Object),
      });
      expect(result.status).toBe('DRAFT');
    });

    it('should include related entities in response', async () => {
      const createData = { seasonId: 'season-001', brandId: 'brand-001' };
      prismaService.budgetAllocation.create.mockResolvedValue({
        id: 'budget-new',
        ...createData,
        season: mockSeasons.ss2025,
        brand: mockBrands.nike,
        location: mockLocations.hanoi,
      });

      await service.create(createData, 'user-001');

      expect(prismaService.budgetAllocation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            season: true,
            brand: true,
            location: true,
          },
        }),
      );
    });
  });

  describe('update', () => {
    it('should update existing budget', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(mockBudgets.draft);
      prismaService.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
        return callback({
          budgetAllocation: {
            update: jest.fn().mockResolvedValue({
              ...mockBudgets.draft,
              totalBudget: 1500000,
            }),
          },
          budgetChangeLog: {
            createMany: jest.fn(),
          },
        });
      });

      const result = await service.update('budget-001', { totalBudget: 1500000 });

      expect(result.totalBudget).toBe(1500000);
    });

    it('should throw NotFoundException for non-existent budget', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { totalBudget: 1000000 }),
      ).rejects.toThrow(new NotFoundException('Budget not found'));
    });

    it('should log changes when userId and changeReason provided', async () => {
      const originalBudget = { ...mockBudgets.draft, totalBudget: 1000000 };
      prismaService.budgetAllocation.findUnique.mockResolvedValue(originalBudget);

      const mockCreateMany = jest.fn();
      prismaService.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
        return callback({
          budgetAllocation: {
            update: jest.fn().mockResolvedValue({
              ...originalBudget,
              totalBudget: 1500000,
            }),
          },
          budgetChangeLog: {
            createMany: mockCreateMany,
          },
        });
      });

      await service.update(
        'budget-001',
        { totalBudget: 1500000 },
        'user-001',
        'Budget increase approved',
      );

      expect(mockCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            fieldName: 'totalBudget',
            oldValue: '1000000',
            newValue: '1500000',
            changeReason: 'Budget increase approved',
          }),
        ]),
      });
    });
  });

  describe('remove', () => {
    it('should delete existing budget', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(mockBudgets.draft);
      prismaService.budgetAllocation.delete.mockResolvedValue(mockBudgets.draft);

      const result = await service.remove('budget-001');

      expect(prismaService.budgetAllocation.delete).toHaveBeenCalledWith({
        where: { id: 'budget-001' },
      });
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException for non-existent budget', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        new NotFoundException('Budget not found'),
      );
    });
  });

  describe('submit', () => {
    it('should change status to SUBMITTED', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(mockBudgets.draft);
      prismaService.budgetAllocation.update.mockResolvedValue({
        ...mockBudgets.draft,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      });

      const result = await service.submit('budget-001', 'user-001');

      expect(prismaService.budgetAllocation.update).toHaveBeenCalledWith({
        where: { id: 'budget-001' },
        data: {
          status: 'SUBMITTED',
          submittedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe('SUBMITTED');
    });

    it('should throw NotFoundException for non-existent budget', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(null);

      await expect(service.submit('non-existent', 'user-001')).rejects.toThrow(
        new NotFoundException('Budget not found'),
      );
    });
  });

  describe('approve', () => {
    it('should approve budget with comments', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(mockBudgets.submitted);
      prismaService.budgetAllocation.update.mockResolvedValue({
        ...mockBudgets.submitted,
        status: 'APPROVED',
        approvedById: 'user-finance-001',
        approvedAt: new Date(),
        comments: 'Approved by Finance',
      });

      const result = await service.approve(
        'budget-002',
        'user-finance-001',
        'Approved by Finance',
      );

      expect(prismaService.budgetAllocation.update).toHaveBeenCalledWith({
        where: { id: 'budget-002' },
        data: {
          status: 'APPROVED',
          approvedById: 'user-finance-001',
          approvedAt: expect.any(Date),
          comments: 'Approved by Finance',
        },
      });
      expect(result.status).toBe('APPROVED');
    });

    it('should keep existing comments if none provided', async () => {
      const budgetWithComments = { ...mockBudgets.submitted, comments: 'Existing comment' };
      prismaService.budgetAllocation.findUnique.mockResolvedValue(budgetWithComments);
      prismaService.budgetAllocation.update.mockResolvedValue({
        ...budgetWithComments,
        status: 'APPROVED',
      });

      await service.approve('budget-002', 'user-finance-001');

      expect(prismaService.budgetAllocation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            comments: 'Existing comment',
          }),
        }),
      );
    });
  });

  describe('reject', () => {
    it('should reject budget with reason and log change', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(mockBudgets.submitted);

      const mockUpdate = jest.fn().mockResolvedValue({
        ...mockBudgets.submitted,
        status: 'REJECTED',
        rejectedById: 'user-finance-001',
        rejectedAt: new Date(),
        rejectionReason: 'Budget exceeds limit',
      });
      const mockCreate = jest.fn();

      prismaService.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
        return callback({
          budgetAllocation: { update: mockUpdate },
          budgetChangeLog: { create: mockCreate },
        });
      });

      const result = await service.reject(
        'budget-002',
        'user-finance-001',
        'Budget exceeds limit',
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'budget-002' },
        data: {
          status: 'REJECTED',
          rejectedById: 'user-finance-001',
          rejectedAt: expect.any(Date),
          rejectionReason: 'Budget exceeds limit',
        },
      });
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          budgetId: 'budget-002',
          fieldName: 'status',
          oldValue: 'SUBMITTED',
          newValue: 'REJECTED',
          changeReason: 'Budget exceeds limit',
        }),
      });
    });

    it('should throw NotFoundException for non-existent budget', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(null);

      await expect(
        service.reject('non-existent', 'user-001', 'reason'),
      ).rejects.toThrow(new NotFoundException('Budget not found'));
    });
  });

  describe('getChangeLogs', () => {
    it('should return paginated change logs', async () => {
      const changeLogs = [
        {
          id: 'log-001',
          budgetId: 'budget-001',
          fieldName: 'totalBudget',
          oldValue: '1000000',
          newValue: '1500000',
          changedBy: { id: 'user-001', name: 'Admin', email: 'admin@dafc.com' },
          changedAt: new Date(),
        },
      ];
      prismaService.budgetAllocation.findUnique.mockResolvedValue(mockBudgets.draft);
      prismaService.budgetChangeLog.findMany.mockResolvedValue(changeLogs);
      prismaService.budgetChangeLog.count.mockResolvedValue(1);

      const result = await service.getChangeLogs('budget-001', { page: 1, limit: 10 });

      expect(result).toEqual({
        data: changeLogs,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should throw NotFoundException for non-existent budget', async () => {
      prismaService.budgetAllocation.findUnique.mockResolvedValue(null);

      await expect(service.getChangeLogs('non-existent', {})).rejects.toThrow(
        new NotFoundException('Budget not found'),
      );
    });
  });

  describe('getSummaryStats', () => {
    it('should return budget summary statistics', async () => {
      const budgets = [
        { id: 'b1', totalBudget: 1000000, seasonalBudget: 700000, replenishmentBudget: 300000, status: 'DRAFT' },
        { id: 'b2', totalBudget: 2000000, seasonalBudget: 1400000, replenishmentBudget: 600000, status: 'APPROVED' },
        { id: 'b3', totalBudget: 1500000, seasonalBudget: 1000000, replenishmentBudget: 500000, status: 'APPROVED' },
      ];
      prismaService.budgetAllocation.findMany.mockResolvedValue(budgets);

      const result = await service.getSummaryStats({});

      expect(result).toEqual({
        totalBudgets: 3,
        totalBudgetValue: 4500000,
        totalSeasonalBudget: 3100000,
        totalReplenishmentBudget: 1400000,
        byStatus: {
          DRAFT: 1,
          SUBMITTED: 0,
          APPROVED: 2,
          REJECTED: 0,
        },
      });
    });

    it('should filter by seasonId and brandId', async () => {
      prismaService.budgetAllocation.findMany.mockResolvedValue([]);

      await service.getSummaryStats({ seasonId: 'season-001', brandId: 'brand-001' });

      expect(prismaService.budgetAllocation.findMany).toHaveBeenCalledWith({
        where: {
          seasonId: 'season-001',
          brandId: 'brand-001',
        },
        select: expect.any(Object),
      });
    });
  });
});
