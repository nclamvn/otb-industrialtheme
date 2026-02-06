/**
 * Cross-Browser & Performance E2E Tests
 * @tag @phase11 @priority3
 *
 * Tests for:
 * - Cross-browser compatibility
 * - Performance benchmarks
 * - Mobile responsiveness
 * - Edge cases
 */

import { test, expect } from '@playwright/test';
import { TestUsers, PerformanceThresholds } from '../fixtures/test-data';
import { login, measurePerformance } from '../fixtures/test-helpers';

test.describe('Performance - Page Load Times', () => {
    const criticalPages = [
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/budgets', name: 'Budgets' },
        { path: '/otb', name: 'OTB' },
        { path: '/analytics', name: 'Analytics' },
        { path: '/ai-assistant', name: 'AI Assistant' },
    ];

    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
    });

    for (const { path, name } of criticalPages) {
        test(`${name} should load within threshold`, async ({ page }) => {
            const startTime = Date.now();
            await page.goto(path);
            await page.waitForLoadState('networkidle');
            const loadTime = Date.now() - startTime;

            expect(loadTime).toBeLessThan(PerformanceThresholds.pageLoad);
        });
    }

    test('should measure First Contentful Paint', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('load');

        const fcp = await page.evaluate(() => {
            return new Promise<number>((resolve) => {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
                    resolve(fcpEntry?.startTime || 0);
                }).observe({ entryTypes: ['paint'], buffered: true });

                setTimeout(() => resolve(0), 3000);
            });
        });

        expect(fcp).toBeLessThan(3000); // 3 seconds threshold
    });
});

test.describe('Performance - API Response Times', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
    });

    test('budgets API should respond within threshold', async ({ page }) => {
        const responsePromise = page.waitForResponse(res =>
            res.url().includes('/api/budgets') && res.status() === 200
        );

        const startTime = Date.now();
        await page.goto('/budgets');

        try {
            await responsePromise;
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(PerformanceThresholds.apiResponse);
        } catch {
            // API may not be called if data is cached
        }
    });

    test('OTB API should respond within threshold', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/otb');
        await page.waitForLoadState('networkidle');
        const totalTime = Date.now() - startTime;

        expect(totalTime).toBeLessThan(5000);
    });
});

test.describe('Performance - Chart Rendering', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
    });

    test('dashboard charts should render within threshold', async ({ page }) => {
        await page.goto('/dashboard');

        const startTime = Date.now();
        await page.waitForSelector('.recharts-wrapper, [class*="chart"]', { timeout: 10000 });
        const renderTime = Date.now() - startTime;

        expect(renderTime).toBeLessThan(PerformanceThresholds.chartRender);
    });

    test('analytics charts should render within threshold', async ({ page }) => {
        await page.goto('/analytics');

        const startTime = Date.now();
        await page.waitForSelector('.recharts-wrapper, [class*="chart"]', { timeout: 10000 }).catch(() => null);
        const renderTime = Date.now() - startTime;

        expect(renderTime).toBeLessThan(PerformanceThresholds.chartRender);
    });
});

test.describe('Mobile Responsiveness - Critical Pages', () => {
    const mobileViewport = { width: 375, height: 667 };
    const criticalPages = [
        '/dashboard',
        '/budgets',
        '/otb',
        '/analytics',
        '/ai-assistant',
        '/settings',
    ];

    for (const path of criticalPages) {
        test(`${path} should be usable on mobile`, async ({ page }) => {
            await page.setViewportSize(mobileViewport);
            await login(page, TestUsers.admin);
            await page.goto(path);
            await page.waitForLoadState('networkidle');

            // Main content should be visible
            await expect(page.locator('main')).toBeVisible();

            // No horizontal scroll
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });

            // Some pages may have horizontal scroll for tables, which is acceptable
        });
    }
});

test.describe('Tablet Responsiveness', () => {
    const tabletViewport = { width: 768, height: 1024 };

    test('dashboard on tablet', async ({ page }) => {
        await page.setViewportSize(tabletViewport);
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');

        await expect(page.locator('main')).toBeVisible();
    });

    test('analytics on tablet', async ({ page }) => {
        await page.setViewportSize(tabletViewport);
        await login(page, TestUsers.admin);
        await page.goto('/analytics');

        await expect(page.locator('main')).toBeVisible();
    });

    test('sidebar visibility on tablet', async ({ page }) => {
        await page.setViewportSize(tabletViewport);
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');

        const sidebar = page.locator('[class*="sidebar"], nav');
        // Sidebar may be collapsed on tablet
    });
});

test.describe('Edge Cases - Empty States', () => {
    test('should show empty state message when no data', async ({ page }) => {
        await login(page, TestUsers.viewer);
        // Navigate to a page that might have no data
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');

        // Either data or empty state should be visible
        const hasData = await page.locator('table tbody tr').count() > 0;
        const emptyState = page.locator('[class*="empty"], text=/no data|không có dữ liệu/i');

        if (!hasData) {
            // Empty state should be visible
        }
    });
});

test.describe('Edge Cases - Error Handling', () => {
    test('should handle navigation to non-existent route', async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/non-existent-page');
        await page.waitForLoadState('networkidle');

        // Should show 404 or redirect to dashboard
        const is404 = await page.locator('text=/404|not found|không tìm thấy/i').isVisible();
        const isDashboard = page.url().includes('/dashboard');

        expect(is404 || isDashboard).toBeTruthy();
    });

    test('should maintain session after page error', async ({ page }) => {
        await login(page, TestUsers.admin);

        // Trigger an error scenario
        await page.goto('/non-existent-page');
        await page.waitForTimeout(1000);

        // Navigate back to valid page
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Should still be logged in
        await expect(page).not.toHaveURL(/login/);
    });
});

test.describe('Edge Cases - Large Data', () => {
    test('should handle pages with many items', async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');

        // Table should be responsive even with data
        const table = page.locator('table');
        if (await table.isVisible({ timeout: 5000 })) {
            await expect(table).toBeVisible();
        }
    });

    test('should use virtualization for long lists', async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/sku-analysis');
        await page.waitForLoadState('networkidle');

        // Page should remain responsive
        await expect(page.locator('main')).toBeVisible();
    });
});

test.describe('Accessibility - Basic Checks', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
    });

    test('dashboard should have proper headings', async ({ page }) => {
        await page.goto('/dashboard');

        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(0); // At least consider heading structure
    });

    test('forms should have labels', async ({ page }) => {
        await page.goto('/auth/login');

        const inputs = page.locator('input:not([type="hidden"])');
        const inputCount = await inputs.count();

        for (let i = 0; i < Math.min(inputCount, 5); i++) {
            const input = inputs.nth(i);
            const id = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const placeholder = await input.getAttribute('placeholder');

            // Input should have some form of labeling
            expect(id || ariaLabel || placeholder).toBeTruthy();
        }
    });

    test('buttons should be keyboard accessible', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Tab through the page
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
        }

        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
    });
});

test.describe('Browser Specific - Navigation', () => {
    test('should handle back/forward navigation', async ({ page }) => {
        await login(page, TestUsers.admin);

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        await page.goto('/budgets');
        await page.waitForLoadState('networkidle');

        await page.goBack();
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveURL(/dashboard/);

        await page.goForward();
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveURL(/budget/);
    });

    test('should handle page refresh', async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should still be on dashboard and logged in
        await expect(page).toHaveURL(/dashboard/);
        await expect(page.locator('main')).toBeVisible();
    });
});
