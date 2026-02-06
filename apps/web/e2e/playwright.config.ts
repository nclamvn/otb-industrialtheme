import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for DAFC OTB Platform
 *
 * Run modes:
 * - All tests: npx playwright test
 * - UI Mode: npx playwright test --ui
 * - Debug: npx playwright test --debug
 * - Specific browser: npx playwright test --project=chromium
 * - Specific file: npx playwright test tests/auth.spec.ts
 * - Tagged tests: npx playwright test --grep @smoke
 *
 * Reports:
 * - View HTML report: npx playwright show-report
 */

// Test categories for selective running
const testCategories = {
  smoke: ['auth.spec.ts', 'dashboard.spec.ts'],
  critical: ['comprehensive-auth.spec.ts', 'comprehensive-budget.spec.ts'],
  full: ['**/*.spec.ts'],
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,

  // Reporters
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['list'],
        ['github'],
      ]
    : [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['list'],
      ],

  // Global timeout
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  // Global setup/teardown
  globalSetup: undefined, // Can add './global-setup.ts' if needed
  globalTeardown: undefined,

  // Output directories
  outputDir: 'test-results',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Tracing and debugging
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Network
    ignoreHTTPSErrors: true,

    // Locale and timezone
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    },

    // Geolocation (optional)
    // geolocation: { longitude: 106.6297, latitude: 10.8231 },
    // permissions: ['geolocation'],
  },

  // Configure projects for different browsers and scenarios
  projects: [
    // Setup project - runs before all tests
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: /global-teardown\.ts/,
    },

    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
      dependencies: [],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: [],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: [],
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        isMobile: true,
      },
      dependencies: [],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        isMobile: true,
      },
      dependencies: [],
    },

    // Tablet viewports
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro 11'],
      },
      dependencies: [],
    },

    // Branded browser test
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
      dependencies: [],
    },

    // Performance testing project
    {
      name: 'performance',
      testMatch: /performance\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Disable cache for performance testing
        bypassCSP: true,
      },
      dependencies: [],
    },

    // Accessibility testing project
    {
      name: 'accessibility',
      testMatch: /accessibility\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: [],
    },

    // Smoke tests - quick sanity check
    {
      name: 'smoke',
      testMatch: /(auth|dashboard)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: [],
    },

    // Stress tests
    {
      name: 'stress',
      testMatch: /stress.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        actionTimeout: 30000,
        navigationTimeout: 60000,
      },
      timeout: 300000, // 5 minutes for stress tests
      dependencies: [],
    },
  ],

  // Run local dev server before tests
  webServer: process.env.CI
    ? undefined
    : {
        command: 'cd ../.. && pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 180000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
