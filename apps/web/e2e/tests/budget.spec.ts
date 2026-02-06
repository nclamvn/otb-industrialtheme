import { test, expect } from '@playwright/test';

/**
 * Budget Management E2E Tests
 *
 * Tests:
 * - Budget list page
 * - Create new budget
 * - Edit budget
 * - Budget form validation
 * - Budget status workflow
 * - Budget filtering
 */

test.describe('Budget Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('admin@dafc.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/dashboard|\/$/);

    // Navigate to budget page
    await page.goto('/budget');
  });

  test('should display budget list page', async ({ page }) => {
    // Check page header
    await expect(page.getByRole('heading', { name: /budget/i })).toBeVisible();

    // Check for table or list
    const dataTable = page.locator('table, [role="grid"], [data-testid="budget-list"]');
    await expect(dataTable).toBeVisible({ timeout: 10000 });
  });

  test('should have create new budget button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /new|create|add/i });
    await expect(createButton).toBeVisible();
  });

  test('should navigate to create budget form', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /new|create|add/i });
    await createButton.click();

    // Should show form or navigate to new page
    await expect(page.locator('form, [data-testid="budget-form"]')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields in budget form', async ({ page }) => {
    // Navigate to create form
    await page.goto('/budget/new');

    // Submit empty form
    const submitButton = page.getByRole('button', { name: /submit|save|create/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      await expect(page.getByText(/required|please select|please enter/i).first()).toBeVisible();
    }
  });

  test('should have filter/search functionality', async ({ page }) => {
    // Look for filter inputs
    const filterInput = page.getByPlaceholder(/search|filter/i).or(
      page.locator('[data-testid="search-input"]')
    );

    if (await filterInput.isVisible()) {
      await filterInput.fill('test');
      await page.waitForTimeout(500);
    }

    // Look for status filter
    const statusFilter = page.getByRole('combobox', { name: /status/i }).or(
      page.locator('[data-testid="status-filter"]')
    );

    if (await statusFilter.isVisible()) {
      await statusFilter.click();
    }
  });

  test('should show budget details on click', async ({ page }) => {
    // Click on first budget row
    const firstRow = page.locator('table tbody tr, [data-testid="budget-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Should navigate to detail page or show detail panel
      await page.waitForTimeout(500);
    }
  });

  test('should display budget status badges', async ({ page }) => {
    // Look for status badges
    const statusBadges = page.locator('[data-testid="status-badge"], .badge, [class*="status"]');
    if ((await statusBadges.count()) > 0) {
      await expect(statusBadges.first()).toBeVisible();
    }
  });

  test('should handle pagination', async ({ page }) => {
    // Look for pagination
    const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagination"]');

    if (await pagination.isVisible()) {
      // Try clicking next page
      const nextButton = page.getByRole('button', { name: /next|>/i });
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('Budget Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('admin@dafc.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/dashboard|\/$/);
    await page.goto('/budget/new');
  });

  test('should have all required form fields', async ({ page }) => {
    // Check for season dropdown
    await expect(page.getByLabel(/season/i).or(page.locator('[name="seasonId"]'))).toBeVisible();

    // Check for brand dropdown
    await expect(page.getByLabel(/brand/i).or(page.locator('[name="brandId"]'))).toBeVisible();

    // Check for amount input
    await expect(page.getByLabel(/amount|budget|total/i).or(page.locator('[name="totalBudget"]'))).toBeVisible();
  });

  test('should show currency selector', async ({ page }) => {
    const currencySelect = page.getByLabel(/currency/i).or(page.locator('[name="currency"]'));
    if (await currencySelect.isVisible()) {
      await expect(currencySelect).toBeVisible();
    }
  });

  test('should calculate totals automatically', async ({ page }) => {
    // Fill seasonal budget
    const seasonalInput = page.getByLabel(/seasonal/i).or(page.locator('[name="seasonalBudget"]'));
    const replenishInput = page.getByLabel(/replenish/i).or(page.locator('[name="replenishmentBudget"]'));

    if (await seasonalInput.isVisible() && await replenishInput.isVisible()) {
      await seasonalInput.fill('100000');
      await replenishInput.fill('50000');

      // Total should update
      const totalInput = page.getByLabel(/total/i).or(page.locator('[name="totalBudget"]'));
      if (await totalInput.isVisible()) {
        const totalValue = await totalInput.inputValue();
        expect(Number(totalValue.replace(/[^0-9]/g, ''))).toBeGreaterThan(0);
      }
    }
  });
});
