import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface MockPrismaModel {
  findUnique: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
  createMany?: jest.Mock;
  updateMany?: jest.Mock;
}

interface MockPrismaService {
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $transaction: jest.Mock;
  user: MockPrismaModel;
  budgetAllocation: MockPrismaModel;
  budgetChangeLog: Pick<MockPrismaModel, 'findMany' | 'create' | 'createMany' | 'count'>;
  otbPlan: MockPrismaModel;
  skuProposal: MockPrismaModel;
  brand: MockPrismaModel;
  season: MockPrismaModel;
  location: MockPrismaModel;
  category: MockPrismaModel;
  notification: Pick<MockPrismaModel, 'findMany' | 'create' | 'update' | 'updateMany' | 'count'>;
  workflow: Pick<MockPrismaModel, 'findUnique' | 'findMany' | 'create' | 'update' | 'count'>;
}

/**
 * Create a mock Prisma service with common database operations
 */
export const createMockPrismaService = (): MockPrismaService => ({
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn((callback: (prisma: MockPrismaService) => unknown) => callback(createMockPrismaService())),

  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  budgetAllocation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  budgetChangeLog: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
  },

  otbPlan: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  skuProposal: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  brand: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  season: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  location: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  category: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },

  workflow: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
});

/**
 * Create a mock JWT service
 */
export const createMockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({
    sub: 'test-user-id',
    email: 'test@example.com',
    role: 'ADMIN',
  }),
  decode: jest.fn(),
});

/**
 * Generate test access token
 */
export const generateTestToken = (
  jwtService: JwtService,
  payload: { id: string; email: string; role: string; name?: string },
) => {
  return jwtService.sign({
    sub: payload.id,
    email: payload.email,
    role: payload.role,
    name: payload.name || 'Test User',
  });
};

/**
 * Setup NestJS application for E2E testing
 */
export const setupTestApp = async (module: TestingModule): Promise<INestApplication> => {
  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return app;
};

/**
 * Wait for a condition to be true
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for condition');
};

/**
 * Mock HTTP response helper
 */
export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock HTTP request helper
 */
export const mockRequest = (
  body: any = {},
  params: any = {},
  query: any = {},
  user: any = null,
) => ({
  body,
  params,
  query,
  user,
  headers: {},
  get: jest.fn(),
});

/**
 * Performance measurement helper
 */
export const measurePerformance = async <T>(
  fn: () => Promise<T>,
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};
