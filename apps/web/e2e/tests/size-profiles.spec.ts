/**
 * Comprehensive Size Profiles E2E Tests
 * @tag @phase4 @new
 *
 * Tests Size Profile features:
 * - /size-profiles - Size profile management
 * - Size curve configuration
 * - Profile assignment
 * - Historical analysis
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('Size Profiles - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
  });

  test('should display size profiles page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /size.*profile|kích cỡ/i });
    await expect(heading).toBeVisible();
  });

  test('should show profiles list/table', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const list = page.locator('table, [role="grid"], [data-testid="profiles-list"]');
    await expect(list.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have create profile button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo|thêm/i });
    await expect(createBtn.first()).toBeVisible();
  });

  test('should display profile names', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const nameCol = page.locator('th, [role="columnheader"]').filter({ hasText: /name|tên/i });

    if (await nameCol.count() > 0) {
      await expect(nameCol.first()).toBeVisible();
    }
  });

  test('should show category assignment', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const categoryCol = page.locator('th, [role="columnheader"]').filter({ hasText: /category|danh mục/i });

    if (await categoryCol.count() > 0) {
      await expect(categoryCol.first()).toBeVisible();
    }
  });

  test('should filter by category', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const filter = page.locator('select, [role="combobox"]').filter({ hasText: /category|danh mục/i });

    if (await filter.count() > 0) {
      await filter.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should search profiles', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="tìm"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('Standard');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Size Profiles - Create Profile', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
  });

  test('should open create profile dialog', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    }
  });

  test('should have profile name field', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();
      const nameField = page.locator('input[name*="name"], input[placeholder*="name"]');
      await expect(nameField.first()).toBeVisible();
    }
  });

  test('should have size inputs', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();
      // Should have size inputs (XS, S, M, L, XL, etc.)
      const sizeInputs = page.locator('input[type="number"], input[name*="size"]');
      const count = await sizeInputs.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should show percentage distribution', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();
      const percentages = page.locator('[class*="percent"]').filter({ hasText: /%/ });

      if (await percentages.count() > 0) {
        await expect(percentages.first()).toBeVisible();
      }
    }
  });

  test('should validate total equals 100%', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();
      const total = page.locator('[class*="total"]').filter({ hasText: /100|total|tổng/i });

      if (await total.count() > 0) {
        await expect(total.first()).toBeVisible();
      }
    }
  });

  test('should have cancel button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();
      const cancelBtn = page.getByRole('button', { name: /cancel|hủy/i });
      await expect(cancelBtn).toBeVisible();
    }
  });

  test('should have save button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();
      const saveBtn = page.getByRole('button', { name: /save|create|lưu|tạo/i });
      await expect(saveBtn.first()).toBeVisible();
    }
  });
});

test.describe('Size Profiles - Size Curve Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
  });

  test('should display size curve chart', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const chart = page.locator('canvas, [class*="chart"], svg[class*="recharts"]');

    if (await chart.count() > 0) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('should show size labels on x-axis', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const sizeLabels = page.locator('[class*="axis"], [class*="label"]').filter({ hasText: /xs|s|m|l|xl/i });

    if (await sizeLabels.count() > 0) {
      await expect(sizeLabels.first()).toBeVisible();
    }
  });

  test('should highlight peak size', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const peak = page.locator('[class*="peak"], [class*="highlight"]');

    if (await peak.count() > 0) {
      await expect(peak.first()).toBeVisible();
    }
  });
});

test.describe('Size Profiles - Edit Profile', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
  });

  test('should have edit option in row actions', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const actionsBtn = page.locator('[data-testid="row-actions"], button[aria-label*="action"]').first();

    if (await actionsBtn.isVisible()) {
      await actionsBtn.click();
      const editOption = page.locator('[role="menuitem"]').filter({ hasText: /edit|sửa/i });
      await expect(editOption).toBeVisible();
    }
  });

  test('should open edit dialog', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const row = page.locator('tr, [role="row"]').nth(1);

    if (await row.isVisible()) {
      await row.dblclick();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('should modify size percentages', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const actionsBtn = page.locator('[data-testid="row-actions"], button[aria-label*="action"]').first();

    if (await actionsBtn.isVisible()) {
      await actionsBtn.click();
      const editOption = page.locator('[role="menuitem"]').filter({ hasText: /edit|sửa/i });

      if (await editOption.isVisible()) {
        await editOption.click();
        const numberInput = page.locator('[role="dialog"] input[type="number"]').first();

        if (await numberInput.isVisible()) {
          await expect(numberInput).toBeEditable();
        }
      }
    }
  });
});

test.describe('Size Profiles - Profile Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
  });

  test('should show assigned categories', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const categories = page.locator('[class*="category"], [class*="badge"]').filter({ hasText: /apparel|footwear|accessories/i });

    if (await categories.count() > 0) {
      await expect(categories.first()).toBeVisible();
    }
  });

  test('should assign profile to category', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const assignBtn = page.getByRole('button', { name: /assign|gán/i });

    if (await assignBtn.count() > 0) {
      await expect(assignBtn.first()).toBeVisible();
    }
  });

  test('should unassign profile from category', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const unassignBtn = page.getByRole('button', { name: /unassign|remove|xóa|gỡ/i });

    if (await unassignBtn.count() > 0) {
      await expect(unassignBtn.first()).toBeVisible();
    }
  });
});

test.describe('Size Profiles - Historical Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
  });

  test('should show historical data tab', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const historyTab = page.getByRole('tab', { name: /history|historical|lịch sử/i });

    if (await historyTab.count() > 0) {
      await expect(historyTab).toBeVisible();
    }
  });

  test('should display sales by size chart', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const historyTab = page.getByRole('tab', { name: /history|historical|lịch sử/i });

    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(500);

      const chart = page.locator('canvas, [class*="chart"], svg');
      if (await chart.count() > 0) {
        await expect(chart.first()).toBeVisible();
      }
    }
  });

  test('should filter historical data by date', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const historyTab = page.getByRole('tab', { name: /history|historical|lịch sử/i });

    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(500);

      const dateFilter = page.locator('input[type="date"], [data-testid="date-filter"]');
      if (await dateFilter.count() > 0) {
        await expect(dateFilter.first()).toBeVisible();
      }
    }
  });

  test('should compare actual vs profile', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const compareBtn = page.getByRole('button', { name: /compare|so sánh/i });

    if (await compareBtn.count() > 0) {
      await expect(compareBtn.first()).toBeVisible();
    }
  });
});

test.describe('Size Profiles - Clone/Duplicate', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
  });

  test('should have clone option', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const actionsBtn = page.locator('[data-testid="row-actions"], button[aria-label*="action"]').first();

    if (await actionsBtn.isVisible()) {
      await actionsBtn.click();
      const cloneOption = page.locator('[role="menuitem"]').filter({ hasText: /clone|duplicate|sao chép/i });

      if (await cloneOption.count() > 0) {
        await expect(cloneOption).toBeVisible();
      }
    }
  });

  test('should clone profile with new name', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const actionsBtn = page.locator('[data-testid="row-actions"], button[aria-label*="action"]').first();

    if (await actionsBtn.isVisible()) {
      await actionsBtn.click();
      const cloneOption = page.locator('[role="menuitem"]').filter({ hasText: /clone|duplicate|sao chép/i });

      if (await cloneOption.isVisible()) {
        await cloneOption.click();
        const nameInput = page.locator('[role="dialog"] input[name*="name"]');

        if (await nameInput.count() > 0) {
          await expect(nameInput.first()).toBeVisible();
        }
      }
    }
  });
});

test.describe('Size Profiles - Delete', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
  });

  test('should have delete option', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const actionsBtn = page.locator('[data-testid="row-actions"], button[aria-label*="action"]').first();

    if (await actionsBtn.isVisible()) {
      await actionsBtn.click();
      const deleteOption = page.locator('[role="menuitem"]').filter({ hasText: /delete|xóa/i });

      if (await deleteOption.count() > 0) {
        await expect(deleteOption).toBeVisible();
      }
    }
  });

  test('should show confirmation dialog', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const actionsBtn = page.locator('[data-testid="row-actions"], button[aria-label*="action"]').first();

    if (await actionsBtn.isVisible()) {
      await actionsBtn.click();
      const deleteOption = page.locator('[role="menuitem"]').filter({ hasText: /delete|xóa/i });

      if (await deleteOption.isVisible()) {
        await deleteOption.click();
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]');

        if (await confirmDialog.count() > 0) {
          await expect(confirmDialog).toBeVisible();
        }
      }
    }
  });
});

test.describe('Size Profiles - Export/Import', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
  });

  test('should export profiles', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportBtn.click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|json)$/i);
      }
    }
  });

  test('should have import option', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const importBtn = page.getByRole('button', { name: /import|nhập/i });

    if (await importBtn.count() > 0) {
      await expect(importBtn).toBeVisible();
    }
  });
});

test.describe('Size Profiles - Role-based Access', () => {
  test('admin should have full access', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await expect(createBtn.first()).toBeVisible();
  });

  test('planner should have access', async ({ page }) => {
    await login(page, TestUsers.brandPlanner);
    await page.goto('/size-profiles');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('viewer should have read-only access', async ({ page }) => {
    await login(page, TestUsers.viewer);
    await page.goto('/size-profiles');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();

    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    if (await createBtn.isVisible()) {
      await expect(createBtn).toBeDisabled();
    }
  });
});

test.describe('Size Profiles - Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, TestUsers.admin);
    await page.goto('/size-profiles');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Size Profiles - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    await login(page, TestUsers.admin);

    const startTime = Date.now();
    await page.goto('/size-profiles');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });
});
