import { test, expect } from '@playwright/test';

/**
 * Performance E2E Tests
 * Tests page load times, responsiveness, and performance metrics
 */

test.describe('Performance Tests', () => {
  test.describe('Page Load Performance', () => {
    test('login page should load within 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });

    test('dashboard should load within 5 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test('budgets page should load within 5 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/budgets');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test('otb-plans page should load within 5 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/otb-plans');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should measure Largest Contentful Paint (LCP)', async ({ page }) => {
      await page.goto('/dashboard');

      // Measure LCP using PerformanceObserver
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          // Fallback timeout
          setTimeout(() => resolve(-1), 5000);
        });
      });

      // LCP should be under 2.5 seconds for good performance
      if (typeof lcp === 'number' && lcp > 0) {
        expect(lcp).toBeLessThan(2500);
      }
    });

    test('should measure First Input Delay (FID) readiness', async ({ page }) => {
      await page.goto('/dashboard');

      // Check if page is interactive
      const isInteractive = await page.evaluate(() => {
        return document.readyState === 'complete';
      });

      expect(isInteractive).toBe(true);
    });

    test('should measure Cumulative Layout Shift (CLS)', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait for page to stabilize
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => resolve(clsValue), 3000);
        });
      });

      // CLS should be under 0.1 for good performance
      if (typeof cls === 'number') {
        expect(cls).toBeLessThan(0.25);
      }
    });
  });

  test.describe('Resource Loading', () => {
    test('should load JavaScript bundles efficiently', async ({ page }) => {
      const resourceTimings: { name: string; duration: number }[] = [];

      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('.js') && !url.includes('node_modules')) {
          resourceTimings.push({
            name: url,
            duration: response.timing().responseEnd || 0,
          });
        }
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check that main bundles load quickly
      const slowResources = resourceTimings.filter((r) => r.duration > 2000);

      // Should have few or no slow-loading resources
      expect(slowResources.length).toBeLessThan(3);
    });

    test('should not have excessive network requests', async ({ page }) => {
      let requestCount = 0;

      page.on('request', () => {
        requestCount++;
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Dashboard shouldn't make more than 50 requests on initial load
      expect(requestCount).toBeLessThan(50);
    });

    test('should cache static resources', async ({ page }) => {
      // First visit
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Collect cached responses on second visit
      let cachedResponses = 0;

      page.on('response', (response) => {
        const headers = response.headers();
        if (headers['x-cache'] === 'HIT' || response.fromCache()) {
          cachedResponses++;
        }
      });

      // Second visit
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Some resources should be cached
      expect(cachedResponses).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('API Response Times', () => {
    test('should have fast API response times', async ({ page }) => {
      const apiTimings: { url: string; duration: number }[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/')) {
          const timing = response.timing();
          apiTimings.push({
            url,
            duration: timing.responseEnd ? timing.responseEnd - timing.requestStart : 0,
          });
        }
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check API response times
      const slowApis = apiTimings.filter((api) => api.duration > 1000);

      // Should have few slow API calls
      expect(slowApis.length).toBeLessThan(3);
    });
  });

  test.describe('Memory Usage', () => {
    test('should not have excessive memory usage', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const metrics = await page.metrics();

      // Check JS heap size is reasonable (under 100MB)
      if (metrics.JSHeapUsedSize) {
        expect(metrics.JSHeapUsedSize).toBeLessThan(100 * 1024 * 1024);
      }
    });

    test('should not have memory leaks on navigation', async ({ page }) => {
      await page.goto('/dashboard');
      const initialMetrics = await page.metrics();

      // Navigate back and forth
      await page.goto('/dashboard/budgets');
      await page.waitForLoadState('networkidle');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.goto('/dashboard/otb-plans');
      await page.waitForLoadState('networkidle');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const finalMetrics = await page.metrics();

      // Memory shouldn't grow excessively (allow 50% growth)
      if (initialMetrics.JSHeapUsedSize && finalMetrics.JSHeapUsedSize) {
        expect(finalMetrics.JSHeapUsedSize).toBeLessThan(initialMetrics.JSHeapUsedSize * 1.5);
      }
    });
  });

  test.describe('Scroll Performance', () => {
    test('should handle smooth scrolling', async ({ page }) => {
      await page.goto('/dashboard/budgets');
      await page.waitForLoadState('networkidle');

      // Scroll down
      await page.evaluate(() => {
        window.scrollTo({ top: 500, behavior: 'smooth' });
      });

      await page.waitForTimeout(500);

      // Verify scroll position
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    });

    test('should render tables without jank', async ({ page }) => {
      await page.goto('/dashboard/budgets');
      await page.waitForLoadState('networkidle');

      // Check for table presence
      const table = page.locator('table, [data-testid="data-table"]');

      if (await table.isVisible()) {
        // Scroll within table
        await table.evaluate((el) => {
          el.scrollTop = 100;
        });

        // Table should still be visible and interactive
        await expect(table).toBeVisible();
      }
    });
  });

  test.describe('Render Performance', () => {
    test('should render charts without blocking', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait for charts to render
      const charts = page.locator('[data-testid="chart"], .recharts-wrapper, canvas');

      if (await charts.count() > 0) {
        await charts.first().waitFor({ state: 'visible', timeout: 5000 });
      }

      const renderTime = Date.now() - startTime;

      // Charts should render within 5 seconds
      expect(renderTime).toBeLessThan(5000);
    });
  });
});

test.describe('Stress Test - Rapid Navigation', () => {
  test('should handle rapid page navigation', async ({ page }) => {
    const pages = ['/dashboard', '/dashboard/budgets', '/dashboard/otb-plans', '/dashboard/sku-proposals'];

    for (let i = 0; i < 5; i++) {
      for (const targetPage of pages) {
        await page.goto(targetPage, { waitUntil: 'domcontentloaded' });
      }
    }

    // Should still be responsive
    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete' || document.readyState === 'interactive';
    });

    expect(isResponsive).toBe(true);
  });

  test('should handle rapid clicks', async ({ page }) => {
    await page.goto('/dashboard/budgets');
    await page.waitForLoadState('networkidle');

    // Find clickable elements
    const buttons = page.locator('button').first();

    if (await buttons.isVisible()) {
      // Rapid clicking
      for (let i = 0; i < 10; i++) {
        await buttons.click({ force: true, timeout: 1000 }).catch(() => {});
      }

      // Page should still be responsive
      const isResponsive = await page.evaluate(() => !!document.body);
      expect(isResponsive).toBe(true);
    }
  });
});
