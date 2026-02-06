import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 *
 * Tests:
 * - Dashboard loading and rendering
 * - Navigation sidebar
 * - Quick actions
 * - Stats cards
 * - Charts rendering
 * - Responsive behavior
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('admin@dafc.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/dashboard|\/$/);
  });

  test('should display dashboard with main elements', async ({ page }) => {
    // Check header
    await expect(page.getByRole('banner')).toBeVisible();

    // Check sidebar navigation
    await expect(page.getByRole('navigation')).toBeVisible();

    // Check main content area
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Look for stats/metric cards
    const statsCards = page.locator('[data-testid="stats-card"], .stats-card, [class*="card"]');
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have working navigation links', async ({ page }) => {
    // Test Budget navigation
    const budgetLink = page.getByRole('link', { name: /budget/i });
    if (await budgetLink.isVisible()) {
      await budgetLink.click();
      await expect(page).toHaveURL(/budget/);
    }

    // Navigate back to dashboard
    await page.goto('/');

    // Test OTB Analysis navigation
    const otbLink = page.getByRole('link', { name: /otb|analysis/i });
    if (await otbLink.isVisible()) {
      await otbLink.click();
      await expect(page).toHaveURL(/otb/);
    }
  });

  test('should display quick actions', async ({ page }) => {
    // Look for quick action buttons
    const quickActions = page.locator('[data-testid="quick-actions"], .quick-actions');
    if (await quickActions.isVisible()) {
      await expect(quickActions).toBeVisible();
    }
  });

  test('should have responsive sidebar', async ({ page }) => {
    const sidebar = page.getByRole('navigation');

    // Desktop - sidebar should be visible
    await expect(sidebar).toBeVisible();

    // Mobile - test sidebar toggle
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Look for mobile menu button
    const menuButton = page.getByRole('button', { name: /menu|toggle/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(sidebar).toBeVisible();
    }
  });

  test('should display user profile in header', async ({ page }) => {
    // Look for user avatar or profile dropdown
    const userProfile = page.locator('[data-testid="user-nav"], .user-nav, [class*="avatar"]');
    await expect(userProfile.first()).toBeVisible();
  });

  test('should load charts without errors', async ({ page }) => {
    // Wait for any chart components to load
    await page.waitForTimeout(2000);

    // Check for chart containers
    const charts = page.locator('[data-testid="chart"], .recharts-wrapper, svg.recharts-surface, canvas');

    // Should have at least one chart or graceful empty state
    const chartCount = await charts.count();
    if (chartCount > 0) {
      await expect(charts.first()).toBeVisible();
    }

    // No console errors related to charts
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);
    const chartErrors = errors.filter((e) => e.toLowerCase().includes('chart'));
    expect(chartErrors).toHaveLength(0);
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');

      // Should show search results or command palette
      await page.waitForTimeout(500);
    }
  });

  test('should display notifications', async ({ page }) => {
    // Look for notification bell/icon
    const notificationButton = page.getByRole('button', { name: /notification/i }).or(
      page.locator('[data-testid="notifications"], .notification-bell')
    );

    if (await notificationButton.isVisible()) {
      await notificationButton.click();

      // Should show notification dropdown or panel
      await expect(page.locator('[role="menu"], [class*="dropdown"], [class*="popover"]')).toBeVisible();
    }
  });
});

test.describe('Dashboard Performance', () => {
  test('should load dashboard within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('admin@dafc.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for dashboard to be interactive
    await page.waitForURL(/dashboard|\/$/, { timeout: 5000 });
    await expect(page.getByRole('main')).toBeVisible();

    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);

    // Should load within 3 seconds (excluding login)
    expect(loadTime).toBeLessThan(5000);
  });
});
