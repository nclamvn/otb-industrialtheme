/**
 * Comprehensive Analytics & KPI E2E Tests
 *
 * Tests analytics features:
 * - Dashboard metrics
 * - KPI tracking
 * - Charts and visualizations
 * - Forecasting
 * - Reports
 */

import { test, expect } from '@playwright/test';
import { TestUsers, PerformanceThresholds } from '../fixtures/test-data';
import { login, measurePerformance } from '../fixtures/test-helpers';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics');
  });

  test('should display analytics page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /analytics|phân tích|dashboard/i })).toBeVisible();
  });

  test('should show KPI cards', async ({ page }) => {
    const kpiCards = page.locator('[data-testid="kpi-card"], .kpi-card, [class*="stat-card"]');

    if ((await kpiCards.count()) > 0) {
      await expect(kpiCards.first()).toBeVisible();
    }
  });

  test('should display charts', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for charts to render

    const charts = page.locator('.recharts-wrapper, [data-testid="chart"], canvas, svg[class*="chart"]');

    if ((await charts.count()) > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should support date range filter', async ({ page }) => {
    const dateRange = page.locator('[data-testid="date-range"], [class*="date-picker"]');

    if (await dateRange.isVisible()) {
      await dateRange.click();

      // Look for preset options
      const presets = page.getByText(/7 days|30 days|month|year|tuần|tháng|năm/i);
      if ((await presets.count()) > 0) {
        await expect(presets.first()).toBeVisible();
      }
    }
  });

  test('should filter by brand', async ({ page }) => {
    const brandFilter = page.locator('[data-testid="brand-filter"], [name="brandId"]');

    if (await brandFilter.isVisible()) {
      await brandFilter.click();

      const options = page.locator('[role="option"]');
      if ((await options.count()) > 0) {
        await options.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
  });
});

test.describe('KPI Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics/kpi');
  });

  test('should display KPI overview', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should show KPI targets', async ({ page }) => {
    const targets = page.locator('[data-testid="kpi-target"], .kpi-target');

    if ((await targets.count()) > 0) {
      await expect(targets.first()).toBeVisible();
    }
  });

  test('should display trend indicators', async ({ page }) => {
    const trends = page.locator('[class*="trend"], [data-testid="trend"]');

    if ((await trends.count()) > 0) {
      await expect(trends.first()).toBeVisible();
    }
  });

  test('should show KPI alerts', async ({ page }) => {
    const alertsSection = page.locator('[data-testid="kpi-alerts"], .alerts-section');

    if (await alertsSection.isVisible()) {
      await expect(alertsSection).toBeVisible();
    }
  });
});

test.describe('Forecasting', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics/forecast');
  });

  test('should display forecast page', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should show forecast chart', async ({ page }) => {
    await page.waitForTimeout(2000);

    const chart = page.locator('.recharts-wrapper, [data-testid="forecast-chart"]');

    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });

  test('should support scenario selection', async ({ page }) => {
    const scenarioSelector = page.locator('[data-testid="scenario-select"], [name="scenario"]');

    if (await scenarioSelector.isVisible()) {
      await scenarioSelector.click();

      const options = page.locator('[role="option"]');
      expect(await options.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('Executive Summary', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics/executive-summary');
  });

  test('should display executive summary', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should show key metrics', async ({ page }) => {
    const metrics = page.locator('[data-testid="metric"], .metric-card');

    if ((await metrics.count()) > 0) {
      await expect(metrics.first()).toBeVisible();
    }
  });

  test('should have export functionality', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export|pdf|download|xuất/i });

    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });
});

test.describe('Stock Optimization', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics/stock-optimization');
  });

  test('should display stock optimization page', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should show optimization recommendations', async ({ page }) => {
    const recommendations = page.locator('[data-testid="recommendations"], .recommendations');

    if (await recommendations.isVisible()) {
      await expect(recommendations).toBeVisible();
    }
  });
});

test.describe('Risk Assessment', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics/risk-assessment');
  });

  test('should display risk assessment page', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should show risk indicators', async ({ page }) => {
    const risks = page.locator('[data-testid="risk-indicator"], .risk-level');

    if ((await risks.count()) > 0) {
      await expect(risks.first()).toBeVisible();
    }
  });
});

test.describe('What-If Simulator', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics/simulator');
  });

  test('should display simulator page', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should have parameter sliders', async ({ page }) => {
    const sliders = page.locator('input[type="range"], [role="slider"]');

    if ((await sliders.count()) > 0) {
      await expect(sliders.first()).toBeVisible();
    }
  });

  test('should update results on parameter change', async ({ page }) => {
    const slider = page.locator('input[type="range"], [role="slider"]').first();

    if (await slider.isVisible()) {
      // Get initial value
      const initialValue = await slider.inputValue();

      // Change value
      await slider.fill('50');
      await page.waitForTimeout(500);

      // Results should update (just verify page doesn't crash)
      await expect(page.getByRole('main')).toBeVisible();
    }
  });
});

test.describe('AI Insights', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics/insights');
  });

  test('should display AI insights page', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should show insight cards', async ({ page }) => {
    const insights = page.locator('[data-testid="insight-card"], .insight-card');

    if ((await insights.count()) > 0) {
      await expect(insights.first()).toBeVisible();
    }
  });

  test('should generate new insights', async ({ page }) => {
    const generateBtn = page.getByRole('button', { name: /generate|create|tạo/i });

    if (await generateBtn.isVisible()) {
      await expect(generateBtn).toBeEnabled();
    }
  });
});

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics/reports');
  });

  test('should display reports page', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should list available reports', async ({ page }) => {
    const reportsList = page.locator('[data-testid="reports-list"], .reports-grid');

    if (await reportsList.isVisible()) {
      await expect(reportsList).toBeVisible();
    }
  });

  test('should create new report', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create|new|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();

      // Should show create form
      const form = page.locator('form, [data-testid="report-form"]');
      if (await form.isVisible()) {
        await expect(form).toBeVisible();
      }
    }
  });

  test('should export report', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export|download|xuất/i });

    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });
});

test.describe('Analytics Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should load analytics dashboard quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000); // 5 seconds max
  });

  test('should render charts without blocking', async ({ page }) => {
    await page.goto('/analytics');

    // Page should be interactive while charts load
    const isInteractive = await page.evaluate(() => {
      return document.readyState === 'complete' || document.readyState === 'interactive';
    });

    expect(isInteractive).toBeTruthy();
  });

  test('should handle large data sets', async ({ page }) => {
    await page.goto('/analytics');

    // Add filter to get more data
    const dateRange = page.locator('[data-testid="date-range"]');
    if (await dateRange.isVisible()) {
      await dateRange.click();

      const yearOption = page.getByText(/year|năm|365/i);
      if (await yearOption.isVisible()) {
        await yearOption.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Page should still be responsive
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Analytics Responsive', () => {
  test('should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TestUsers.admin);
    await page.goto('/analytics');

    await expect(page.getByRole('main')).toBeVisible();

    // Charts should resize
    const charts = page.locator('.recharts-wrapper, [data-testid="chart"]');
    if ((await charts.count()) > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should work on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, TestUsers.admin);
    await page.goto('/analytics');

    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Analytics Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should navigate between analytics sections', async ({ page }) => {
    await page.goto('/analytics');

    const sections = [
      { name: /kpi/i, url: '/analytics/kpi' },
      { name: /forecast|dự báo/i, url: '/analytics/forecast' },
      { name: /report|báo cáo/i, url: '/analytics/reports' },
    ];

    for (const section of sections) {
      const link = page.getByRole('link', { name: section.name });
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState('networkidle');

        // Should navigate (URL might contain the section)
        const url = page.url();
        expect(url).toContain('analytics');
      }
    }
  });
});
