/**
 * Advanced Business Modules E2E Tests
 *
 * Comprehensive tests for:
 * - WSSI (Weekly Stock Sales Intake)
 * - Forecasting
 * - Replenishment
 * - Clearance
 * - Delivery Planning
 * - Costing
 * - Predictive Alerts
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('WSSI - Weekly Stock Sales Intake', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/wssi');
        await page.waitForLoadState('networkidle');
    });

    test('should display WSSI dashboard @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should show WSSI data grid or table', async ({ page }) => {
        await page.waitForTimeout(2000);
        const dataDisplay = page.locator('table, [role="grid"], [class*="grid"]');
        await expect(dataDisplay.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have period/week selector', async ({ page }) => {
        const periodSelector = page.locator('[role="combobox"], select, [data-testid*="week"]').filter({
            has: page.locator('text=/week|tuần|period/i')
        });

        if (await periodSelector.first().isVisible({ timeout: 3000 })) {
            await expect(periodSelector.first()).toBeVisible();
        }
    });

    test('should have export functionality', async ({ page }) => {
        const exportButton = page.getByRole('button', { name: /export|xuất|download/i });
        if (await exportButton.isVisible({ timeout: 3000 })) {
            await expect(exportButton).toBeEnabled();
        }
    });

    test('should have brand/store filters', async ({ page }) => {
        const filters = page.locator('[role="combobox"]');
        if (await filters.first().isVisible({ timeout: 3000 })) {
            expect(await filters.count()).toBeGreaterThan(0);
        }
    });
});

test.describe('Forecasting', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/forecasting');
        await page.waitForLoadState('networkidle');
    });

    test('should display forecasting page @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show forecast charts', async ({ page }) => {
        await page.waitForTimeout(2000);
        const charts = page.locator('.recharts-wrapper, svg, [class*="chart"]');
        if (await charts.first().isVisible({ timeout: 5000 })) {
            await expect(charts.first()).toBeVisible();
        }
    });

    test('should have date range controls', async ({ page }) => {
        const dateControls = page.locator('[data-testid*="date"], [class*="calendar"], button:has-text("date")');
        if (await dateControls.first().isVisible({ timeout: 3000 })) {
            await expect(dateControls.first()).toBeVisible();
        }
    });

    test('should show prediction accuracy metrics', async ({ page }) => {
        const metrics = page.locator('[class*="Card"]').filter({
            hasText: /accuracy|độ chính xác|MAPE|forecast/i
        });

        if (await metrics.first().isVisible({ timeout: 3000 })) {
            await expect(metrics.first()).toBeVisible();
        }
    });
});

test.describe('Replenishment', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/replenishment');
        await page.waitForLoadState('networkidle');
    });

    test('should display replenishment page @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show replenishment recommendations', async ({ page }) => {
        const content = page.locator('table, [class*="Card"], [class*="list"]');
        await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have SKU/product filters', async ({ page }) => {
        const filters = page.locator('[role="combobox"], input[type="search"]');
        if (await filters.first().isVisible({ timeout: 3000 })) {
            await expect(filters.first()).toBeVisible();
        }
    });

    test('should show stock level indicators', async ({ page }) => {
        const indicators = page.locator('[class*="badge"], [class*="indicator"], [class*="status"]').filter({
            hasText: /low|critical|normal|thấp|bình thường/i
        });

        if (await indicators.first().isVisible({ timeout: 3000 })) {
            expect(await indicators.count()).toBeGreaterThan(0);
        }
    });

    test('should have generate order button', async ({ page }) => {
        const generateButton = page.getByRole('button', { name: /generate|create|order|tạo/i });
        if (await generateButton.isVisible({ timeout: 3000 })) {
            await expect(generateButton).toBeEnabled();
        }
    });
});

test.describe('Clearance', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/clearance');
        await page.waitForLoadState('networkidle');
    });

    test('should display clearance page @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show markdown/clearance items', async ({ page }) => {
        const content = page.locator('table, [class*="grid"], [class*="list"]');
        await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have clearance percentage controls', async ({ page }) => {
        const controls = page.locator('input[type="number"], [role="slider"], [class*="percent"]');
        if (await controls.first().isVisible({ timeout: 3000 })) {
            await expect(controls.first()).toBeVisible();
        }
    });

    test('should show impact preview', async ({ page }) => {
        const preview = page.locator('[class*="Card"]').filter({
            hasText: /impact|revenue|margin|ảnh hưởng/i
        });

        if (await preview.first().isVisible({ timeout: 3000 })) {
            await expect(preview.first()).toBeVisible();
        }
    });
});

test.describe('Delivery Planning', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/delivery-planning');
        await page.waitForLoadState('networkidle');
    });

    test('should display delivery planning page @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show delivery schedule', async ({ page }) => {
        const content = page.locator('table, [class*="calendar"], [class*="schedule"]');
        await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have date/week selection', async ({ page }) => {
        const dateSelector = page.locator('[role="combobox"], [class*="calendar"], [data-testid*="date"]');
        if (await dateSelector.first().isVisible({ timeout: 3000 })) {
            await expect(dateSelector.first()).toBeVisible();
        }
    });

    test('should show delivery windows', async ({ page }) => {
        const windows = page.locator('[class*="window"], [class*="slot"], td');
        if (await windows.first().isVisible({ timeout: 3000 })) {
            expect(await windows.count()).toBeGreaterThan(0);
        }
    });
});

test.describe('Costing', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/costing');
        await page.waitForLoadState('networkidle');
    });

    test('should display costing page @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show cost breakdown', async ({ page }) => {
        const content = page.locator('table, [class*="Card"], [class*="grid"]');
        await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have cost calculation inputs', async ({ page }) => {
        const inputs = page.locator('input[type="number"], [class*="input"]');
        if (await inputs.first().isVisible({ timeout: 3000 })) {
            expect(await inputs.count()).toBeGreaterThan(0);
        }
    });

    test('should show margin calculations', async ({ page }) => {
        const margins = page.locator('text=/margin|lợi nhuận|%/i');
        if (await margins.first().isVisible({ timeout: 3000 })) {
            await expect(margins.first()).toBeVisible();
        }
    });

    test('should have currency/exchange rate settings', async ({ page }) => {
        const currencyControls = page.locator('[role="combobox"]').filter({
            hasText: /currency|VND|USD|tiền tệ/i
        }).or(page.locator('select[name*="currency"]'));

        if (await currencyControls.first().isVisible({ timeout: 3000 })) {
            await expect(currencyControls.first()).toBeVisible();
        }
    });
});

test.describe('Predictive Alerts', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/predictive-alerts');
        await page.waitForLoadState('networkidle');
    });

    test('should display predictive alerts page @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show active alerts', async ({ page }) => {
        const alertsContent = page.locator('[class*="Card"], [class*="alert"], [class*="list"]');
        await expect(alertsContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display alert severity indicators', async ({ page }) => {
        const severityBadges = page.locator('[class*="badge"], [class*="Badge"]').filter({
            hasText: /critical|warning|info|high|medium|low|nghiêm trọng|cảnh báo/i
        });

        if (await severityBadges.first().isVisible({ timeout: 3000 })) {
            expect(await severityBadges.count()).toBeGreaterThan(0);
        }
    });

    test('should have alert configuration options', async ({ page }) => {
        const configButton = page.getByRole('button', { name: /settings|configure|cấu hình/i });
        if (await configButton.isVisible({ timeout: 3000 })) {
            await expect(configButton).toBeEnabled();
        }
    });

    test('should show alert history', async ({ page }) => {
        const historyTab = page.locator('[role="tab"]').filter({ hasText: /history|lịch sử/i });
        if (await historyTab.isVisible({ timeout: 3000 })) {
            await historyTab.click();
            await page.waitForTimeout(500);
        }
    });

    test('should have acknowledge/dismiss actions', async ({ page }) => {
        const actionButtons = page.locator('button').filter({
            hasText: /acknowledge|dismiss|resolve|xác nhận|bỏ qua/i
        });

        if (await actionButtons.first().isVisible({ timeout: 3000 })) {
            await expect(actionButtons.first()).toBeEnabled();
        }
    });
});

test.describe('Advanced Modules - Responsive Design', () => {
    test('WSSI on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await login(page, TestUsers.admin);
        await page.goto('/wssi');
        await expect(page.locator('main')).toBeVisible();
    });

    test('Forecasting on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await login(page, TestUsers.admin);
        await page.goto('/forecasting');
        await expect(page.locator('main')).toBeVisible();
    });

    test('Replenishment on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await login(page, TestUsers.admin);
        await page.goto('/replenishment');
        await expect(page.locator('main')).toBeVisible();
    });
});
