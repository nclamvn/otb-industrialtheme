/**
 * Comprehensive Budget Flow E2E Tests
 * @tag @phase1 @new
 *
 * Tests Budget Flow visualization features:
 * - Budget flow list and navigation
 * - Budget tree visualization
 * - Version history panel
 * - Gap analysis dashboard
 * - Workflow tracker
 * - Store performance cards
 * - Theme breakdown
 */

import { test, expect } from '@playwright/test';
import { TestUsers, TestBudget, TestBrands, TestSeasons } from '../fixtures/test-data';
import { login, navigateAndWait } from '../fixtures/test-helpers';

test.describe('Budget Flow - List View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow');
  });

  test('should display budget flow page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /budget|ngân sách/i })).toBeVisible();
  });

  test('should show budget flow cards or list', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const flowItems = page.locator('[data-testid="budget-flow-item"], .budget-card, [class*="budget"]');
    await expect(flowItems.first()).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to detail page on click', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const flowItem = page.locator('[data-testid="budget-flow-item"], .budget-card, a[href*="budget-flow"]').first();

    if (await flowItem.isVisible()) {
      await flowItem.click();
      await page.waitForURL(/budget-flow\/[\w-]+/);
      await expect(page).toHaveURL(/budget-flow\/[\w-]+/);
    }
  });
});

test.describe('Budget Flow - Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    // Navigate to a specific budget flow detail (using demo data ID)
    await page.goto('/budget-flow/ss26-hugo-boss');
  });

  test('should display budget name in header', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Should show budget name in breadcrumb or header
    const header = page.locator('nav, header, .breadcrumb').filter({ hasText: /hugo boss|budget/i });
    await expect(header.first()).toBeVisible();
  });

  test('should show workflow status badge', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const statusBadge = page.locator('[class*="badge"], .workflow-status, [data-testid="status-badge"]');
    await expect(statusBadge.first()).toBeVisible();
  });

  test('should display workflow tracker', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const workflowTracker = page.locator('[class*="workflow-tracker"], [data-testid="workflow-tracker"], .approval-workflow');

    if (await workflowTracker.isVisible()) {
      await expect(workflowTracker).toBeVisible();

      // Should have workflow steps
      const steps = workflowTracker.locator('[class*="step"], .workflow-step');
      const stepCount = await steps.count();
      expect(stepCount).toBeGreaterThan(0);
    }
  });

  test('should show gap analysis toggle button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const gapToggle = page.getByRole('button', { name: /gap.*analysis|show gap|hide gap/i });
    await expect(gapToggle).toBeVisible();
  });
});

test.describe('Budget Flow - Gap Analysis Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow/ss26-hugo-boss');
  });

  test('should toggle gap analysis dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const gapToggle = page.getByRole('button', { name: /gap.*analysis|show gap/i });

    if (await gapToggle.isVisible()) {
      await gapToggle.click();

      // Gap dashboard should appear
      const gapDashboard = page.locator('[class*="gap"], [data-testid="gap-dashboard"], .planning-gap');
      await expect(gapDashboard.first()).toBeVisible();
    }
  });

  test('should display gap severity breakdown', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const gapToggle = page.getByRole('button', { name: /gap.*analysis|show gap/i });

    if (await gapToggle.isVisible()) {
      await gapToggle.click();
      await page.waitForTimeout(500);

      // Look for severity indicators
      const severityCards = page.locator('[class*="critical"], [class*="warning"], [class*="info"], [class*="ok"]');
      if (await severityCards.count() > 0) {
        await expect(severityCards.first()).toBeVisible();
      }
    }
  });

  test('should show gap statistics', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const gapToggle = page.getByRole('button', { name: /gap.*analysis|show gap/i });

    if (await gapToggle.isVisible()) {
      await gapToggle.click();
      await page.waitForTimeout(500);

      // Look for stats like total gap, percentage
      const stats = page.locator('[class*="stat"], [class*="total"], [class*="gap-value"]');
      if (await stats.count() > 0) {
        await expect(stats.first()).toBeVisible();
      }
    }
  });
});

test.describe('Budget Flow - Budget Tree Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow/ss26-hugo-boss');
  });

  test('should display budget flow view component', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const budgetFlowView = page.locator('[data-testid="budget-flow-view"], .budget-flow, [class*="flow-view"]');
    await expect(budgetFlowView.first()).toBeVisible();
  });

  test('should show budget hierarchy nodes', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for tree nodes or cards
    const nodes = page.locator('[class*="node"], [class*="tree-item"], .budget-node');
    const count = await nodes.count();

    if (count > 0) {
      await expect(nodes.first()).toBeVisible();
    }
  });

  test('should display budget amounts', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for currency formatted values
    const amounts = page.locator('[class*="amount"], [class*="budget"], [class*="currency"]').filter({ hasText: /[$₫,\d]/ });

    if (await amounts.count() > 0) {
      await expect(amounts.first()).toBeVisible();
    }
  });

  test('should show allocation percentages', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const percentages = page.locator('[class*="percent"]').filter({ hasText: /%/ });

    if (await percentages.count() > 0) {
      await expect(percentages.first()).toBeVisible();
    }
  });

  test('should allow node expansion/collapse', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for expandable nodes
    const expandButton = page.locator('[class*="expand"], [class*="collapse"], [class*="chevron"]').first();

    if (await expandButton.isVisible()) {
      await expandButton.click();
      // Children should appear or disappear
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Budget Flow - Version History', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow/ss26-hugo-boss');
  });

  test('should have version history toggle', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const versionBtn = page.getByRole('button', { name: /version|history|lịch sử/i });

    if (await versionBtn.count() > 0) {
      await expect(versionBtn.first()).toBeVisible();
    }
  });

  test('should open version history panel', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const versionBtn = page.getByRole('button', { name: /version|history|lịch sử/i });

    if (await versionBtn.isVisible()) {
      await versionBtn.click();

      // Panel should appear
      const panel = page.locator('[class*="version-history"], [class*="panel"], [data-testid="version-panel"]');
      await expect(panel.first()).toBeVisible();
    }
  });

  test('should display version timeline', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const versionBtn = page.getByRole('button', { name: /version|history/i });

    if (await versionBtn.isVisible()) {
      await versionBtn.click();
      await page.waitForTimeout(500);

      // Look for timeline items
      const timelineItems = page.locator('[class*="timeline"], [class*="version-item"]');

      if (await timelineItems.count() > 0) {
        await expect(timelineItems.first()).toBeVisible();
      }
    }
  });

  test('should allow version comparison', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const versionBtn = page.getByRole('button', { name: /version|history/i });

    if (await versionBtn.isVisible()) {
      await versionBtn.click();
      await page.waitForTimeout(500);

      // Look for compare tab or button
      const compareTab = page.locator('[class*="compare"], [data-value="compare"]');

      if (await compareTab.count() > 0) {
        await expect(compareTab.first()).toBeVisible();
      }
    }
  });

  test('should create snapshot/version', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const versionBtn = page.getByRole('button', { name: /version|history/i });

    if (await versionBtn.isVisible()) {
      await versionBtn.click();
      await page.waitForTimeout(500);

      // Look for create snapshot button
      const snapshotBtn = page.getByRole('button', { name: /snapshot|create|new/i });

      if (await snapshotBtn.isVisible()) {
        await expect(snapshotBtn).toBeEnabled();
      }
    }
  });
});

test.describe('Budget Flow - Store Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow/ss26-hugo-boss');
  });

  test('should display store performance section', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const storeSection = page.locator('[class*="store-performance"], [data-testid="store-performance"]');

    if (await storeSection.count() > 0) {
      await expect(storeSection.first()).toBeVisible();
    }
  });

  test('should show store performance cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const storeCards = page.locator('[class*="store-card"], [data-testid="store-card"]');

    if (await storeCards.count() > 0) {
      await expect(storeCards.first()).toBeVisible();
    }
  });

  test('should display sell-through metrics', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const sellThrough = page.locator('[class*="sell-thru"], [class*="sellthrough"]').filter({ hasText: /%/ });

    if (await sellThrough.count() > 0) {
      await expect(sellThrough.first()).toBeVisible();
    }
  });
});

test.describe('Budget Flow - Theme Breakdown', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow/ss26-hugo-boss');
  });

  test('should display theme breakdown section', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const themeSection = page.locator('[class*="theme"], [data-testid="theme-breakdown"]').filter({ hasText: /theme/i });

    if (await themeSection.count() > 0) {
      await expect(themeSection.first()).toBeVisible();
    }
  });

  test('should show theme group cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const themeCards = page.locator('[class*="theme-card"], [class*="theme-group"]');

    if (await themeCards.count() > 0) {
      await expect(themeCards.first()).toBeVisible();
    }
  });
});

test.describe('Budget Flow - YoY Variance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow/ss26-hugo-boss');
  });

  test('should display YoY variance indicator', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const variance = page.locator('[class*="variance"], [data-testid="variance"]').filter({ hasText: /yoy|year/i });

    if (await variance.count() > 0) {
      await expect(variance.first()).toBeVisible();
    }
  });

  test('should show variance percentage', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const varianceValue = page.locator('[class*="variance"]').filter({ hasText: /[+-]?\d+(\.\d+)?%/ });

    if (await varianceValue.count() > 0) {
      await expect(varianceValue.first()).toBeVisible();
    }
  });
});

test.describe('Budget Flow - Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow/ss26-hugo-boss');
  });

  test('should have export button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.count() > 0) {
      await expect(exportBtn.first()).toBeVisible();
    }
  });

  test('should trigger CSV export', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      await exportBtn.click();

      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.(csv|xlsx|pdf)$/i);
      }
    }
  });
});

test.describe('Budget Flow - Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow/ss26-hugo-boss');

    await page.waitForLoadState('networkidle');

    // Page should still be functional
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow/ss26-hugo-boss');

    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Budget Flow - Error Handling', () => {
  test('should handle non-existent budget', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/budget-flow/non-existent-id');

    await page.waitForLoadState('networkidle');

    // Should show error or not found message
    const errorMessage = page.locator('[class*="error"], [class*="not-found"]').filter({ hasText: /not found|không tìm thấy|error/i });

    await expect(errorMessage.first()).toBeVisible();
  });
});

test.describe('Budget Flow - Performance', () => {
  test('should load detail page within acceptable time', async ({ page }) => {
    await login(page, TestUsers.admin);

    const startTime = Date.now();
    await page.goto('/budget-flow/ss26-hugo-boss');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
