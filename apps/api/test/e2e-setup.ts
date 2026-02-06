// E2E Test Setup
import 'reflect-metadata';

// Extended timeout for E2E tests
jest.setTimeout(60000);

// Global test database URL for E2E tests
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ||
  'postgresql://test:test@localhost:5432/dafc_otb_test?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-testing';
process.env.JWT_EXPIRES_IN = '1h';

// Cleanup database before/after tests
beforeAll(async () => {
  // Database setup if needed
});

afterAll(async () => {
  // Database cleanup if needed
});
