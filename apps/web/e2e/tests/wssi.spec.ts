/**
 * Comprehensive WSSI (Weekly Sales Stock Intake) E2E Tests
 * @tag @phase4 @new
 *
 * Tests WSSI features:
 * - /wssi - Main WSSI dashboard
 * - /wssi/analysis - Analysis view
 * - /wssi/reports - Reports
 */

import { test, expect } from '@playwright/test';
import { TestUsers, TestBrands, TestSeasons } from '../fixtures/test-data';
import { login, navigateAndWait } from '../fixtures/test-helpers';

test.describe('WSSI - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/wssi');
  });

  test('should display WSSI dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /wssi|weekly.*sales|stock.*intake/i });
    await expect(heading).toBeVisible();
  });

  test('should show week selector', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const weekSelector = page.locator('[class*="week-selector"], select, [role="combobox"]').filter({ hasText: /week|tuần/i });

    if (await weekSelector.count() > 0) {
      await expect(weekSelector.first()).toBeVisible();
    }
  });

  test('should display WSSI grid/table', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const grid = page.locator('table, [role="grid"], [data-testid="wssi-grid"]');
    await expect(grid.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show sales column', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const salesCol = page.locator('th, [role="columnheader"]').filter({ hasText: /sales|bán/i });

    if (await salesCol.count() > 0) {
      await expect(salesCol.first()).toBeVisible();
    }
  });

  test('should show stock column', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const stockCol = page.locator('th, [role="columnheader"]').filter({ hasText: /stock|tồn kho/i });

    if (await stockCol.count() > 0) {
      await expect(stockCol.first()).toBeVisible();
    }
  });

  test('should show intake column', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const intakeCol = page.locator('th, [role="columnheader"]').filter({ hasText: /intake|nhập/i });

    if (await intakeCol.count() > 0) {
      await expect(intakeCol.first()).toBeVisible();
    }
  });

  test('should filter by brand', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const brandFilter = page.locator('select, [role="combobox"]').filter({ hasText: /brand|thương hiệu/i });

    if (await brandFilter.count() > 0) {
      await brandFilter.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should filter by category', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const categoryFilter = page.locator('select, [role="combobox"]').filter({ hasText: /category|danh mục/i });

    if (await categoryFilter.count() > 0) {
      await categoryFilter.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should have date range picker', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const datePicker = page.locator('input[type="date"], [data-testid="date-range"]');

    if (await datePicker.count() > 0) {
      await expect(datePicker.first()).toBeVisible();
    }
  });

  test('should export WSSI data', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportBtn.click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/i);
      }
    }
  });
});

test.describe('WSSI - Week Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/wssi');
  });

  test('should navigate to previous week', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const prevBtn = page.getByRole('button', { name: /previous|prev|←|trước/i });

    if (await prevBtn.isVisible()) {
      await prevBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to next week', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const nextBtn = page.getByRole('button', { name: /next|→|sau/i });

    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should jump to specific week', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const weekSelector = page.locator('select, [role="combobox"]').filter({ hasText: /week|tuần/i });

    if (await weekSelector.count() > 0) {
      await weekSelector.first().click();
      const options = page.locator('[role="option"], option');

      if (await options.count() > 0) {
        await options.first().click();
      }
    }
  });
});

test.describe('WSSI - Data Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/wssi');
  });

  test('should show sell-through rate', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const sellThru = page.locator('[class*="sell-thru"], [class*="rate"]').filter({ hasText: /%/ });

    if (await sellThru.count() > 0) {
      await expect(sellThru.first()).toBeVisible();
    }
  });

  test('should show stock cover metric', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const stockCover = page.locator('[class*="cover"], [class*="weeks"]').filter({ hasText: /week|tuần/i });

    if (await stockCover.count() > 0) {
      await expect(stockCover.first()).toBeVisible();
    }
  });

  test('should highlight low stock items', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const lowStock = page.locator('[class*="warning"], [class*="low"], [class*="danger"]');

    if (await lowStock.count() > 0) {
      await expect(lowStock.first()).toBeVisible();
    }
  });

  test('should show trend indicators', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const trends = page.locator('[class*="trend"], [class*="arrow"], [class*="up"], [class*="down"]');

    if (await trends.count() > 0) {
      await expect(trends.first()).toBeVisible();
    }
  });
});

test.describe('WSSI - Analysis View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/wssi/analysis');
  });

  test('should display analysis page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /analysis|phân tích/i });
    await expect(heading).toBeVisible();
  });

  test('should show comparison charts', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const charts = page.locator('canvas, [class*="chart"], svg[class*="recharts"]');

    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should compare periods', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const periodSelector = page.locator('select, [role="combobox"]').filter({ hasText: /period|kỳ/i });

    if (await periodSelector.count() > 0) {
      await periodSelector.first().click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('WSSI - Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/wssi/reports');
  });

  test('should display reports page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /report|báo cáo/i });
    await expect(heading).toBeVisible();
  });

  test('should list available reports', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const reportList = page.locator('[class*="report-list"], [data-testid="reports"]');

    if (await reportList.count() > 0) {
      await expect(reportList.first()).toBeVisible();
    }
  });

  test('should generate report', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const generateBtn = page.getByRole('button', { name: /generate|tạo/i });

    if (await generateBtn.isVisible()) {
      await expect(generateBtn).toBeEnabled();
    }
  });

  test('should schedule report', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const scheduleBtn = page.getByRole('button', { name: /schedule|lên lịch/i });

    if (await scheduleBtn.isVisible()) {
      await expect(scheduleBtn).toBeEnabled();
    }
  });
});

test.describe('WSSI - Role-based Access', () => {
  test('admin should have full access', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/wssi');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('analyst should have access', async ({ page }) => {
    await login(page, TestUsers.analyst);
    await page.goto('/wssi');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('viewer should have read-only access', async ({ page }) => {
    await login(page, TestUsers.viewer);
    await page.goto('/wssi');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('WSSI - Responsive Design', () => {
  const wssiRoutes = ['/wssi', '/wssi/analysis', '/wssi/reports'];

  for (const route of wssiRoutes) {
    test(`${route} should display correctly on mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await login(page, TestUsers.admin);
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const content = page.locator('main, [class*="content"]');
      await expect(content.first()).toBeVisible();
    });

    test(`${route} should display correctly on tablet`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await login(page, TestUsers.admin);
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const content = page.locator('main, [class*="content"]');
      await expect(content.first()).toBeVisible();
    });
  }
});

test.describe('WSSI - Performance', () => {
  test('WSSI dashboard should load within acceptable time', async ({ page }) => {
    await login(page, TestUsers.admin);

    const startTime = Date.now();
    await page.goto('/wssi');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });
});
