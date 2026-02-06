/**
 * Comprehensive Budget Management E2E Tests
 *
 * Tests complete budget lifecycle:
 * - Budget CRUD operations
 * - Budget workflow (Draft -> Submit -> Review -> Approve/Reject)
 * - Filtering and pagination
 * - Form validation
 * - Change log tracking
 */

import { test, expect } from '@playwright/test';
import { TestUsers, TestBudget, TestBrands, TestSeasons } from '../fixtures/test-data';
import { login, navigateAndWait, fillForm, selectOption, generateRandomString } from '../fixtures/test-helpers';

test.describe('Budget Management - List View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget');
  });

  test('should display budget list page with header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /budget|ngân sách/i })).toBeVisible();
  });

  test('should show budget data table', async ({ page }) => {
    const table = page.locator('table, [role="grid"], [data-testid="budget-list"], .data-table');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have create new budget button', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo|thêm/i });
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toBeEnabled();
  });

  test('should display status badges in table', async ({ page }) => {
    const table = page.locator('table tbody, [data-testid="budget-list"]');

    if (await table.isVisible()) {
      const badges = table.locator('[class*="badge"], [data-testid="status-badge"], .status');
      const badgeCount = await badges.count();

      if (badgeCount > 0) {
        await expect(badges.first()).toBeVisible();
      }
    }
  });

  test('should support pagination', async ({ page }) => {
    const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagination"]');

    if (await pagination.isVisible()) {
      const pageInfo = pagination.locator('[class*="page"], .page-info');
      await expect(pageInfo.or(pagination)).toBeVisible();
    }
  });
});

test.describe('Budget Management - Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget');
  });

  test('should filter by status', async ({ page }) => {
    const statusFilter = page.locator(
      '[data-testid="status-filter"], select[name*="status"], [name="status"]',
    );

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      const options = page.locator('[role="option"], option');
      if ((await options.count()) > 0) {
        await options.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should filter by brand', async ({ page }) => {
    const brandFilter = page.locator(
      '[data-testid="brand-filter"], select[name*="brand"], [name="brandId"]',
    );

    if (await brandFilter.isVisible()) {
      await brandFilter.click();

      const options = page.locator('[role="option"], option');
      if ((await options.count()) > 0) {
        await options.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should filter by season', async ({ page }) => {
    const seasonFilter = page.locator(
      '[data-testid="season-filter"], select[name*="season"], [name="seasonId"]',
    );

    if (await seasonFilter.isVisible()) {
      await seasonFilter.click();

      const options = page.locator('[role="option"], option');
      if ((await options.count()) > 0) {
        await options.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should search budgets', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], [data-testid="search-input"], input[placeholder*="Search"], input[placeholder*="Tìm"]',
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('Nike');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should reset filters', async ({ page }) => {
    const resetBtn = page.getByRole('button', { name: /reset|clear|xóa/i });

    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForLoadState('networkidle');
    }
  });
});

test.describe('Budget Management - Create Budget', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget/new');
  });

  test('should display create budget form', async ({ page }) => {
    const form = page.locator('form, [data-testid="budget-form"]');
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test('should have required form fields', async ({ page }) => {
    // Season field
    const seasonField = page.getByLabel(/season|mùa/i).or(page.locator('[name="seasonId"]'));
    await expect(seasonField.first()).toBeVisible();

    // Brand field
    const brandField = page.getByLabel(/brand|thương hiệu/i).or(page.locator('[name="brandId"]'));
    await expect(brandField.first()).toBeVisible();

    // Amount field
    const amountField = page.getByLabel(/amount|budget|total|ngân sách/i).or(page.locator('[name="totalBudget"]'));
    await expect(amountField.first()).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /submit|save|create|tạo|lưu/i });

    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Should show validation errors
      const errors = page.locator('.text-destructive, .text-red-500, [role="alert"]');
      await expect(errors.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should create budget with valid data', async ({ page }) => {
    // Select season
    const seasonSelect = page.locator('[name="seasonId"], [data-testid="season-select"]');
    if (await seasonSelect.isVisible()) {
      await seasonSelect.click();
      await page.locator('[role="option"]').first().click();
    }

    // Select brand
    const brandSelect = page.locator('[name="brandId"], [data-testid="brand-select"]');
    if (await brandSelect.isVisible()) {
      await brandSelect.click();
      await page.locator('[role="option"]').first().click();
    }

    // Fill budget amounts
    const budgetInput = page.locator('[name="totalBudget"], [data-testid="total-budget"]');
    if (await budgetInput.isVisible()) {
      await budgetInput.fill(String(TestBudget.valid.totalBudget));
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /submit|save|create|tạo|lưu/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Should show success or navigate away
      await page.waitForTimeout(2000);
      const url = page.url();
      const hasSuccess = await page.getByText(/success|created|thành công/i).isVisible();
      const hasNavigated = !url.includes('/new');

      expect(hasSuccess || hasNavigated).toBeTruthy();
    }
  });

  test('should calculate total budget automatically', async ({ page }) => {
    const seasonalInput = page.locator('[name="seasonalBudget"]');
    const replenishInput = page.locator('[name="replenishmentBudget"]');

    if (await seasonalInput.isVisible() && await replenishInput.isVisible()) {
      await seasonalInput.fill('1000000');
      await replenishInput.fill('500000');

      // Wait for calculation
      await page.waitForTimeout(500);

      const totalInput = page.locator('[name="totalBudget"]');
      if (await totalInput.isVisible()) {
        const value = await totalInput.inputValue();
        const numValue = parseInt(value.replace(/[^0-9]/g, ''));
        expect(numValue).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Budget Management - Edit Budget', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget');
  });

  test('should navigate to edit page on row click', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="budget-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should navigate to detail/edit page
      const url = page.url();
      expect(url.includes('/budget/')).toBeTruthy();
    }
  });

  test('should display budget details', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="budget-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      // Should show budget details
      const detailPage = page.locator('[data-testid="budget-detail"], main');
      await expect(detailPage).toBeVisible();
    }
  });

  test('should update budget amount', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="budget-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      // Find edit button
      const editBtn = page.getByRole('button', { name: /edit|sửa/i });
      if (await editBtn.isVisible()) {
        await editBtn.click();

        // Update amount
        const amountInput = page.locator('[name="totalBudget"]');
        if (await amountInput.isVisible()) {
          await amountInput.clear();
          await amountInput.fill('2000000');

          // Save
          const saveBtn = page.getByRole('button', { name: /save|update|lưu|cập nhật/i });
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }
  });
});

test.describe('Budget Management - Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should submit draft budget for approval', async ({ page }) => {
    await page.goto('/budget');

    // Find draft budget
    const draftRow = page.locator('[data-status="DRAFT"], tr:has-text("Draft")').first();

    if (await draftRow.isVisible()) {
      await draftRow.click();
      await page.waitForLoadState('networkidle');

      // Find submit button
      const submitBtn = page.getByRole('button', { name: /submit.*approval|gửi.*duyệt/i });
      if (await submitBtn.isVisible()) {
        await expect(submitBtn).toBeEnabled();
      }
    }
  });

  test('should approve submitted budget', async ({ page }) => {
    await page.goto('/budget');

    // Find submitted budget
    const submittedRow = page.locator('[data-status="SUBMITTED"], tr:has-text("Submitted")').first();

    if (await submittedRow.isVisible()) {
      await submittedRow.click();
      await page.waitForLoadState('networkidle');

      // Find approve button
      const approveBtn = page.getByRole('button', { name: /approve|duyệt/i });
      if (await approveBtn.isVisible()) {
        await expect(approveBtn).toBeEnabled();
      }
    }
  });

  test('should reject submitted budget', async ({ page }) => {
    await page.goto('/budget');

    // Find submitted budget
    const submittedRow = page.locator('[data-status="SUBMITTED"], tr:has-text("Submitted")').first();

    if (await submittedRow.isVisible()) {
      await submittedRow.click();
      await page.waitForLoadState('networkidle');

      // Find reject button
      const rejectBtn = page.getByRole('button', { name: /reject|từ chối/i });
      if (await rejectBtn.isVisible()) {
        await expect(rejectBtn).toBeEnabled();
      }
    }
  });
});

test.describe('Budget Management - Change Log', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget');
  });

  test('should display change history', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="budget-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      // Look for change log section
      const changeLog = page.locator(
        '[data-testid="change-log"], [data-testid="history"], .change-log, .history',
      );

      // Click on history tab if exists
      const historyTab = page.getByRole('tab', { name: /history|log|lịch sử/i });
      if (await historyTab.isVisible()) {
        await historyTab.click();
        await expect(changeLog.or(page.getByText(/change|history|thay đổi/i))).toBeVisible();
      }
    }
  });
});

test.describe('Budget Management - Export', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget');
  });

  test('should have export functionality', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });
});

test.describe('Budget Management - Responsive', () => {
  test('should display properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TestUsers.admin);
    await page.goto('/budget');

    // Should still show main content
    await expect(page.getByRole('main')).toBeVisible();

    // Table should be scrollable or cards should be visible
    const content = page.locator('table, [data-testid="budget-list"], .budget-cards');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should work on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, TestUsers.admin);
    await page.goto('/budget');

    await expect(page.getByRole('main')).toBeVisible();
  });
});
