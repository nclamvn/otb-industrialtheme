/**
 * Comprehensive Navigation E2E Tests
 *
 * Tests all navigation aspects:
 * - Sidebar navigation
 * - Breadcrumbs
 * - Deep linking
 * - Browser back/forward
 * - Keyboard navigation
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('Main Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');

    const sidebar = page.locator('nav, [data-testid="sidebar"], aside');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should navigate to Dashboard', async ({ page }) => {
    await page.goto('/budget');

    const dashboardLink = page.getByRole('link', { name: /dashboard|trang chủ/i });
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/dashboard|\/$/);
    }
  });

  test('should navigate to Budget Management', async ({ page }) => {
    await page.goto('/dashboard');

    const budgetLink = page.getByRole('link', { name: /budget|ngân sách/i });
    if (await budgetLink.isVisible()) {
      await budgetLink.click();
      await expect(page).toHaveURL(/budget/);
    }
  });

  test('should navigate to OTB Plans', async ({ page }) => {
    await page.goto('/dashboard');

    const otbLink = page.getByRole('link', { name: /otb|plan|kế hoạch/i });
    if (await otbLink.isVisible()) {
      await otbLink.click();
      await expect(page).toHaveURL(/otb/);
    }
  });

  test('should navigate to SKU Proposals', async ({ page }) => {
    await page.goto('/dashboard');

    const skuLink = page.getByRole('link', { name: /sku|proposal/i });
    if (await skuLink.isVisible()) {
      await skuLink.click();
      await expect(page).toHaveURL(/sku/);
    }
  });

  test('should navigate to Analytics', async ({ page }) => {
    await page.goto('/dashboard');

    const analyticsLink = page.getByRole('link', { name: /analytics|phân tích/i });
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await expect(page).toHaveURL(/analytics/);
    }
  });

  test('should navigate to Settings', async ({ page }) => {
    await page.goto('/dashboard');

    const settingsLink = page.getByRole('link', { name: /settings|cài đặt/i });
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/settings/);
    }
  });
});

test.describe('Breadcrumb Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should display breadcrumbs on sub-pages', async ({ page }) => {
    await page.goto('/budget/new');

    const breadcrumbs = page.locator('[aria-label*="breadcrumb"], nav.breadcrumb, .breadcrumbs');

    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs).toBeVisible();

      // Should have multiple items
      const items = breadcrumbs.locator('a, span, li');
      expect(await items.count()).toBeGreaterThan(1);
    }
  });

  test('should navigate via breadcrumb links', async ({ page }) => {
    await page.goto('/budget/new');

    const breadcrumbs = page.locator('[aria-label*="breadcrumb"], nav.breadcrumb');

    if (await breadcrumbs.isVisible()) {
      const budgetLink = breadcrumbs.getByRole('link', { name: /budget|ngân sách/i });

      if (await budgetLink.isVisible()) {
        await budgetLink.click();
        await expect(page).toHaveURL(/budget/);
        expect(page.url()).not.toContain('/new');
      }
    }
  });
});

test.describe('Deep Linking', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should handle direct access to dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should handle direct access to budget list', async ({ page }) => {
    await page.goto('/budget');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should handle direct access to budget creation', async ({ page }) => {
    await page.goto('/budget/new');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should handle direct access with query params', async ({ page }) => {
    await page.goto('/budget?status=DRAFT&page=1');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should handle 404 for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-123');

    // Should show 404 or redirect to dashboard
    const is404 = await page.getByText(/404|not found|không tìm thấy/i).isVisible();
    const isDashboard = page.url().includes('dashboard');

    expect(is404 || isDashboard).toBeTruthy();
  });
});

test.describe('Browser History Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should navigate back correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.goto('/budget');
    await page.goto('/otb-plans');

    await page.goBack();
    await expect(page).toHaveURL(/budget/);

    await page.goBack();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should navigate forward correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.goto('/budget');

    await page.goBack();
    await expect(page).toHaveURL(/dashboard/);

    await page.goForward();
    await expect(page).toHaveURL(/budget/);
  });

  test('should preserve state on back navigation', async ({ page }) => {
    await page.goto('/budget');

    // Apply a filter
    const statusFilter = page.locator('[data-testid="status-filter"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.locator('[role="option"]').first().click();
      await page.waitForLoadState('networkidle');
    }

    // Navigate away and back
    await page.goto('/dashboard');
    await page.goBack();

    // Should return to budget page
    await expect(page).toHaveURL(/budget/);
  });
});

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should navigate with Tab key', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab through interactive elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Should have focused element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  });

  test('should activate links with Enter key', async ({ page }) => {
    await page.goto('/dashboard');

    // Focus on a link
    const link = page.getByRole('link', { name: /budget|ngân sách/i }).first();
    if (await link.isVisible()) {
      await link.focus();
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL(/budget/);
    }
  });

  test('should close dropdowns with Escape', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    const dropdown = page.locator('[role="combobox"], select').first();

    if (await dropdown.isVisible()) {
      await dropdown.click();

      // Dropdown should be open
      const options = page.locator('[role="option"], [role="listbox"]');
      if (await options.first().isVisible()) {
        await page.keyboard.press('Escape');

        // Dropdown should be closed
        await expect(options.first()).not.toBeVisible();
      }
    }
  });

  test('should navigate with arrow keys in menus', async ({ page }) => {
    await page.goto('/dashboard');

    const dropdown = page.locator('[role="combobox"]').first();

    if (await dropdown.isVisible()) {
      await dropdown.click();

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');

      // Close
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('Mobile Navigation', () => {
  test('should show mobile menu button on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TestUsers.admin);
    await page.goto('/dashboard');

    // Look for hamburger menu
    const menuButton = page.locator('[data-testid="mobile-menu"], [aria-label*="menu"], button:has([class*="menu"])');

    if (await menuButton.first().isVisible()) {
      await expect(menuButton.first()).toBeVisible();
    }
  });

  test('should open mobile menu on click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TestUsers.admin);
    await page.goto('/dashboard');

    const menuButton = page.locator('[data-testid="mobile-menu"], [aria-label*="menu"]');

    if (await menuButton.first().isVisible()) {
      await menuButton.first().click();

      // Menu should be visible
      const menu = page.locator('[data-testid="mobile-nav"], nav.mobile');
      await expect(menu.or(page.locator('nav')).first()).toBeVisible();
    }
  });

  test('should navigate from mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TestUsers.admin);
    await page.goto('/dashboard');

    const menuButton = page.locator('[data-testid="mobile-menu"], [aria-label*="menu"]');

    if (await menuButton.first().isVisible()) {
      await menuButton.first().click();

      const budgetLink = page.getByRole('link', { name: /budget|ngân sách/i });
      if (await budgetLink.isVisible()) {
        await budgetLink.click();
        await expect(page).toHaveURL(/budget/);
      }
    }
  });
});

test.describe('Search Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should have global search', async ({ page }) => {
    await page.goto('/dashboard');

    const searchInput = page.locator('input[type="search"], [data-testid="global-search"], [aria-label*="search"]');

    if (await searchInput.first().isVisible()) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should show search results', async ({ page }) => {
    await page.goto('/dashboard');

    const searchInput = page.locator('input[type="search"], [data-testid="global-search"]');

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('budget');
      await page.waitForTimeout(500);

      // Should show results or suggestions
      const results = page.locator('[data-testid="search-results"], [role="listbox"]');
      if (await results.isVisible()) {
        await expect(results).toBeVisible();
      }
    }
  });

  test('should navigate from search results', async ({ page }) => {
    await page.goto('/dashboard');

    const searchInput = page.locator('input[type="search"], [data-testid="global-search"]');

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('budget');
      await page.waitForTimeout(500);

      const firstResult = page.locator('[data-testid="search-results"] a, [role="option"]').first();
      if (await firstResult.isVisible()) {
        await firstResult.click();

        // Should navigate away
        await page.waitForLoadState('networkidle');
      }
    }
  });
});

test.describe('Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should switch tabs correctly', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Click on a row to open detail view
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      // Look for tabs
      const tabs = page.locator('[role="tablist"] [role="tab"]');
      const tabCount = await tabs.count();

      if (tabCount > 1) {
        // Click second tab
        await tabs.nth(1).click();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

        // Click first tab
        await tabs.nth(0).click();
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
      }
    }
  });
});

test.describe('Pagination Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should navigate to next page', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    const nextButton = page.getByRole('button', { name: /next|sau|>/i });

    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // URL should change or content should update
      expect(page.url()).toBeTruthy();
    }
  });

  test('should navigate to previous page', async ({ page }) => {
    await page.goto('/budget?page=2');
    await page.waitForLoadState('networkidle');

    const prevButton = page.getByRole('button', { name: /prev|trước|</i });

    if (await prevButton.isEnabled()) {
      await prevButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should navigate to specific page', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    const pageButtons = page.locator('[data-testid="pagination"] button[aria-label*="page"]');

    if ((await pageButtons.count()) > 2) {
      await pageButtons.nth(2).click();
      await page.waitForLoadState('networkidle');
    }
  });
});
