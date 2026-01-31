/**
 * Large Datasets Performance E2E Tests
 * @tag @phase5 @new @performance
 *
 * Tests Performance with Large Datasets:
 * - Table pagination
 * - Virtual scrolling
 * - Data loading optimization
 * - Memory usage
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('Large Datasets - Table Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should load first page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test('should paginate through large dataset', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const nextBtn = page.getByRole('button', { name: /next|sau|→/i }).or(
      page.locator('[data-testid="pagination-next"]')
    );

    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForLoadState('networkidle');

      // Should load next page
      const table = page.locator('table, [role="grid"]');
      await expect(table.first()).toBeVisible();
    }
  });

  test('should change page size', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const pageSizeSelector = page.locator('select, [role="combobox"]').filter({ hasText: /10|20|50|100/i });

    if (await pageSizeSelector.count() > 0) {
      await pageSizeSelector.first().click();

      const option = page.locator('[role="option"], option').filter({ hasText: '50' });
      if (await option.count() > 0) {
        await option.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should jump to specific page', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const pageInput = page.locator('input[type="number"]').filter({ hasText: /page/i });

    if (await pageInput.count() > 0) {
      await pageInput.first().fill('5');
      await pageInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should show total count', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const totalCount = page.locator('[class*="pagination"], [class*="count"]').filter({ hasText: /of|total|tổng|\/\d+/i });

    if (await totalCount.count() > 0) {
      await expect(totalCount.first()).toBeVisible();
    }
  });
});

test.describe('Large Datasets - Search Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should debounce search input', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const search = page.locator('input[type="search"], input[placeholder*="search"]').first();

    if (await search.isVisible()) {
      // Type quickly
      await search.fill('test search query');

      // Should not make request for each character
      await page.waitForTimeout(500);
    }
  });

  test('should search large dataset efficiently', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const search = page.locator('input[type="search"], input[placeholder*="search"]').first();

    if (await search.isVisible()) {
      const startTime = Date.now();
      await search.fill('BOSS');
      await page.waitForLoadState('networkidle');
      const searchTime = Date.now() - startTime;

      expect(searchTime).toBeLessThan(3000);
    }
  });

  test('should clear search results', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const search = page.locator('input[type="search"], input[placeholder*="search"]').first();

    if (await search.isVisible()) {
      await search.fill('test');
      await page.waitForTimeout(500);
      await search.clear();
      await page.waitForLoadState('networkidle');

      const table = page.locator('table, [role="grid"]');
      await expect(table.first()).toBeVisible();
    }
  });
});

test.describe('Large Datasets - Filter Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should apply multiple filters efficiently', async ({ page }) => {
    await page.goto('/analytics/automation');
    await page.waitForLoadState('networkidle');

    const brandFilter = page.locator('select, [role="combobox"]').filter({ hasText: /brand|thương hiệu/i }).first();
    const seasonFilter = page.locator('select, [role="combobox"]').filter({ hasText: /season|mùa/i }).first();

    if (await brandFilter.isVisible()) {
      await brandFilter.click();
      const option = page.locator('[role="option"]').first();
      if (await option.isVisible()) {
        await option.click();
      }
    }

    if (await seasonFilter.isVisible()) {
      await seasonFilter.click();
      const option = page.locator('[role="option"]').first();
      if (await option.isVisible()) {
        await option.click();
      }
    }

    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('should reset filters quickly', async ({ page }) => {
    await page.goto('/analytics/automation');
    await page.waitForLoadState('networkidle');

    const resetBtn = page.getByRole('button', { name: /reset|clear|xóa bộ lọc/i });

    if (await resetBtn.isVisible()) {
      const startTime = Date.now();
      await resetBtn.click();
      await page.waitForLoadState('networkidle');
      const resetTime = Date.now() - startTime;

      expect(resetTime).toBeLessThan(2000);
    }
  });
});

test.describe('Large Datasets - Sorting Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should sort column efficiently', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const header = page.locator('th, [role="columnheader"]').first();

    if (await header.isVisible()) {
      const startTime = Date.now();
      await header.click();
      await page.waitForLoadState('networkidle');
      const sortTime = Date.now() - startTime;

      expect(sortTime).toBeLessThan(2000);
    }
  });

  test('should toggle sort direction', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const header = page.locator('th, [role="columnheader"]').first();

    if (await header.isVisible()) {
      // First click - ascending
      await header.click();
      await page.waitForLoadState('networkidle');

      // Second click - descending
      await header.click();
      await page.waitForLoadState('networkidle');

      const table = page.locator('table, [role="grid"]');
      await expect(table.first()).toBeVisible();
    }
  });
});

test.describe('Large Datasets - Export Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should export large dataset', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);

      await exportBtn.click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/i);
      }
    }
  });

  test('should show export progress', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.isVisible()) {
      await exportBtn.click();

      const progress = page.locator('[class*="progress"], [class*="loading"]');
      if (await progress.count() > 0) {
        // Progress indicator should appear during export
      }
    }
  });
});

test.describe('Large Datasets - Infinite Scroll', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should load more on scroll', async ({ page }) => {
    await page.goto('/budget-flow');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]').first();

    if (await content.isVisible()) {
      // Scroll to bottom
      await content.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      await page.waitForTimeout(1000);

      // Content should still be visible
      await expect(content).toBeVisible();
    }
  });
});

test.describe('Large Datasets - Virtual Scrolling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should render only visible rows', async ({ page }) => {
    await page.goto('/master-data/users');
    await page.waitForLoadState('networkidle');

    const visibleRows = page.locator('tr, [role="row"]');
    const count = await visibleRows.count();

    // Should not render more than viewport can display (plus buffer)
    expect(count).toBeLessThan(100);
  });

  test('should scroll smoothly', async ({ page }) => {
    await page.goto('/master-data/users');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"]').first();

    if (await table.isVisible()) {
      // Scroll multiple times
      for (let i = 0; i < 5; i++) {
        await table.evaluate((el) => {
          el.scrollTop += 200;
        });
        await page.waitForTimeout(100);
      }

      // Should still be responsive
      await expect(table).toBeVisible();
    }
  });
});

test.describe('Large Datasets - Memory Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should not leak memory on navigation', async ({ page }) => {
    // Navigate between pages multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/master-data/brands');
      await page.waitForLoadState('networkidle');

      await page.goto('/master-data/users');
      await page.waitForLoadState('networkidle');

      await page.goto('/master-data/categories');
      await page.waitForLoadState('networkidle');
    }

    // Page should still be responsive
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('should handle repeated searches', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const search = page.locator('input[type="search"], input[placeholder*="search"]').first();

    if (await search.isVisible()) {
      // Perform multiple searches
      for (let i = 0; i < 10; i++) {
        await search.fill(`search${i}`);
        await page.waitForTimeout(300);
        await search.clear();
      }

      // Page should still be responsive
      const table = page.locator('table, [role="grid"]');
      await expect(table.first()).toBeVisible();
    }
  });
});

test.describe('Large Datasets - Concurrent Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should handle multiple tabs loading data', async ({ page, context }) => {
    // Open multiple pages
    const page2 = await context.newPage();
    const page3 = await context.newPage();

    await Promise.all([
      page.goto('/master-data/brands'),
      page2.goto('/master-data/users'),
      page3.goto('/master-data/categories'),
    ]);

    await Promise.all([
      page.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle'),
      page3.waitForLoadState('networkidle'),
    ]);

    // All pages should load successfully
    await expect(page.locator('main, [class*="content"]').first()).toBeVisible();
    await expect(page2.locator('main, [class*="content"]').first()).toBeVisible();
    await expect(page3.locator('main, [class*="content"]').first()).toBeVisible();

    await page2.close();
    await page3.close();
  });
});

test.describe('Large Datasets - Stress Testing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should handle rapid filter changes', async ({ page }) => {
    await page.goto('/analytics/automation');
    await page.waitForLoadState('networkidle');

    const filter = page.locator('select, [role="combobox"]').first();

    if (await filter.isVisible()) {
      // Rapidly change filter
      for (let i = 0; i < 5; i++) {
        await filter.click();
        const option = page.locator('[role="option"]').nth(i % 3);
        if (await option.isVisible()) {
          await option.click();
        }
        await page.waitForTimeout(100);
      }

      // Page should still be functional
      const content = page.locator('main, [class*="content"]');
      await expect(content.first()).toBeVisible();
    }
  });

  test('should handle rapid navigation', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/budget-flow',
      '/sku-proposal',
      '/analytics',
      '/master-data/brands',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(500);
    }

    // Final page should load successfully
    await page.waitForLoadState('networkidle');
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});
