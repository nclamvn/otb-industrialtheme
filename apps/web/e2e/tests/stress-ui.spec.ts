/**
 * UI Stress Tests
 *
 * Tests the frontend under stress conditions:
 * - Rapid navigation
 * - Rapid clicking
 * - Large data rendering
 * - Memory leaks
 * - Concurrent operations
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('UI Stress Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should handle rapid page navigation (20 navigations)', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/budget',
      '/otb-plans',
      '/sku-proposal',
      '/analytics',
      '/settings',
    ];

    for (let round = 0; round < 3; round++) {
      for (const route of routes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
      }
    }

    // Page should still be responsive
    await expect(page.getByRole('main')).toBeVisible();

    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete' || document.readyState === 'interactive';
    });
    expect(isResponsive).toBeTruthy();
  });

  test('should handle rapid back/forward navigation', async ({ page }) => {
    // Build navigation history
    await page.goto('/dashboard');
    await page.goto('/budget');
    await page.goto('/otb-plans');
    await page.goto('/sku-proposal');

    // Rapidly go back and forward
    for (let i = 0; i < 10; i++) {
      await page.goBack();
      await page.goForward();
    }

    // Should still be responsive
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should handle rapid clicking without crash', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Find a clickable element
    const button = page.locator('button').first();

    if (await button.isVisible()) {
      // Rapid clicking (20 clicks)
      for (let i = 0; i < 20; i++) {
        await button.click({ force: true, timeout: 500 }).catch(() => {});
      }

      // Page should still function
      await expect(page.getByRole('main')).toBeVisible();
    }
  });

  test('should handle rapid form input', async ({ page }) => {
    await page.goto('/budget/new');

    const input = page.locator('input').first();

    if (await input.isVisible()) {
      // Rapidly type and clear
      for (let i = 0; i < 10; i++) {
        await input.fill(`Test value ${i}`);
        await input.clear();
      }

      // Form should still work
      await expect(input).toBeVisible();
    }
  });

  test('should handle large table scroll', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [data-testid="data-table"]').first();

    if (await table.isVisible()) {
      // Scroll rapidly
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollTo(0, 1000));
        await page.evaluate(() => window.scrollTo(0, 0));
      }

      // Table should still be visible
      await expect(table).toBeVisible();
    }
  });

  test('should not leak memory on repeated modal open/close', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    const initialMetrics = await page.metrics();

    // Find a button that opens a modal
    const createBtn = page.getByRole('button', { name: /new|create|add/i });

    if (await createBtn.isVisible()) {
      for (let i = 0; i < 10; i++) {
        await createBtn.click();
        await page.waitForTimeout(200);

        // Close modal (ESC or close button)
        const closeBtn = page.locator('[data-testid="close"], button[aria-label*="close"], .close-button');
        if (await closeBtn.first().isVisible()) {
          await closeBtn.first().click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(200);
      }

      const finalMetrics = await page.metrics();

      // Memory should not grow excessively (allow 100% growth)
      if (initialMetrics.JSHeapUsedSize && finalMetrics.JSHeapUsedSize) {
        expect(finalMetrics.JSHeapUsedSize).toBeLessThan(initialMetrics.JSHeapUsedSize * 2);
      }
    }
  });

  test('should handle concurrent filter changes', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    const filters = page.locator('select, [role="combobox"]');
    const filterCount = await filters.count();

    if (filterCount > 0) {
      // Rapidly change all filters
      for (let round = 0; round < 3; round++) {
        for (let i = 0; i < filterCount; i++) {
          const filter = filters.nth(i);
          if (await filter.isVisible()) {
            await filter.click({ timeout: 1000 }).catch(() => {});
            await page.keyboard.press('Escape');
          }
        }
      }

      // Page should still work
      await expect(page.getByRole('main')).toBeVisible();
    }
  });

  test('should handle rapid search input', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]');

    if (await searchInput.isVisible()) {
      const searchTerms = ['Nike', 'Adidas', 'Puma', 'test', 'budget', '2025'];

      // Rapidly change search terms
      for (const term of searchTerms) {
        await searchInput.fill(term);
        await page.waitForTimeout(100);
      }

      await searchInput.clear();

      // Page should still function
      await expect(page.getByRole('main')).toBeVisible();
    }
  });

  test('should handle viewport resizing', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1280, height: 720 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
      { width: 1280, height: 720 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(200);
    }

    // Page should still be responsive
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should handle multiple tab focus/blur cycles', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Simulate tab focus/blur
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForTimeout(100);
    }

    // Page should still work
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should handle network throttling gracefully', async ({ page }) => {
    // Simulate slow network
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50 * 1024, // 50 KB/s
      uploadThroughput: 50 * 1024,
      latency: 500,
    });

    await page.goto('/dashboard');

    // Should eventually load
    await expect(page.getByRole('main')).toBeVisible({ timeout: 30000 });

    // Reset network
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  });

  test('should recover from offline state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Go offline
    await page.context().setOffline(true);

    // Try to navigate
    await page.goto('/budget').catch(() => {});

    // Should show error or offline indicator
    await page.waitForTimeout(1000);

    // Go back online
    await page.context().setOffline(false);

    // Should recover
    await page.goto('/dashboard');
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Concurrent User Simulation', () => {
  test('should handle multiple concurrent operations', async ({ browser }) => {
    // Create multiple contexts simulating different users
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));

    // Login all users concurrently
    await Promise.all(pages.map((page) => login(page, TestUsers.admin)));

    // Perform concurrent operations
    await Promise.all([
      pages[0].goto('/dashboard'),
      pages[1].goto('/budget'),
      pages[2].goto('/otb-plans'),
    ]);

    // All pages should be responsive
    for (const page of pages) {
      await expect(page.getByRole('main')).toBeVisible();
    }

    // Cleanup
    await Promise.all(contexts.map((ctx) => ctx.close()));
  });
});

test.describe('Performance Under Load', () => {
  test('should maintain performance with repeated API calls', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget');

    const responseTimes: number[] = [];

    // Make repeated requests by refreshing data
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();

      await page.reload();
      await page.waitForLoadState('networkidle');

      responseTimes.push(Date.now() - startTime);
    }

    // Calculate average
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    // Average should stay consistent (not increase significantly)
    console.log(`Average reload time: ${avgTime}ms`);

    // Last reload should not be more than 2x slower than first
    expect(responseTimes[responseTimes.length - 1]).toBeLessThan(responseTimes[0] * 2);
  });

  test('should handle chart re-rendering', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const chart = page.locator('.recharts-wrapper, [data-testid="chart"], canvas');

    if (await chart.first().isVisible()) {
      // Change date range multiple times
      const dateRange = page.locator('[data-testid="date-range"]');

      if (await dateRange.isVisible()) {
        for (let i = 0; i < 5; i++) {
          await dateRange.click();
          await page.locator('[role="option"]').first().click().catch(() => {});
          await page.waitForTimeout(500);
        }

        // Charts should still be visible
        await expect(chart.first()).toBeVisible();
      }
    }
  });
});
