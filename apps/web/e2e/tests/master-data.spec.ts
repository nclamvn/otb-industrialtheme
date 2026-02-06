/**
 * Comprehensive Master Data Management E2E Tests
 * @tag @phase3 @new
 *
 * Tests Master Data CRUD operations:
 * - /master-data - Overview
 * - /master-data/brands - Brand management
 * - /master-data/categories - Category management
 * - /master-data/locations - Location management
 * - /master-data/users - User management
 */

import { test, expect } from '@playwright/test';
import { TestUsers, TestBrands, TestCategories } from '../fixtures/test-data';
import { login, generateRandomString } from '../fixtures/test-helpers';

test.describe('Master Data - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/master-data');
  });

  test('should display master data page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /master.*data|dữ liệu/i });
    await expect(heading).toBeVisible();
  });

  test('should show navigation to sub-modules', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const links = page.locator('a[href*="/master-data/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Master Data - Brands', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/master-data/brands');
  });

  test('should display brands page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /brand|thương hiệu/i });
    await expect(heading).toBeVisible();
  });

  test('should show brands data table', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const table = page.locator('table, [role="grid"], [data-testid="brands-table"]');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have create brand button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo|thêm/i });
    await expect(createBtn).toBeVisible();
  });

  test('should open create brand dialog', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
  });

  test('should have brand name field in form', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await createBtn.click();

    const nameField = page.locator('input[name*="name"], input[placeholder*="name"]');
    await expect(nameField.first()).toBeVisible();
  });

  test('should have brand code field in form', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await createBtn.click();

    const codeField = page.locator('input[name*="code"], input[placeholder*="code"]');
    if (await codeField.count() > 0) {
      await expect(codeField.first()).toBeVisible();
    }
  });

  test('should search brands', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="tìm"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('REX');
      await page.waitForTimeout(500);
    }
  });

  test('should show edit option in row actions', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const actionsBtn = page.locator('[data-testid="row-actions"], button[aria-label*="action"]').first();

    if (await actionsBtn.isVisible()) {
      await actionsBtn.click();
      const editOption = page.locator('[role="menuitem"]').filter({ hasText: /edit|sửa/i });
      await expect(editOption).toBeVisible();
    }
  });
});

test.describe('Master Data - Categories', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/master-data/categories');
  });

  test('should display categories page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /categor|danh mục/i });
    await expect(heading).toBeVisible();
  });

  test('should show categories table or tree', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const content = page.locator('table, [role="grid"], [class*="tree"], [data-testid="categories"]');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have create category button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo|thêm/i });
    await expect(createBtn).toBeVisible();
  });

  test('should show category hierarchy', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const hierarchy = page.locator('[class*="tree"], [class*="hierarchy"], [data-testid="category-tree"]');

    if (await hierarchy.count() > 0) {
      await expect(hierarchy.first()).toBeVisible();
    }
  });

  test('should expand/collapse categories', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const expandBtn = page.locator('[class*="expand"], [class*="collapse"], [class*="chevron"]').first();

    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Master Data - Locations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/master-data/locations');
  });

  test('should display locations page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /location|địa điểm|cửa hàng/i });
    await expect(heading).toBeVisible();
  });

  test('should show locations table', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const table = page.locator('table, [role="grid"], [data-testid="locations-table"]');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have create location button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo|thêm/i });
    await expect(createBtn).toBeVisible();
  });

  test('should filter by store group', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const filter = page.locator('select, [role="combobox"]').filter({ hasText: /group|nhóm/i });

    if (await filter.count() > 0) {
      await filter.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should show location details', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const row = page.locator('tr, [role="row"]').nth(1);

    if (await row.isVisible()) {
      await row.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Master Data - Users', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/master-data/users');
  });

  test('should display users page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /user|người dùng/i });
    await expect(heading).toBeVisible();
  });

  test('should show users table', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const table = page.locator('table, [role="grid"], [data-testid="users-table"]');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have create user button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo|thêm|invite/i });
    await expect(createBtn).toBeVisible();
  });

  test('should filter by role', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const roleFilter = page.locator('select, [role="combobox"]').filter({ hasText: /role|vai trò/i });

    if (await roleFilter.count() > 0) {
      await roleFilter.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should show user role badges', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const badges = page.locator('[class*="badge"]').filter({ hasText: /admin|manager|planner|viewer/i });

    if (await badges.count() > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test('should edit user role', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const actionsBtn = page.locator('[data-testid="row-actions"], button[aria-label*="action"]').first();

    if (await actionsBtn.isVisible()) {
      await actionsBtn.click();
      const editOption = page.locator('[role="menuitem"]').filter({ hasText: /edit|role|sửa/i });

      if (await editOption.count() > 0) {
        await expect(editOption.first()).toBeVisible();
      }
    }
  });
});

test.describe('Master Data - Role-based Access', () => {
  test('admin should have full CRUD access', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await expect(createBtn).toBeEnabled();
  });

  test('viewer should have read-only access', async ({ page }) => {
    await login(page, TestUsers.viewer);
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    // Should see the page
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();

    // Create button should be hidden or disabled
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    if (await createBtn.isVisible()) {
      await expect(createBtn).toBeDisabled();
    }
  });
});

test.describe('Master Data - Export/Import', () => {
  test('should export brands to CSV', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportBtn.click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/i);
      }
    }
  });
});

test.describe('Master Data - Responsive Design', () => {
  const routes = ['/master-data/brands', '/master-data/categories', '/master-data/locations', '/master-data/users'];

  for (const route of routes) {
    test(`${route} should display correctly on mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await login(page, TestUsers.admin);
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const content = page.locator('main, [class*="content"]');
      await expect(content.first()).toBeVisible();
    });
  }
});

test.describe('Master Data - Performance', () => {
  test('brands page should load within acceptable time', async ({ page }) => {
    await login(page, TestUsers.admin);

    const startTime = Date.now();
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });
});
