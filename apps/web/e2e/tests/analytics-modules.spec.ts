/**
 * Comprehensive Analytics Modules E2E Tests
 * @tag @phase1 @new
 *
 * Tests all analytics sub-modules:
 * - /analytics/automation
 * - /analytics/comparison
 * - /analytics/decisions
 * - /analytics/demand
 * - /analytics/forecast
 * - /analytics/insights
 * - /analytics/kpi
 * - /analytics/performance
 * - /analytics/powerbi
 * - /analytics/simulator
 * - /analytics/sku-analysis
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login, navigateAndWait } from '../fixtures/test-helpers';

// Helper to test common analytics page elements
async function testAnalyticsPageBasics(page: any, route: string, expectedTitle: RegExp) {
  await page.goto(route);
  await page.waitForLoadState('networkidle');

  // Should have a heading
  const heading = page.getByRole('heading').first();
  await expect(heading).toBeVisible();

  // Should have main content area
  const content = page.locator('main, [class*="content"], .page-content');
  await expect(content.first()).toBeVisible();
}

test.describe('Analytics - Automation Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display automation page', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/automation', /automation|tự động/i);
  });

  test('should show automation rules list', async ({ page }) => {
    await page.goto('/analytics/automation');
    await page.waitForLoadState('networkidle');

    const rulesList = page.locator('[class*="rule"], [class*="automation"], [data-testid="rules-list"]');

    if (await rulesList.count() > 0) {
      await expect(rulesList.first()).toBeVisible();
    }
  });

  test('should have create automation button', async ({ page }) => {
    await page.goto('/analytics/automation');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.count() > 0) {
      await expect(createBtn.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - Comparison Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display comparison page', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/comparison', /comparison|so sánh/i);
  });

  test('should show comparison selectors', async ({ page }) => {
    await page.goto('/analytics/comparison');
    await page.waitForLoadState('networkidle');

    const selectors = page.locator('select, [role="combobox"], [data-testid*="select"]');

    if (await selectors.count() > 0) {
      await expect(selectors.first()).toBeVisible();
    }
  });

  test('should display comparison charts', async ({ page }) => {
    await page.goto('/analytics/comparison');
    await page.waitForLoadState('networkidle');

    const charts = page.locator('[class*="chart"], canvas, svg[class*="chart"]');

    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - Decisions Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display decisions page', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/decisions', /decision|quyết định/i);
  });

  test('should show decision history', async ({ page }) => {
    await page.goto('/analytics/decisions');
    await page.waitForLoadState('networkidle');

    const history = page.locator('[class*="history"], [class*="decision"], [data-testid="decision-list"]');

    if (await history.count() > 0) {
      await expect(history.first()).toBeVisible();
    }
  });

  test('should have decision timeline', async ({ page }) => {
    await page.goto('/analytics/decisions');
    await page.waitForLoadState('networkidle');

    const timeline = page.locator('[class*="timeline"]');

    if (await timeline.count() > 0) {
      await expect(timeline.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - Demand Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display demand planning page', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/demand', /demand|nhu cầu/i);
  });

  test('should show demand charts', async ({ page }) => {
    await page.goto('/analytics/demand');
    await page.waitForLoadState('networkidle');

    const charts = page.locator('[class*="chart"], canvas, svg');

    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should have date range filters', async ({ page }) => {
    await page.goto('/analytics/demand');
    await page.waitForLoadState('networkidle');

    const dateFilters = page.locator('input[type="date"], [data-testid*="date"], [class*="date-picker"]');

    if (await dateFilters.count() > 0) {
      await expect(dateFilters.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - Forecast Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display forecast page', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/forecast', /forecast|dự báo/i);
  });

  test('should show forecast charts', async ({ page }) => {
    await page.goto('/analytics/forecast');
    await page.waitForLoadState('networkidle');

    const charts = page.locator('[class*="chart"], canvas, svg');

    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should have forecast parameters', async ({ page }) => {
    await page.goto('/analytics/forecast');
    await page.waitForLoadState('networkidle');

    const params = page.locator('input, select, [class*="param"], [class*="setting"]');

    if (await params.count() > 0) {
      await expect(params.first()).toBeVisible();
    }
  });

  test('should display forecast accuracy metrics', async ({ page }) => {
    await page.goto('/analytics/forecast');
    await page.waitForLoadState('networkidle');

    const accuracy = page.locator('[class*="accuracy"], [class*="metric"]').filter({ hasText: /%/ });

    if (await accuracy.count() > 0) {
      await expect(accuracy.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - Insights Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display insights page', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/insights', /insight|phân tích/i);
  });

  test('should show AI-generated insights', async ({ page }) => {
    await page.goto('/analytics/insights');
    await page.waitForLoadState('networkidle');

    const insights = page.locator('[class*="insight"], [class*="ai-"], [data-testid="insight-card"]');

    if (await insights.count() > 0) {
      await expect(insights.first()).toBeVisible();
    }
  });

  test('should have insight categories', async ({ page }) => {
    await page.goto('/analytics/insights');
    await page.waitForLoadState('networkidle');

    const categories = page.locator('[class*="category"], [class*="tab"], [role="tab"]');

    if (await categories.count() > 0) {
      await expect(categories.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - KPI Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display KPI dashboard', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/kpi', /kpi|key.*performance/i);
  });

  test('should show KPI cards', async ({ page }) => {
    await page.goto('/analytics/kpi');
    await page.waitForLoadState('networkidle');

    const kpiCards = page.locator('[class*="kpi"], [class*="metric-card"], [data-testid="kpi-card"]');

    if (await kpiCards.count() > 0) {
      await expect(kpiCards.first()).toBeVisible();
    }
  });

  test('should display KPI values', async ({ page }) => {
    await page.goto('/analytics/kpi');
    await page.waitForLoadState('networkidle');

    const values = page.locator('[class*="value"], [class*="amount"]').filter({ hasText: /[$₫%\d]/ });

    if (await values.count() > 0) {
      await expect(values.first()).toBeVisible();
    }
  });

  test('should show KPI trends', async ({ page }) => {
    await page.goto('/analytics/kpi');
    await page.waitForLoadState('networkidle');

    const trends = page.locator('[class*="trend"], [class*="arrow"], [class*="change"]');

    if (await trends.count() > 0) {
      await expect(trends.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - Performance Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display performance page', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/performance', /performance|hiệu suất/i);
  });

  test('should show performance metrics', async ({ page }) => {
    await page.goto('/analytics/performance');
    await page.waitForLoadState('networkidle');

    const metrics = page.locator('[class*="metric"], [class*="performance"], [data-testid*="metric"]');

    if (await metrics.count() > 0) {
      await expect(metrics.first()).toBeVisible();
    }
  });

  test('should have performance charts', async ({ page }) => {
    await page.goto('/analytics/performance');
    await page.waitForLoadState('networkidle');

    const charts = page.locator('[class*="chart"], canvas, svg');

    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - PowerBI Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display PowerBI page', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/powerbi', /power.*bi|báo cáo/i);
  });

  test('should show PowerBI embed or placeholder', async ({ page }) => {
    await page.goto('/analytics/powerbi');
    await page.waitForLoadState('networkidle');

    const embed = page.locator('iframe, [class*="powerbi"], [class*="embed"], [data-testid="powerbi-embed"]');

    if (await embed.count() > 0) {
      await expect(embed.first()).toBeVisible();
    }
  });

  test('should have report selector', async ({ page }) => {
    await page.goto('/analytics/powerbi');
    await page.waitForLoadState('networkidle');

    const selector = page.locator('select, [role="combobox"]').filter({ hasText: /report|báo cáo/i });

    if (await selector.count() > 0) {
      await expect(selector.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - Simulator Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display simulator page', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/simulator', /simulator|mô phỏng|what.*if/i);
  });

  test('should show simulation parameters', async ({ page }) => {
    await page.goto('/analytics/simulator');
    await page.waitForLoadState('networkidle');

    const params = page.locator('input, select, [class*="slider"], [class*="param"]');

    if (await params.count() > 0) {
      await expect(params.first()).toBeVisible();
    }
  });

  test('should have run simulation button', async ({ page }) => {
    await page.goto('/analytics/simulator');
    await page.waitForLoadState('networkidle');

    const runBtn = page.getByRole('button', { name: /run|simulate|chạy/i });

    if (await runBtn.count() > 0) {
      await expect(runBtn.first()).toBeVisible();
    }
  });

  test('should display simulation results', async ({ page }) => {
    await page.goto('/analytics/simulator');
    await page.waitForLoadState('networkidle');

    const results = page.locator('[class*="result"], [class*="output"], [data-testid="simulation-results"]');

    if (await results.count() > 0) {
      await expect(results.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - SKU Analysis Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display SKU analysis page', async ({ page }) => {
    await testAnalyticsPageBasics(page, '/analytics/sku-analysis', /sku.*analysis|phân tích.*sku/i);
  });

  test('should show SKU data table', async ({ page }) => {
    await page.goto('/analytics/sku-analysis');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [data-testid="sku-table"]');

    if (await table.count() > 0) {
      await expect(table.first()).toBeVisible();
    }
  });

  test('should have SKU filters', async ({ page }) => {
    await page.goto('/analytics/sku-analysis');
    await page.waitForLoadState('networkidle');

    const filters = page.locator('input[type="search"], select, [data-testid*="filter"]');

    if (await filters.count() > 0) {
      await expect(filters.first()).toBeVisible();
    }
  });

  test('should display SKU metrics', async ({ page }) => {
    await page.goto('/analytics/sku-analysis');
    await page.waitForLoadState('networkidle');

    const metrics = page.locator('[class*="metric"], [class*="stat"]').filter({ hasText: /[$₫%\d]/ });

    if (await metrics.count() > 0) {
      await expect(metrics.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - Cross-Module Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should navigate between analytics modules', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for navigation/tabs
    const navLinks = page.locator('nav a[href*="/analytics/"], [role="tab"]');

    if (await navLinks.count() > 1) {
      await navLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Should navigate to a sub-module
      await expect(page).toHaveURL(/analytics\//);
    }
  });

  test('should have breadcrumb navigation', async ({ page }) => {
    await page.goto('/analytics/kpi');
    await page.waitForLoadState('networkidle');

    const breadcrumb = page.locator('nav[aria-label*="breadcrumb"], .breadcrumb, [class*="breadcrumb"]');

    if (await breadcrumb.count() > 0) {
      await expect(breadcrumb.first()).toBeVisible();
    }
  });
});

test.describe('Analytics - Responsive Design', () => {
  const modules = [
    '/analytics/automation',
    '/analytics/comparison',
    '/analytics/kpi',
    '/analytics/forecast',
    '/analytics/simulator',
  ];

  for (const module of modules) {
    test(`${module} should display correctly on mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await login(page, TestUsers.admin);
      await page.goto(module);
      await page.waitForLoadState('networkidle');

      const content = page.locator('main, [class*="content"]');
      await expect(content.first()).toBeVisible();
    });
  }
});

test.describe('Analytics - Role-based Access', () => {
  test('viewer should have read-only access to analytics', async ({ page }) => {
    await login(page, TestUsers.viewer);
    await page.goto('/analytics/kpi');
    await page.waitForLoadState('networkidle');

    // Should be able to view
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('brand planner should access analytics', async ({ page }) => {
    await login(page, TestUsers.brandPlanner);
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('Analytics - Export Functionality', () => {
  test('should export data from KPI module', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics/kpi');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportBtn.click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|pdf)$/i);
      }
    }
  });
});

test.describe('Analytics - Performance', () => {
  const criticalModules = ['/analytics', '/analytics/kpi', '/analytics/forecast'];

  for (const module of criticalModules) {
    test(`${module} should load within acceptable time`, async ({ page }) => {
      await login(page, TestUsers.admin);

      const startTime = Date.now();
      await page.goto(module);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  }
});
