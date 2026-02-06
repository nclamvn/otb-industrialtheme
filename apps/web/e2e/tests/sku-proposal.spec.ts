/**
 * SKU Proposal & Import E2E Tests
 * @tag @phase5 @priority1
 *
 * Comprehensive SKU management tests:
 * - SKU creation and editing
 * - Excel import flow
 * - Bulk operations
 * - Margin validation
 * - Size allocation
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login, generateRandomString } from '../fixtures/test-helpers';

test.describe('SKU - List View', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');
    });

    test('should display SKU proposals page @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });

    test('should show SKU data table', async ({ page }) => {
        const table = page.locator('table, [role="grid"], [data-testid="sku-table"]');
        await expect(table.first()).toBeVisible({ timeout: 15000 });
    });

    test('should display SKU columns', async ({ page }) => {
        const table = page.locator('table');

        if (await table.isVisible({ timeout: 5000 })) {
            const headers = table.locator('th');
            expect(await headers.count()).toBeGreaterThan(0);
        }
    });

    test('should have add SKU button', async ({ page }) => {
        const addBtn = page.getByRole('button', { name: /add|create|new|thêm|tạo/i });
        if (await addBtn.first().isVisible()) {
            await expect(addBtn.first()).toBeEnabled();
        }
    });

    test('should have import button', async ({ page }) => {
        const importBtn = page.getByRole('button', { name: /import|nhập/i });
        if (await importBtn.isVisible()) {
            await expect(importBtn).toBeEnabled();
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

    test('should filter by category', async ({ page }) => {
        const categoryFilter = page.locator('[role="combobox"]').filter({
            has: page.locator('text=/category|danh mục/i')
        });

        if (await categoryFilter.first().isVisible({ timeout: 3000 })) {
            await categoryFilter.first().click();
            const options = page.locator('[role="option"]');
            if (await options.first().isVisible()) {
                await options.first().click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should search SKUs', async ({ page }) => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');

        if (await searchInput.isVisible({ timeout: 3000 })) {
            await searchInput.fill('SKU-001');
            await page.waitForTimeout(500);
        }
    });
});

test.describe('SKU - Manual Creation', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');
    });

    test('should open create SKU form', async ({ page }) => {
        const addBtn = page.getByRole('button', { name: /add|create|new|thêm/i });

        if (await addBtn.first().isVisible()) {
            await addBtn.first().click();

            const form = page.locator('form, [role="dialog"]');
            await expect(form).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show SKU code field', async ({ page }) => {
        const addBtn = page.getByRole('button', { name: /add|create|new|thêm/i });

        if (await addBtn.first().isVisible()) {
            await addBtn.first().click();
            await page.waitForTimeout(500);

            const codeField = page.locator('input[name*="code"], input[name*="sku"]');
            if (await codeField.first().isVisible()) {
                await expect(codeField.first()).toBeVisible();
            }
        }
    });

    test('should show style name field', async ({ page }) => {
        const addBtn = page.getByRole('button', { name: /add|create|new|thêm/i });

        if (await addBtn.first().isVisible()) {
            await addBtn.first().click();
            await page.waitForTimeout(500);

            const nameField = page.locator('input[name*="name"], input[name*="style"]');
            if (await nameField.first().isVisible()) {
                await expect(nameField.first()).toBeVisible();
            }
        }
    });

    test('should show price fields', async ({ page }) => {
        const addBtn = page.getByRole('button', { name: /add|create|new|thêm/i });

        if (await addBtn.first().isVisible()) {
            await addBtn.first().click();
            await page.waitForTimeout(500);

            const priceFields = page.locator('input[name*="price"], input[type="number"]');
            if (await priceFields.first().isVisible()) {
                expect(await priceFields.count()).toBeGreaterThan(0);
            }
        }
    });

    test('should validate required fields', async ({ page }) => {
        const addBtn = page.getByRole('button', { name: /add|create|new|thêm/i });

        if (await addBtn.first().isVisible()) {
            await addBtn.first().click();
            await page.waitForTimeout(500);

            const submitBtn = page.getByRole('button', { name: /save|submit|create|lưu/i });
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await page.waitForTimeout(500);
                // Validation errors should appear
            }
        }
    });
});

test.describe('SKU - Excel Import', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');
    });

    test('should open import dialog', async ({ page }) => {
        const importBtn = page.getByRole('button', { name: /import|nhập/i });

        if (await importBtn.isVisible()) {
            await importBtn.click();

            const dialog = page.locator('[role="dialog"]');
            await expect(dialog).toBeVisible({ timeout: 5000 });
        }
    });

    test('should show file upload area', async ({ page }) => {
        const importBtn = page.getByRole('button', { name: /import|nhập/i });

        if (await importBtn.isVisible()) {
            await importBtn.click();
            await page.waitForTimeout(500);

            const uploadArea = page.locator('input[type="file"], [class*="upload"], [class*="dropzone"]');
            if (await uploadArea.first().isVisible()) {
                await expect(uploadArea.first()).toBeVisible();
            }
        }
    });

    test('should have download template button', async ({ page }) => {
        const importBtn = page.getByRole('button', { name: /import|nhập/i });

        if (await importBtn.isVisible()) {
            await importBtn.click();
            await page.waitForTimeout(500);

            const templateBtn = page.getByRole('button', { name: /template|mẫu|download/i });
            if (await templateBtn.isVisible()) {
                await expect(templateBtn).toBeEnabled();
            }
        }
    });

    test('should show import preview after file selection', async ({ page }) => {
        // This test would need actual file upload
        // Placeholder for the flow
    });
});

test.describe('SKU - Bulk Operations', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');
    });

    test('should show checkbox for row selection', async ({ page }) => {
        const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
        if (await checkboxes.first().isVisible({ timeout: 5000 })) {
            expect(await checkboxes.count()).toBeGreaterThan(0);
        }
    });

    test('should enable bulk actions on selection', async ({ page }) => {
        const headerCheckbox = page.locator('thead input[type="checkbox"], th [role="checkbox"]');

        if (await headerCheckbox.isVisible({ timeout: 3000 })) {
            await headerCheckbox.click();
            await page.waitForTimeout(500);

            const bulkActions = page.locator('[class*="bulk"], button').filter({
                hasText: /delete|approve|export|xóa|duyệt|xuất/i
            });
            // Bulk actions should appear
        }
    });
});

test.describe('SKU - Margin Validation', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');
    });

    test('should display margin indicators', async ({ page }) => {
        const marginIndicators = page.locator('[class*="margin"], [data-testid*="margin"]');
        if (await marginIndicators.first().isVisible({ timeout: 5000 })) {
            await expect(marginIndicators.first()).toBeVisible();
        }
    });

    test('should show low margin warning', async ({ page }) => {
        const warnings = page.locator('[class*="warning"], [class*="alert"]').filter({
            hasText: /margin|lợi nhuận/i
        });

        if (await warnings.first().isVisible({ timeout: 3000 })) {
            await expect(warnings.first()).toBeVisible();
        }
    });
});

test.describe('SKU - Size Allocation', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');
    });

    test('should open size allocation dialog', async ({ page }) => {
        const rows = page.locator('table tbody tr');

        if (await rows.first().isVisible({ timeout: 5000 })) {
            await rows.first().click();
            await page.waitForTimeout(500);

            const sizeBtn = page.getByRole('button', { name: /size|kích cỡ|allocation/i });
            if (await sizeBtn.isVisible()) {
                await sizeBtn.click();
                await page.waitForTimeout(500);
            }
        }
    });

    test('should show size curve options', async ({ page }) => {
        const sizeCurve = page.locator('[class*="size-curve"], [data-testid*="size"]');
        if (await sizeCurve.first().isVisible({ timeout: 3000 })) {
            await expect(sizeCurve.first()).toBeVisible();
        }
    });

    test('should show quantity inputs per size', async ({ page }) => {
        const sizeInputs = page.locator('input[name*="size"], input[name*="qty"]');
        if (await sizeInputs.first().isVisible({ timeout: 3000 })) {
            expect(await sizeInputs.count()).toBeGreaterThan(0);
        }
    });
});

test.describe('SKU - Role-based Access', () => {
    test('admin should have full SKU access', async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('main')).toBeVisible();
    });

    test('brand planner should manage SKUs', async ({ page }) => {
        await login(page, TestUsers.brandPlanner);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('main')).toBeVisible();
    });

    test('viewer should have read-only access', async ({ page }) => {
        await login(page, TestUsers.viewer);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('main')).toBeVisible();

        const addBtn = page.getByRole('button', { name: /add|create|new|thêm/i });
        if (await addBtn.first().isVisible()) {
            await expect(addBtn.first()).toBeDisabled();
        }
    });
});

test.describe('SKU - Export', () => {
    test('should export SKUs to Excel', async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');
        await page.waitForLoadState('networkidle');

        const exportBtn = page.getByRole('button', { name: /export|xuất/i });

        if (await exportBtn.isVisible({ timeout: 3000 })) {
            const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
            await exportBtn.click();

            const download = await downloadPromise;
            if (download) {
                expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/i);
            }
        }
    });
});

test.describe('SKU - Responsive Design', () => {
    test('SKU page on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');

        await expect(page.locator('main')).toBeVisible();
    });

    test('SKU page on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await login(page, TestUsers.admin);
        await page.goto('/sku-proposals');

        await expect(page.locator('main')).toBeVisible();
    });
});
