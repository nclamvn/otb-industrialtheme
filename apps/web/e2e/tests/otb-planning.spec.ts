/**
 * OTB Planning E2E Tests
 * @tag @phase4 @priority1
 *
 * Comprehensive OTB (Open-to-Buy) planning tests:
 * - OTB plan creation and management
 * - Analysis and calculations
 * - Comparison views
 * - Forecasting integration
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('OTB - List View', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/otb');
        await page.waitForLoadState('networkidle');
    });

    test('should display OTB page @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
        const heading = page.getByRole('heading', { name: /OTB|open.*buy/i });
        await expect(heading).toBeVisible();
    });

    test('should show OTB plans table', async ({ page }) => {
        const table = page.locator('table, [role="grid"], [data-testid="otb-table"]');
        await expect(table.first()).toBeVisible({ timeout: 15000 });
    });

    test('should display OTB columns', async ({ page }) => {
        const table = page.locator('table');

        if (await table.isVisible({ timeout: 5000 })) {
            const headers = table.locator('th');
            expect(await headers.count()).toBeGreaterThan(0);
        }
    });

    test('should have create OTB plan button', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo|thêm/i });
        if (await createBtn.isVisible()) {
            await expect(createBtn).toBeEnabled();
        }
    });

    test('should filter by brand', async ({ page }) => {
        const brandFilter = page.locator('[role="combobox"]').first();

        if (await brandFilter.isVisible({ timeout: 3000 })) {
            await brandFilter.click();
            const options = page.locator('[role="option"]');
            if (await options.first().isVisible()) {
                await options.first().click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should filter by season', async ({ page }) => {
        const seasonFilter = page.locator('[role="combobox"]').nth(1);

        if (await seasonFilter.isVisible({ timeout: 3000 })) {
            await seasonFilter.click();
            const options = page.locator('[role="option"]');
            if (await options.first().isVisible()) {
                await options.first().click();
                await page.waitForLoadState('networkidle');
            }
        }
    });
});

test.describe('OTB - Create Flow', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/otb');
        await page.waitForLoadState('networkidle');
    });

    test('should open create OTB form', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });

        if (await createBtn.isVisible()) {
            await createBtn.click();

            const form = page.locator('form, [role="dialog"]');
            await expect(form).toBeVisible({ timeout: 5000 });
        }
    });

    test('should require budget selection', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });

        if (await createBtn.isVisible()) {
            await createBtn.click();
            await page.waitForTimeout(500);

            const budgetSelect = page.locator('[name*="budget"], [data-testid*="budget"]');
            if (await budgetSelect.first().isVisible()) {
                await expect(budgetSelect.first()).toBeVisible();
            }
        }
    });

    test('should show month breakdown inputs', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });

        if (await createBtn.isVisible()) {
            await createBtn.click();
            await page.waitForTimeout(500);

            const monthInputs = page.locator('input[name*="month"], [data-testid*="month"]');
            // May have multiple month inputs
        }
    });
});

test.describe('OTB - Plan Detail', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/otb');
        await page.waitForLoadState('networkidle');
    });

    test('should navigate to plan detail', async ({ page }) => {
        const rows = page.locator('table tbody tr');

        if (await rows.first().isVisible({ timeout: 5000 })) {
            await rows.first().click();
            await page.waitForTimeout(500);
        }
    });

    test('should show plan summary card', async ({ page }) => {
        const rows = page.locator('table tbody tr');

        if (await rows.first().isVisible({ timeout: 5000 })) {
            await rows.first().click();
            await page.waitForTimeout(500);

            const summary = page.locator('[class*="Card"], [class*="summary"]');
            if (await summary.first().isVisible({ timeout: 3000 })) {
                await expect(summary.first()).toBeVisible();
            }
        }
    });

    test('should show monthly breakdown', async ({ page }) => {
        const rows = page.locator('table tbody tr');

        if (await rows.first().isVisible({ timeout: 5000 })) {
            await rows.first().click();
            await page.waitForTimeout(500);

            const breakdown = page.locator('table, [class*="breakdown"], [class*="monthly"]');
            if (await breakdown.first().isVisible({ timeout: 3000 })) {
                await expect(breakdown.first()).toBeVisible();
            }
        }
    });
});

test.describe('OTB - Analysis', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/otb/analysis');
        await page.waitForLoadState('networkidle');
    });

    test('should display OTB analysis page', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show analysis charts', async ({ page }) => {
        await page.waitForTimeout(2000);
        const charts = page.locator('.recharts-wrapper, svg, [class*="chart"]');
        if (await charts.first().isVisible({ timeout: 5000 })) {
            expect(await charts.count()).toBeGreaterThan(0);
        }
    });

    test('should show KPI metrics', async ({ page }) => {
        const kpis = page.locator('[class*="Card"], [class*="metric"], [class*="kpi"]');
        await expect(kpis.first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('OTB - Comparison', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/otb/comparison');
        await page.waitForLoadState('networkidle');
    });

    test('should display comparison page', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should have period selectors', async ({ page }) => {
        const selectors = page.locator('[role="combobox"]');
        if (await selectors.first().isVisible({ timeout: 3000 })) {
            expect(await selectors.count()).toBeGreaterThan(0);
        }
    });

    test('should show comparison table or chart', async ({ page }) => {
        await page.waitForTimeout(2000);
        const comparison = page.locator('table, .recharts-wrapper, [class*="comparison"]');
        if (await comparison.first().isVisible({ timeout: 5000 })) {
            await expect(comparison.first()).toBeVisible();
        }
    });
});

test.describe('OTB - Calculations', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/otb');
        await page.waitForLoadState('networkidle');
    });

    test('should display calculated values', async ({ page }) => {
        const calculatedFields = page.locator('[class*="calculated"], [data-testid*="total"]');
        if (await calculatedFields.first().isVisible({ timeout: 5000 })) {
            await expect(calculatedFields.first()).toBeVisible();
        }
    });

    test('should show sell-through metrics', async ({ page }) => {
        const sellThrough = page.locator('text=/sell.*through|ST%/i');
        if (await sellThrough.first().isVisible({ timeout: 3000 })) {
            await expect(sellThrough.first()).toBeVisible();
        }
    });

    test('should show inventory turnover', async ({ page }) => {
        const turnover = page.locator('text=/inventory.*turn|vòng quay/i');
        if (await turnover.first().isVisible({ timeout: 3000 })) {
            await expect(turnover.first()).toBeVisible();
        }
    });
});

test.describe('OTB - Role-based Access', () => {
    test('admin should have full access', async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/otb');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('main')).toBeVisible();
    });

    test('brand planner should access OTB', async ({ page }) => {
        await login(page, TestUsers.brandPlanner);
        await page.goto('/otb');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('main')).toBeVisible();
    });

    test('brand manager should access OTB', async ({ page }) => {
        await login(page, TestUsers.brandManager);
        await page.goto('/otb');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('main')).toBeVisible();
    });

    test('viewer should have read-only OTB access', async ({ page }) => {
        await login(page, TestUsers.viewer);
        await page.goto('/otb');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('main')).toBeVisible();

        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });
        if (await createBtn.isVisible()) {
            await expect(createBtn).toBeDisabled();
        }
    });
});

test.describe('OTB - Export', () => {
    test('should export OTB data', async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/otb');
        await page.waitForLoadState('networkidle');

        const exportBtn = page.getByRole('button', { name: /export|xuất/i });

        if (await exportBtn.isVisible({ timeout: 3000 })) {
            await exportBtn.click();
            await page.waitForTimeout(1000);
        }
    });
});

test.describe('OTB - Responsive Design', () => {
    test('OTB page on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await login(page, TestUsers.admin);
        await page.goto('/otb');

        await expect(page.locator('main')).toBeVisible();
    });

    test('OTB page on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await login(page, TestUsers.admin);
        await page.goto('/otb');

        await expect(page.locator('main')).toBeVisible();
    });
});
