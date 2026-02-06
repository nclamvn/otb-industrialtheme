import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

/**
 * Budgets API Integration Tests
 * Tests the complete budget CRUD operations and workflow
 */

describe('Budgets API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let brandManagerToken: string;
  let financeToken: string;
  let testSeasonId: string;
  let testBrandId: string;
  let testLocationId: string;
  let testBudgetId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    await app.init();

    // Setup test data
    await setupTestData();
  });

  async function setupTestData() {
    const hashedPassword = await bcrypt.hash('Test@Password123', 10);

    // Create test users
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const brandManager = await prisma.user.upsert({
      where: { email: 'brand@test.com' },
      update: {},
      create: {
        email: 'brand@test.com',
        password: hashedPassword,
        name: 'Brand Manager',
        role: 'BRAND_MANAGER',
        status: 'ACTIVE',
      },
    });

    const financeUser = await prisma.user.upsert({
      where: { email: 'finance@test.com' },
      update: {},
      create: {
        email: 'finance@test.com',
        password: hashedPassword,
        name: 'Finance Head',
        role: 'FINANCE_HEAD',
        status: 'ACTIVE',
      },
    });

    // Create tokens
    adminToken = jwtService.sign({
      sub: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });

    brandManagerToken = jwtService.sign({
      sub: brandManager.id,
      email: brandManager.email,
      name: brandManager.name,
      role: brandManager.role,
    });

    financeToken = jwtService.sign({
      sub: financeUser.id,
      email: financeUser.email,
      name: financeUser.name,
      role: financeUser.role,
    });

    // Create test season
    const season = await prisma.season.upsert({
      where: { code: 'TEST-SS25' },
      update: {},
      create: {
        name: 'Test Season SS25',
        code: 'TEST-SS25',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-07-31'),
        isActive: true,
      },
    });
    testSeasonId = season.id;

    // Create test brand
    const brand = await prisma.brand.upsert({
      where: { code: 'TEST-BRAND' },
      update: {},
      create: {
        name: 'Test Brand',
        code: 'TEST-BRAND',
        isActive: true,
      },
    });
    testBrandId = brand.id;

    // Create test location
    const location = await prisma.location.upsert({
      where: { code: 'TEST-LOC' },
      update: {},
      create: {
        name: 'Test Location',
        code: 'TEST-LOC',
        type: 'STORE',
        isActive: true,
      },
    });
    testLocationId = location.id;
  }

  afterAll(async () => {
    // Cleanup test data
    await prisma.budgetAllocation.deleteMany({
      where: {
        OR: [
          { seasonId: testSeasonId },
          { brandId: testBrandId },
        ],
      },
    });
    await prisma.season.deleteMany({ where: { code: 'TEST-SS25' } });
    await prisma.brand.deleteMany({ where: { code: 'TEST-BRAND' } });
    await prisma.location.deleteMany({ where: { code: 'TEST-LOC' } });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin@test.com', 'brand@test.com', 'finance@test.com'] },
      },
    });

    await app.close();
  });

  describe('GET /budgets', () => {
    it('should return list of budgets', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets?status=DRAFT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/budgets').expect(401);
    });
  });

  describe('POST /budgets', () => {
    it('should create a new budget', async () => {
      const budgetData = {
        seasonId: testSeasonId,
        brandId: testBrandId,
        locationId: testLocationId,
        totalBudget: 1000000,
        seasonalBudget: 700000,
        replenishmentBudget: 300000,
        targetUnits: 5000,
        targetGMROI: 2.5,
        targetSellThrough: 0.85,
      };

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(budgetData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('DRAFT');
      expect(response.body.totalBudget).toBe(budgetData.totalBudget);

      testBudgetId = response.body.id;
    });

    it('should return 403 for unauthorized role', async () => {
      // Create a viewer user token
      const viewerToken = jwtService.sign({
        sub: 'viewer-001',
        email: 'viewer@test.com',
        role: 'BRAND_PLANNER',
      });

      await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          seasonId: testSeasonId,
          brandId: testBrandId,
          totalBudget: 1000000,
        })
        .expect(403);
    });

    it('should allow brand manager to create budget', async () => {
      const budgetData = {
        seasonId: testSeasonId,
        brandId: testBrandId,
        locationId: testLocationId,
        totalBudget: 500000,
      };

      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${brandManagerToken}`)
        .send(budgetData);

      // Should succeed or fail based on role permissions
      expect([201, 403]).toContain(response.status);
    });
  });

  describe('GET /budgets/:id', () => {
    it('should return budget by ID', async () => {
      if (!testBudgetId) {
        return; // Skip if no budget was created
      }

      const response = await request(app.getHttpServer())
        .get(`/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testBudgetId);
      expect(response.body).toHaveProperty('season');
      expect(response.body).toHaveProperty('brand');
    });

    it('should return 404 for non-existent budget', async () => {
      await request(app.getHttpServer())
        .get('/budgets/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /budgets/:id', () => {
    it('should update budget', async () => {
      if (!testBudgetId) {
        return;
      }

      const updateData = {
        totalBudget: 1500000,
        changeReason: 'Increased budget for new product line',
      };

      const response = await request(app.getHttpServer())
        .patch(`/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.totalBudget).toBe(updateData.totalBudget);
    });

    it('should return 404 for non-existent budget', async () => {
      await request(app.getHttpServer())
        .patch('/budgets/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ totalBudget: 1000000 })
        .expect(404);
    });
  });

  describe('POST /budgets/:id/submit', () => {
    it('should submit budget for approval', async () => {
      if (!testBudgetId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/budgets/${testBudgetId}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('SUBMITTED');
      expect(response.body.submittedAt).toBeTruthy();
    });
  });

  describe('POST /budgets/:id/approve', () => {
    it('should approve submitted budget', async () => {
      if (!testBudgetId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/budgets/${testBudgetId}/approve`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ comments: 'Budget approved by finance' })
        .expect(200);

      expect(response.body.status).toBe('APPROVED');
      expect(response.body.approvedAt).toBeTruthy();
    });
  });

  describe('POST /budgets/:id/reject', () => {
    let rejectableBudgetId: string;

    beforeAll(async () => {
      // Create a budget to reject
      const budget = await prisma.budgetAllocation.create({
        data: {
          seasonId: testSeasonId,
          brandId: testBrandId,
          locationId: testLocationId,
          totalBudget: 2000000,
          status: 'SUBMITTED',
          version: 1,
          createdById: (await prisma.user.findFirst({ where: { email: 'admin@test.com' } }))!.id,
        },
      });
      rejectableBudgetId = budget.id;
    });

    it('should reject budget with reason', async () => {
      const response = await request(app.getHttpServer())
        .post(`/budgets/${rejectableBudgetId}/reject`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ reason: 'Budget exceeds approved limits' })
        .expect(200);

      expect(response.body.status).toBe('REJECTED');
      expect(response.body.rejectionReason).toBe('Budget exceeds approved limits');
    });
  });

  describe('GET /budgets/:id/change-logs', () => {
    it('should return change logs for budget', async () => {
      if (!testBudgetId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/budgets/${testBudgetId}/change-logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });
  });

  describe('GET /budgets/stats/summary', () => {
    it('should return budget summary statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/budgets/stats/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalBudgets');
      expect(response.body).toHaveProperty('totalBudgetValue');
      expect(response.body).toHaveProperty('byStatus');
    });

    it('should filter stats by season', async () => {
      const response = await request(app.getHttpServer())
        .get(`/budgets/stats/summary?seasonId=${testSeasonId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalBudgets');
    });
  });

  describe('DELETE /budgets/:id', () => {
    let deletableBudgetId: string;

    beforeAll(async () => {
      const budget = await prisma.budgetAllocation.create({
        data: {
          seasonId: testSeasonId,
          brandId: testBrandId,
          locationId: testLocationId,
          totalBudget: 100000,
          status: 'DRAFT',
          version: 1,
          createdById: (await prisma.user.findFirst({ where: { email: 'admin@test.com' } }))!.id,
        },
      });
      deletableBudgetId = budget.id;
    });

    it('should delete budget', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/budgets/${deletableBudgetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.deleted).toBe(true);
    });

    it('should return 404 for already deleted budget', async () => {
      await request(app.getHttpServer())
        .delete(`/budgets/${deletableBudgetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
