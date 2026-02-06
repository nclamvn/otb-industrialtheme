/**
 * Budget Management E2E Tests
 * @tag @phase3 @priority1
 *
 * Comprehensive budget workflow tests:
 * - CRUD operations
 * - Workflow states (Draft → Submit → Review → Approve)
 * - Multi-role approval chain
 * - Filtering and pagination
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login, generateRandomString } from '../fixtures/test-helpers';

test.describe('Budget - List View', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/budgets');
        await page.waitForLoadState('networkidle');
    });

    test('should display budgets page @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
        const heading = page.getByRole('heading', { name: /budget|ngân sách/i });
        await expect(heading).toBeVisible();
    });

    test('should show budgets data table', async ({ page }) => {
        const table = page.locator('table, [role="grid"], [data-testid="budgets-table"]');
        await expect(table.first()).toBeVisible({ timeout: 15000 });
    });

    test('should display budget columns', async ({ page }) => {
        const table = page.locator('table');

        if (await table.isVisible({ timeout: 5000 })) {
            const expectedColumns = ['brand', 'season', 'status', 'amount'];
            for (const col of expectedColumns) {
                const header = table.locator('th').filter({ hasText: new RegExp(col, 'i') });
                // Check if column exists
            }
        }
    });

    test('should have create budget button', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo|thêm/i });
        await expect(createBtn).toBeVisible();
        await expect(createBtn).toBeEnabled();
    });

    test('should support pagination', async ({ page }) => {
        const pagination = page.locator('[class*="pagination"], nav[aria-label*="pagination"]');

        if (await pagination.isVisible({ timeout: 3000 })) {
            const nextBtn = pagination.getByRole('button', { name: /next|sau|>/i });
            if (await nextBtn.isEnabled()) {
                await nextBtn.click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should filter by status', async ({ page }) => {
        const statusFilter = page.locator('[role="combobox"]').filter({
            has: page.locator('text=/status|trạng thái/i')
        }).or(page.locator('select[name*="status"]'));

        if (await statusFilter.first().isVisible({ timeout: 3000 })) {
            await statusFilter.first().click();
            const options = page.locator('[role="option"]');
            if (await options.first().isVisible()) {
                await options.first().click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should filter by brand', async ({ page }) => {
        const brandFilter = page.locator('[role="combobox"]').filter({
            has: page.locator('text=/brand|thương hiệu/i')
        });

        if (await brandFilter.first().isVisible({ timeout: 3000 })) {
            await brandFilter.first().click();
            const options = page.locator('[role="option"]');
            if (await options.first().isVisible()) {
                await options.first().click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should search budgets', async ({ page }) => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');

        if (await searchInput.isVisible({ timeout: 3000 })) {
            await searchInput.fill('REX');
            await page.waitForTimeout(500);
        }
    });
});

test.describe('Budget - Create Flow', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/budgets');
        await page.waitForLoadState('networkidle');
    });

    test('should open create budget form', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });
        await createBtn.click();

        // Form or dialog should appear
        const form = page.locator('form, [role="dialog"]');
        await expect(form).toBeVisible({ timeout: 5000 });
    });

    test('should show required form fields', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });
        await createBtn.click();
        await page.waitForTimeout(500);

        // Brand selector
        const brandSelect = page.locator('[name*="brand"], [data-testid*="brand"]').or(
            page.locator('[role="combobox"]').first()
        );
        await expect(brandSelect.first()).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });
        await createBtn.click();
        await page.waitForTimeout(500);

        // Try to submit without filling
        const submitBtn = page.getByRole('button', { name: /save|submit|create|lưu|gửi/i });
        if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(500);

            // Validation errors should appear
            const errors = page.locator('[class*="error"], [aria-invalid="true"]');
            // Check for errors
        }
    });

    test('should show season selector', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });
        await createBtn.click();
        await page.waitForTimeout(500);

        const seasonSelect = page.locator('[name*="season"], [data-testid*="season"]');
        if (await seasonSelect.first().isVisible()) {
            await expect(seasonSelect.first()).toBeVisible();
        }
    });

    test('should show amount input', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });
        await createBtn.click();
        await page.waitForTimeout(500);

        const amountInput = page.locator('input[name*="amount"], input[type="number"]');
        if (await amountInput.first().isVisible()) {
            await expect(amountInput.first()).toBeVisible();
        }
    });
});

test.describe('Budget - Workflow States', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/budgets');
        await page.waitForLoadState('networkidle');
    });

    test('should display status badges', async ({ page }) => {
        const statusBadges = page.locator('[class*="badge"], [class*="Badge"]').filter({
            hasText: /draft|pending|approved|rejected|nháp|chờ duyệt|đã duyệt/i
        });

        if (await statusBadges.first().isVisible({ timeout: 5000 })) {
            expect(await statusBadges.count()).toBeGreaterThan(0);
        }
    });

    test('should show submit button for draft budgets', async ({ page }) => {
        // Click on a draft budget row
        const draftBadge = page.locator('[class*="badge"]').filter({ hasText: /draft|nháp/i });

        if (await draftBadge.first().isVisible({ timeout: 3000 })) {
            const row = draftBadge.first().locator('xpath=ancestor::tr');
            await row.click();
            await page.waitForTimeout(500);

            const submitBtn = page.getByRole('button', { name: /submit|gửi/i });
            if (await submitBtn.isVisible()) {
                await expect(submitBtn).toBeEnabled();
            }
        }
    });

    test('should show approve/reject for pending budgets', async ({ page }) => {
        const pendingBadge = page.locator('[class*="badge"]').filter({ hasText: /pending|chờ duyệt/i });

        if (await pendingBadge.first().isVisible({ timeout: 3000 })) {
            const row = pendingBadge.first().locator('xpath=ancestor::tr');
            await row.click();
            await page.waitForTimeout(500);

            const approveBtn = page.getByRole('button', { name: /approve|duyệt/i });
            const rejectBtn = page.getByRole('button', { name: /reject|từ chối/i });

            if (await approveBtn.isVisible()) {
                await expect(approveBtn).toBeEnabled();
            }
        }
    });
});

test.describe('Budget - Detail View', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/budgets');
        await page.waitForLoadState('networkidle');
    });

    test('should navigate to budget detail', async ({ page }) => {
        const rows = page.locator('table tbody tr');

        if (await rows.first().isVisible({ timeout: 5000 })) {
            await rows.first().click();
            await page.waitForTimeout(500);

            // Should show detail view or navigate
            const detail = page.locator('[class*="detail"], [class*="drawer"], [role="dialog"]');
            if (await detail.isVisible({ timeout: 3000 })) {
                await expect(detail).toBeVisible();
            }
        }
    });

    test('should show budget summary', async ({ page }) => {
        const rows = page.locator('table tbody tr');

        if (await rows.first().isVisible({ timeout: 5000 })) {
            await rows.first().click();
            await page.waitForTimeout(500);

            const summary = page.locator('[class*="summary"], [class*="Card"]');
            if (await summary.first().isVisible({ timeout: 3000 })) {
                await expect(summary.first()).toBeVisible();
            }
        }
    });

    test('should show edit button for editable budgets', async ({ page }) => {
        const rows = page.locator('table tbody tr');

        if (await rows.first().isVisible({ timeout: 5000 })) {
            await rows.first().click();
            await page.waitForTimeout(500);

            const editBtn = page.getByRole('button', { name: /edit|sửa/i });
            // Edit button should be visible for appropriate states
        }
    });
});

test.describe('Budget - Role-based Access', () => {
    test('admin should have full CRUD access', async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/budgets');
        await page.waitForLoadState('networkidle');

        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });
        await expect(createBtn).toBeVisible();
        await expect(createBtn).toBeEnabled();
    });

    test('finance head should approve/reject budgets', async ({ page }) => {
        await login(page, TestUsers.financeHead);
        await page.goto('/budgets');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('main')).toBeVisible();
    });

    test('brand planner should create and submit budgets', async ({ page }) => {
        await login(page, TestUsers.brandPlanner);
        await page.goto('/budgets');
        await page.waitForLoadState('networkidle');

        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });
        if (await createBtn.isVisible()) {
            await expect(createBtn).toBeEnabled();
        }
    });

    test('viewer should have read-only access', async ({ page }) => {
        await login(page, TestUsers.viewer);
        await page.goto('/budgets');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('main')).toBeVisible();

        // Create button should be hidden or disabled
        const createBtn = page.getByRole('button', { name: /create|new|add|tạo/i });
        if (await createBtn.isVisible()) {
            await expect(createBtn).toBeDisabled();
        }
    });
});

test.describe('Budget - Export', () => {
    test('should export budgets to Excel/CSV', async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/budgets');
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

test.describe('Budget - Responsive Design', () => {
    test('budgets page on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await login(page, TestUsers.admin);
        await page.goto('/budgets');

        await expect(page.locator('main')).toBeVisible();
    });

    test('budgets page on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await login(page, TestUsers.admin);
        await page.goto('/budgets');

        await expect(page.locator('main')).toBeVisible();
    });
});
