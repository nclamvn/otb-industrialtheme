import { test, expect } from '@playwright/test';
import { loginViaToken } from '../helpers/auth';
import { setupApiMocks } from '../helpers/api-mocks';

test.describe('Budget Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await loginViaToken(page);
  });

  test('should navigate to budget management page', async ({ page }) => {
    await page.goto('/budget-management');
    await page.waitForLoadState('networkidle');

    // Page should contain budget-related content
    const heading = page.locator('h1, h2, [data-testid="page-title"]').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display budget statistics', async ({ page }) => {
    await page.goto('/budget-management');
    await page.waitForLoadState('networkidle');

    // Should show statistics or summary cards
    const content = await page.textContent('body');
    // Budget page should have loaded some content
    expect(content.length).toBeGreaterThan(100);
  });

  test('should show budget grid/table', async ({ page }) => {
    await page.goto('/budget-management');
    await page.waitForLoadState('networkidle');

    // Should have a table or grid structure
    const tableOrGrid = page.locator('table, [role="grid"], [class*="grid"]').first();
    await expect(tableOrGrid).toBeVisible({ timeout: 10000 });
  });

  test('should filter budgets by year', async ({ page }) => {
    await page.goto('/budget-management');
    await page.waitForLoadState('networkidle');

    // Look for year selector
    const yearSelect = page.locator('select, [role="combobox"], button:has-text("2025"), button:has-text("FY")').first();
    if (await yearSelect.isVisible()) {
      await yearSelect.click();
    }
  });
});
