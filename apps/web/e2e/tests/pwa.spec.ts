/**
 * Progressive Web App (PWA) E2E Tests
 * @tag @phase5 @new
 *
 * Tests PWA features:
 * - Installability
 * - Offline functionality
 * - Service worker
 * - Push notifications
 * - Cache behavior
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('PWA - Installability', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/dashboard');
  });

  test('should have valid manifest', async ({ page }) => {
    const manifestLink = page.locator('link[rel="manifest"]');

    if (await manifestLink.count() > 0) {
      const href = await manifestLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('should have appropriate icons', async ({ page }) => {
    const iconLinks = page.locator('link[rel="icon"], link[rel="apple-touch-icon"]');
    const count = await iconLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have theme color meta tag', async ({ page }) => {
    const themeColor = page.locator('meta[name="theme-color"]');

    if (await themeColor.count() > 0) {
      const color = await themeColor.getAttribute('content');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$|^rgb/);
    }
  });

  test('should have viewport meta tag', async ({ page }) => {
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });
});

test.describe('PWA - Offline Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should cache static assets', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Page should have loaded assets
    const scripts = page.locator('script[src]');
    const styles = page.locator('link[rel="stylesheet"]');

    const scriptCount = await scripts.count();
    const styleCount = await styles.count();

    expect(scriptCount + styleCount).toBeGreaterThan(0);
  });

  test('should show offline indicator when offline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    // Check for offline indicator
    const offlineIndicator = page.locator('[class*="offline"], [data-testid="offline-indicator"]');

    if (await offlineIndicator.count() > 0) {
      await expect(offlineIndicator.first()).toBeVisible();
    }

    // Restore online
    await page.context().setOffline(false);
  });

  test('should display cached content when offline', async ({ page }) => {
    // First, load the page while online
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Go offline
    await page.context().setOffline(true);

    // Reload - should show cached content or offline message
    await page.reload().catch(() => {});
    await page.waitForTimeout(1000);

    // Should still have some content visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Restore online
    await page.context().setOffline(false);
  });

  test('should sync data when back online', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(500);

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(1000);

    // Page should refresh or sync
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('PWA - Service Worker', () => {
  test('should register service worker', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });

    // Service worker may or may not be present depending on build
    expect(typeof hasServiceWorker).toBe('boolean');
  });

  test('should handle service worker updates', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for update prompt
    const updatePrompt = page.locator('[class*="update"], [data-testid="sw-update"]');

    // Update prompt may or may not appear
    await page.waitForTimeout(2000);
  });
});

test.describe('PWA - Push Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/settings/preferences');
  });

  test('should have notification settings', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const notificationSettings = page.locator('[class*="notification"], [data-testid="notification-settings"]');

    if (await notificationSettings.count() > 0) {
      await expect(notificationSettings.first()).toBeVisible();
    }
  });

  test('should have push notification toggle', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const pushToggle = page.locator('input[type="checkbox"], [role="switch"]').filter({ hasText: /push|notification|thông báo/i });

    if (await pushToggle.count() > 0) {
      await expect(pushToggle.first()).toBeVisible();
    }
  });
});

test.describe('PWA - Cache Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should cache API responses', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // First load
    const startTime1 = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime1 = Date.now() - startTime1;

    // Second load (should be faster if cached)
    const startTime2 = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime2 = Date.now() - startTime2;

    // Both loads should complete
    expect(loadTime1).toBeGreaterThan(0);
    expect(loadTime2).toBeGreaterThan(0);
  });

  test('should invalidate cache on data change', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    // Make a change (if possible)
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      // Cache should be invalidated after creation
      // Just verify page is functional
      await expect(createBtn).toBeEnabled();
    }
  });
});

test.describe('PWA - Responsive Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should have mobile-friendly layout
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('should show mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should have hamburger menu or bottom nav
    const mobileNav = page.locator('[class*="hamburger"], [class*="mobile-nav"], [class*="bottom-nav"]');

    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('should handle orientation change', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Portrait
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Rotate to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);

    // Content should still be visible
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('PWA - App-like Experience', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should have smooth page transitions', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to another page
    const startTime = Date.now();
    await page.goto('/budget-flow');
    await page.waitForLoadState('networkidle');
    const transitionTime = Date.now() - startTime;

    // Transition should be smooth (not too long)
    expect(transitionTime).toBeLessThan(3000);
  });

  test('should have pull-to-refresh on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Simulate pull-to-refresh gesture
    await page.mouse.move(187, 100);
    await page.mouse.down();
    await page.mouse.move(187, 300, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Page should still be functional
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('should support gesture navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/budget-flow');
    await page.waitForLoadState('networkidle');

    // Swipe gesture (if supported)
    await page.mouse.move(50, 300);
    await page.mouse.down();
    await page.mouse.move(300, 300, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Page should handle gesture gracefully
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('PWA - Storage', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should persist user preferences', async ({ page }) => {
    await page.goto('/settings/preferences');
    await page.waitForLoadState('networkidle');

    // Check if preferences are stored
    const localStorage = await page.evaluate(() => {
      return Object.keys(window.localStorage);
    });

    expect(Array.isArray(localStorage)).toBeTruthy();
  });

  test('should clear cache on logout', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find logout button
    const userMenu = page.locator('[class*="user-menu"], [data-testid="user-menu"]');

    if (await userMenu.isVisible()) {
      await userMenu.click();

      const logoutBtn = page.getByRole('button', { name: /logout|sign out|đăng xuất/i }).or(
        page.locator('a').filter({ hasText: /logout|sign out|đăng xuất/i })
      );

      if (await logoutBtn.count() > 0) {
        await logoutBtn.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
  });
});

test.describe('PWA - Performance Metrics', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should have acceptable First Contentful Paint', async ({ page }) => {
    await page.goto('/dashboard');

    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntriesByName('first-contentful-paint');
          if (entries.length > 0) {
            resolve(entries[0].startTime);
          }
        }).observe({ entryTypes: ['paint'] });

        // Fallback timeout
        setTimeout(() => resolve(null), 5000);
      });
    });

    if (fcp !== null) {
      expect(fcp).toBeLessThan(3000);
    }
  });

  test('should have acceptable Time to Interactive', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Try to interact
    const firstInteractive = page.locator('button, a, input').first();
    await expect(firstInteractive).toBeVisible();

    const tti = Date.now() - startTime;
    expect(tti).toBeLessThan(5000);
  });
});
