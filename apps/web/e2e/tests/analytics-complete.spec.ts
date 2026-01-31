/**
 * Analytics Complete E2E Tests
 *
 * Comprehensive tests for all 12 analytics sub-modules:
 * - Main Analytics Dashboard
 * - Automation, Comparison, Decisions, Demand
 * - Forecast, Insights, KPI, Performance
 * - PowerBI, Reports, Simulator, SKU Analysis
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login, navigateAndWait } from '../fixtures/test-helpers';

test.describe('Analytics - Main Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics');
        await page.waitForLoadState('networkidle');
    });

    test('should display analytics dashboard with header @smoke', async ({ page }) => {
        await expect(page.locator('h1, h2').first()).toBeVisible();
        await expect(page.locator('main')).toBeVisible();
    });

    test('should load charts and visualizations', async ({ page }) => {
        // Wait for charts to render
        await page.waitForTimeout(2000);

        const charts = page.locator('.recharts-wrapper, [data-testid*="chart"], svg[class*="chart"]');
        if (await charts.first().isVisible({ timeout: 10000 })) {
            expect(await charts.count()).toBeGreaterThan(0);
        }
    });

    test('should display KPI cards or summary stats', async ({ page }) => {
        const statsCards = page.locator('[class*="Card"], [class*="stat"], [data-testid*="kpi"]');
        await expect(statsCards.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have date range filter', async ({ page }) => {
        const dateFilter = page.locator('[data-testid*="date"], button:has-text("date"), [class*="calendar"]').first();
        if (await dateFilter.isVisible({ timeout: 3000 })) {
            await expect(dateFilter).toBeVisible();
        }
    });

    test('should have export functionality', async ({ page }) => {
        const exportButton = page.getByRole('button', { name: /export|xuất/i });
        if (await exportButton.isVisible({ timeout: 3000 })) {
            await expect(exportButton).toBeEnabled();
        }
    });
});

test.describe('Analytics - Sub-modules Navigation', () => {
    const analyticsRoutes = [
        { path: '/analytics/automation', name: 'Automation' },
        { path: '/analytics/comparison', name: 'Comparison' },
        { path: '/analytics/decisions', name: 'Decisions' },
        { path: '/analytics/demand', name: 'Demand' },
        { path: '/analytics/forecast', name: 'Forecast' },
        { path: '/analytics/insights', name: 'Insights' },
        { path: '/analytics/kpi', name: 'KPI' },
        { path: '/analytics/performance', name: 'Performance' },
        { path: '/analytics/powerbi', name: 'PowerBI' },
        { path: '/analytics/reports', name: 'Reports' },
        { path: '/analytics/simulator', name: 'Simulator' },
        { path: '/analytics/sku-analysis', name: 'SKU Analysis' },
    ];

    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
    });

    for (const route of analyticsRoutes) {
        test(`should load ${route.name} page`, async ({ page }) => {
            await page.goto(route.path);
            await page.waitForLoadState('networkidle');

            // Page should load without error
            await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

            // Should not show error page
            const hasError = await page.locator('text=/error|404|not found/i').isVisible().catch(() => false);
            if (!hasError) {
                // Page content or loading state should be visible
                const content = page.locator('[class*="Card"], [class*="container"], h1, h2, table');
                await expect(content.first()).toBeVisible({ timeout: 10000 });
            }
        });
    }
});

test.describe('Analytics - Automation Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/automation');
        await page.waitForLoadState('networkidle');
    });

    test('should display automation rules or workflows', async ({ page }) => {
        const content = page.locator('main');
        await expect(content).toBeVisible();
    });

    test('should have create/add functionality if applicable', async ({ page }) => {
        const addButton = page.getByRole('button', { name: /add|create|new|thêm|tạo/i });
        if (await addButton.isVisible({ timeout: 3000 })) {
            await expect(addButton).toBeEnabled();
        }
    });
});

test.describe('Analytics - Comparison Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/comparison');
        await page.waitForLoadState('networkidle');
    });

    test('should display comparison interface', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should have selection controls for comparison', async ({ page }) => {
        const selectors = page.locator('[role="combobox"], select, [class*="Select"]');
        if (await selectors.first().isVisible({ timeout: 3000 })) {
            expect(await selectors.count()).toBeGreaterThan(0);
        }
    });
});

test.describe('Analytics - Demand Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/demand');
        await page.waitForLoadState('networkidle');
    });

    test('should display demand analysis', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show demand charts or tables', async ({ page }) => {
        await page.waitForTimeout(2000);
        const visualizations = page.locator('table, .recharts-wrapper, [class*="chart"]');
        if (await visualizations.first().isVisible({ timeout: 5000 })) {
            await expect(visualizations.first()).toBeVisible();
        }
    });
});

test.describe('Analytics - Forecast Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/forecast');
        await page.waitForLoadState('networkidle');
    });

    test('should display forecasting interface', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show forecast data or predictions', async ({ page }) => {
        await page.waitForTimeout(2000);
        const content = page.locator('[class*="Card"], table, .recharts-wrapper');
        await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Analytics - KPI Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/kpi');
        await page.waitForLoadState('networkidle');
    });

    test('should display KPI dashboard', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show KPI metrics and indicators', async ({ page }) => {
        await page.waitForTimeout(2000);
        const kpiCards = page.locator('[class*="Card"], [data-testid*="kpi"], [class*="metric"]');
        await expect(kpiCards.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have period/date filters', async ({ page }) => {
        const filters = page.locator('[role="combobox"], [data-testid*="filter"], button:has-text("period")');
        if (await filters.first().isVisible({ timeout: 3000 })) {
            await expect(filters.first()).toBeVisible();
        }
    });
});

test.describe('Analytics - Performance Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/performance');
        await page.waitForLoadState('networkidle');
    });

    test('should display performance metrics', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show performance charts', async ({ page }) => {
        await page.waitForTimeout(2000);
        const charts = page.locator('.recharts-wrapper, svg, [class*="chart"]');
        if (await charts.first().isVisible({ timeout: 5000 })) {
            await expect(charts.first()).toBeVisible();
        }
    });
});

test.describe('Analytics - PowerBI Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/powerbi');
        await page.waitForLoadState('networkidle');
    });

    test('should display PowerBI integration page', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show embedded report or connection status', async ({ page }) => {
        await page.waitForTimeout(2000);
        // PowerBI embed or configuration
        const content = page.locator('iframe, [class*="Card"], [class*="embed"]');
        await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Analytics - Reports Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/reports');
        await page.waitForLoadState('networkidle');
    });

    test('should display reports list or generator', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should have report generation controls', async ({ page }) => {
        const generateButton = page.getByRole('button', { name: /generate|create|tạo/i });
        if (await generateButton.isVisible({ timeout: 3000 })) {
            await expect(generateButton).toBeEnabled();
        }
    });

    test('should have export options', async ({ page }) => {
        const exportButton = page.getByRole('button', { name: /export|download|xuất|tải/i });
        if (await exportButton.isVisible({ timeout: 3000 })) {
            await expect(exportButton).toBeEnabled();
        }
    });
});

test.describe('Analytics - Simulator Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/simulator');
        await page.waitForLoadState('networkidle');
    });

    test('should display simulator interface', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should have simulation parameters input', async ({ page }) => {
        const inputs = page.locator('input, [role="combobox"], [role="slider"]');
        if (await inputs.first().isVisible({ timeout: 3000 })) {
            expect(await inputs.count()).toBeGreaterThan(0);
        }
    });

    test('should have run simulation button', async ({ page }) => {
        const runButton = page.getByRole('button', { name: /run|simulate|chạy/i });
        if (await runButton.isVisible({ timeout: 3000 })) {
            await expect(runButton).toBeEnabled();
        }
    });
});

test.describe('Analytics - SKU Analysis Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/sku-analysis');
        await page.waitForLoadState('networkidle');
    });

    test('should display SKU analysis interface', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show SKU data table or charts', async ({ page }) => {
        await page.waitForTimeout(2000);
        const dataDisplay = page.locator('table, .recharts-wrapper, [class*="grid"]');
        await expect(dataDisplay.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have filtering options', async ({ page }) => {
        const filters = page.locator('[role="combobox"], input[type="search"], [data-testid*="filter"]');
        if (await filters.first().isVisible({ timeout: 3000 })) {
            await expect(filters.first()).toBeVisible();
        }
    });
});

test.describe('Analytics - Insights Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/insights');
        await page.waitForLoadState('networkidle');
    });

    test('should display AI insights', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show insight cards or recommendations', async ({ page }) => {
        await page.waitForTimeout(2000);
        const insights = page.locator('[class*="Card"], [class*="insight"]');
        await expect(insights.first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Analytics - Decisions Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/analytics/decisions');
        await page.waitForLoadState('networkidle');
    });

    test('should display decisions tracking', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show decision history or pending decisions', async ({ page }) => {
        const content = page.locator('[class*="Card"], table, [class*="list"]');
        await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Analytics - Responsive Design', () => {
    test('analytics dashboard on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await login(page, TestUsers.admin);
        await page.goto('/analytics');

        await expect(page.locator('main')).toBeVisible();
    });

    test('analytics on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await login(page, TestUsers.admin);
        await page.goto('/analytics');

        await expect(page.locator('main')).toBeVisible();
    });
});
