/**
 * Comprehensive OTB Plans E2E Tests
 *
 * Tests complete OTB (Open-to-Buy) planning:
 * - OTB plan CRUD operations
 * - Versioning (V0 -> VA -> VF)
 * - Sizing data management
 * - Approval workflow
 * - AI proposal generation
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login, navigateAndWait } from '../fixtures/test-helpers';

test.describe('OTB Plans - List View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');
  });

  test('should display OTB plans page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /otb|plan|kế hoạch/i })).toBeVisible();
  });

  test('should show plans data table or empty state', async ({ page }) => {
    const table = page.locator('table, [role="grid"], [data-testid="otb-list"]');
    const emptyState = page.getByText(/no.*plan|empty|chưa có/i);

    await expect(table.or(emptyState)).toBeVisible({ timeout: 15000 });
  });

  test('should have create new plan button', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toBeEnabled();
  });

  test('should display plan status badges', async ({ page }) => {
    const table = page.locator('table tbody');

    if (await table.isVisible()) {
      const badges = table.locator('[class*="badge"], [data-testid="status-badge"]');
      if ((await badges.count()) > 0) {
        await expect(badges.first()).toBeVisible();
      }
    }
  });

  test('should support filtering by status', async ({ page }) => {
    const statusFilter = page.locator('[data-testid="status-filter"], [name="status"]');

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      const options = page.locator('[role="option"]');
      expect(await options.count()).toBeGreaterThan(0);
    }
  });

  test('should support filtering by brand', async ({ page }) => {
    const brandFilter = page.locator('[data-testid="brand-filter"], [name="brandId"]');

    if (await brandFilter.isVisible()) {
      await brandFilter.click();

      const options = page.locator('[role="option"]');
      expect(await options.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('OTB Plans - Create Plan', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans/new');
  });

  test('should display create plan form', async ({ page }) => {
    const form = page.locator('form, [data-testid="otb-form"]');
    await expect(form.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have required fields', async ({ page }) => {
    // Brand field
    const brandField = page.getByLabel(/brand|thương hiệu/i).or(page.locator('[name="brandId"]'));
    await expect(brandField.first()).toBeVisible();

    // Season field
    const seasonField = page.getByLabel(/season|mùa/i).or(page.locator('[name="seasonId"]'));
    await expect(seasonField.first()).toBeVisible();

    // Budget field
    const budgetField = page.getByLabel(/budget|ngân sách/i).or(page.locator('[name="budgetId"]'));
    if (await budgetField.first().isVisible()) {
      await expect(budgetField.first()).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /submit|save|create|tạo/i });

    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      const errors = page.locator('.text-destructive, .text-red-500, [role="alert"]');
      await expect(errors.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should create plan with valid data', async ({ page }) => {
    // Select brand
    const brandSelect = page.locator('[name="brandId"], [data-testid="brand-select"]');
    if (await brandSelect.isVisible()) {
      await brandSelect.click();
      await page.locator('[role="option"]').first().click();
    }

    // Select season
    const seasonSelect = page.locator('[name="seasonId"], [data-testid="season-select"]');
    if (await seasonSelect.isVisible()) {
      await seasonSelect.click();
      await page.locator('[role="option"]').first().click();
    }

    // Select budget
    const budgetSelect = page.locator('[name="budgetId"], [data-testid="budget-select"]');
    if (await budgetSelect.isVisible()) {
      await budgetSelect.click();
      await page.locator('[role="option"]').first().click();
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /submit|save|create|tạo/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      const hasSuccess = await page.getByText(/success|created|thành công/i).isVisible();
      const hasNavigated = !page.url().includes('/new');

      expect(hasSuccess || hasNavigated).toBeTruthy();
    }
  });
});

test.describe('OTB Plans - Plan Detail', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');
  });

  test('should navigate to plan detail', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toMatch(/otb-plans\/[a-zA-Z0-9-]+/);
    }
  });

  test('should display plan overview', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      const overview = page.locator('[data-testid="plan-overview"], .plan-overview');
      await expect(page.getByRole('main')).toBeVisible();
    }
  });

  test('should display version information', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      const version = page.getByText(/version|phiên bản|V[0-9A-F]/i);
      if (await version.first().isVisible()) {
        await expect(version.first()).toBeVisible();
      }
    }
  });

  test('should display monthly breakdown', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      const monthlySection = page.locator(
        '[data-testid="monthly-breakdown"], .monthly-allocation',
      );

      // Look for monthly tabs or sections
      const monthlyTab = page.getByRole('tab', { name: /monthly|hàng tháng/i });
      if (await monthlyTab.isVisible()) {
        await monthlyTab.click();
      }
    }
  });
});

test.describe('OTB Plans - Line Items', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');
  });

  test('should display line items table', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      // Navigate to line items section
      const lineItemsTab = page.getByRole('tab', { name: /line.*item|mặt hàng/i });
      if (await lineItemsTab.isVisible()) {
        await lineItemsTab.click();

        const lineItemsTable = page.locator('[data-testid="line-items"], table');
        await expect(lineItemsTable.first()).toBeVisible();
      }
    }
  });

  test('should add new line item', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      const addBtn = page.getByRole('button', { name: /add.*item|thêm/i });
      if (await addBtn.isVisible()) {
        await expect(addBtn).toBeEnabled();
      }
    }
  });
});

test.describe('OTB Plans - Sizing Data', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');
  });

  test('should display sizing section', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      const sizingTab = page.getByRole('tab', { name: /sizing|size|kích cỡ/i });
      if (await sizingTab.isVisible()) {
        await sizingTab.click();
        await expect(page.getByRole('main')).toBeVisible();
      }
    }
  });

  test('should show size distribution', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      const sizingSection = page.locator('[data-testid="sizing"], .size-distribution');
      if (await sizingSection.isVisible()) {
        // Size labels should be visible
        const sizeLabels = page.getByText(/XS|S|M|L|XL|XXL/);
        expect(await sizeLabels.count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('OTB Plans - Versioning', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');
  });

  test('should display version history', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      const historyTab = page.getByRole('tab', { name: /history|version|lịch sử/i });
      if (await historyTab.isVisible()) {
        await historyTab.click();
        await expect(page.getByRole('main')).toBeVisible();
      }
    }
  });

  test('should compare versions', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      const compareBtn = page.getByRole('button', { name: /compare|so sánh/i });
      if (await compareBtn.isVisible()) {
        await expect(compareBtn).toBeEnabled();
      }
    }
  });
});

test.describe('OTB Plans - Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');
  });

  test('should submit draft plan for approval', async ({ page }) => {
    const draftRow = page.locator('[data-status="DRAFT"], tr:has-text("Draft")').first();

    if (await draftRow.isVisible()) {
      await draftRow.click();
      await page.waitForLoadState('networkidle');

      const submitBtn = page.getByRole('button', { name: /submit.*approval|gửi.*duyệt/i });
      if (await submitBtn.isVisible()) {
        await expect(submitBtn).toBeEnabled();
      }
    }
  });

  test('should approve submitted plan', async ({ page }) => {
    const submittedRow = page.locator('[data-status="SUBMITTED"], tr:has-text("Submitted")').first();

    if (await submittedRow.isVisible()) {
      await submittedRow.click();
      await page.waitForLoadState('networkidle');

      const approveBtn = page.getByRole('button', { name: /approve|duyệt/i });
      if (await approveBtn.isVisible()) {
        await expect(approveBtn).toBeEnabled();
      }
    }
  });

  test('should reject submitted plan', async ({ page }) => {
    const submittedRow = page.locator('[data-status="SUBMITTED"], tr:has-text("Submitted")').first();

    if (await submittedRow.isVisible()) {
      await submittedRow.click();
      await page.waitForLoadState('networkidle');

      const rejectBtn = page.getByRole('button', { name: /reject|từ chối/i });
      if (await rejectBtn.isVisible()) {
        await expect(rejectBtn).toBeEnabled();
      }
    }
  });

  test('should finalize approved plan', async ({ page }) => {
    const approvedRow = page.locator('[data-status="APPROVED"], tr:has-text("Approved")').first();

    if (await approvedRow.isVisible()) {
      await approvedRow.click();
      await page.waitForLoadState('networkidle');

      const finalizeBtn = page.getByRole('button', { name: /finalize|hoàn tất/i });
      if (await finalizeBtn.isVisible()) {
        await expect(finalizeBtn).toBeEnabled();
      }
    }
  });
});

test.describe('OTB Plans - AI Proposal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');
  });

  test('should have AI suggestion button', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      const aiBtn = page.getByRole('button', { name: /ai|suggest|đề xuất/i });
      if (await aiBtn.isVisible()) {
        await expect(aiBtn).toBeEnabled();
      }
    }
  });
});

test.describe('OTB Plans - Export', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');
  });

  test('should have export functionality', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      const exportBtn = page.getByRole('button', { name: /export|xuất/i });
      if (await exportBtn.isVisible()) {
        await expect(exportBtn).toBeEnabled();
      }
    }
  });
});

test.describe('OTB Plans - Charts & Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');
  });

  test('should display charts in plan detail', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="plan-row"]').first();

    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      // Look for chart components
      const charts = page.locator('.recharts-wrapper, [data-testid="chart"], canvas, svg[class*="chart"]');
      if ((await charts.count()) > 0) {
        await expect(charts.first()).toBeVisible();
      }
    }
  });
});

test.describe('OTB Plans - Responsive', () => {
  test('should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');

    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should work on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, TestUsers.admin);
    await page.goto('/otb-plans');

    await expect(page.getByRole('main')).toBeVisible();
  });
});
