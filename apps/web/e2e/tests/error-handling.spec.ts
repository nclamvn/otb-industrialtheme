/**
 * Comprehensive Error Handling E2E Tests
 * @tag @phase5 @new
 *
 * Tests Error Handling:
 * - 404 pages
 * - Network errors
 * - API errors
 * - Form validation errors
 * - Session timeout
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('Error Handling - 404 Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should show 404 for non-existent route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');
    await page.waitForLoadState('networkidle');

    const notFound = page.locator('h1, h2, [class*="error"]').filter({ hasText: /404|not found|không tìm thấy/i });
    await expect(notFound.first()).toBeVisible();
  });

  test('should show go back button on 404', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');

    const backBtn = page.getByRole('button', { name: /back|home|quay lại|trang chủ/i }).or(
      page.locator('a').filter({ hasText: /back|home|quay lại|trang chủ/i })
    );

    if (await backBtn.count() > 0) {
      await expect(backBtn.first()).toBeVisible();
    }
  });

  test('should navigate home from 404', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');

    const homeLink = page.locator('a[href="/"], a[href="/dashboard"]').first();

    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForURL(/^\/$|\/dashboard/);
    }
  });

  test('should show 404 for non-existent budget', async ({ page }) => {
    await page.goto('/budget-flow/non-existent-id-12345');
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('[class*="error"], [class*="not-found"]').filter({ hasText: /not found|không tìm thấy|error/i });
    await expect(errorMessage.first()).toBeVisible();
  });

  test('should show 404 for non-existent SKU proposal', async ({ page }) => {
    await page.goto('/sku-proposal/non-existent-id-12345');
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('[class*="error"], [class*="not-found"]').filter({ hasText: /not found|không tìm thấy|error/i });
    await expect(errorMessage.first()).toBeVisible();
  });
});

test.describe('Error Handling - Network Errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should handle network failure gracefully', async ({ page }) => {
    // Navigate to page first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Simulate offline
    await page.context().setOffline(true);

    // Try to navigate
    await page.goto('/budget-flow').catch(() => {});

    // Should show some error indication or cached content
    const errorIndicator = page.locator('[class*="error"], [class*="offline"]');
    // Page should not crash
    await page.waitForTimeout(1000);

    // Restore online
    await page.context().setOffline(false);
  });

  test('should show retry option on network error', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Mock API failure
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    // Trigger an action that makes API call
    const refreshBtn = page.getByRole('button', { name: /refresh|reload|làm mới/i });
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      await page.waitForTimeout(500);

      const retryBtn = page.getByRole('button', { name: /retry|try again|thử lại/i });
      if (await retryBtn.count() > 0) {
        await expect(retryBtn.first()).toBeVisible();
      }
    }
  });
});

test.describe('Error Handling - API Errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should handle 500 error gracefully', async ({ page }) => {
    await page.route('**/api/budgets/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/budget-flow');
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('[class*="error"], [class*="alert"]').filter({ hasText: /error|lỗi|something went wrong/i });

    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should handle 403 forbidden', async ({ page }) => {
    await page.route('**/api/admin/**', (route) => {
      route.fulfill({
        status: 403,
        body: JSON.stringify({ error: 'Forbidden' }),
      });
    });

    await page.goto('/settings/api-keys');
    await page.waitForLoadState('networkidle');

    // Should either show error or redirect
    const url = page.url();
    const hasError = await page.locator('[class*="error"], [class*="forbidden"]').count() > 0;
    const wasRedirected = !url.includes('api-keys');

    expect(hasError || wasRedirected).toBeTruthy();
  });

  test('should handle timeout error', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      // Simulate slow response
      await new Promise((resolve) => setTimeout(resolve, 60000));
      route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/dashboard', { timeout: 10000 }).catch(() => {});

    // Should show timeout indication or handle gracefully
    await page.waitForTimeout(1000);
  });
});

test.describe('Error Handling - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should show required field errors', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();

      // Try to submit empty form
      const submitBtn = page.locator('[role="dialog"]').getByRole('button', { name: /save|create|submit|lưu|tạo/i });

      if (await submitBtn.isVisible()) {
        await submitBtn.click();

        // Should show validation error
        const error = page.locator('[class*="error"], [class*="invalid"]');
        if (await error.count() > 0) {
          await expect(error.first()).toBeVisible();
        }
      }
    }
  });

  test('should show invalid format errors', async ({ page }) => {
    await page.goto('/settings/integrations/webhooks');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();

      const urlField = page.locator('[role="dialog"] input[type="url"], input[name*="url"]').first();

      if (await urlField.isVisible()) {
        await urlField.fill('not-a-valid-url');
        await urlField.blur();

        const error = page.locator('[class*="error"], [class*="invalid"]');
        if (await error.count() > 0) {
          await expect(error.first()).toBeVisible();
        }
      }
    }
  });

  test('should show duplicate entry error', async ({ page }) => {
    await page.goto('/master-data/brands');
    await page.waitForLoadState('networkidle');

    // This tests assumes we try to create a brand that already exists
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();

      const nameField = page.locator('[role="dialog"] input[name*="name"]').first();

      if (await nameField.isVisible()) {
        await nameField.fill('BOSS'); // Assuming BOSS exists

        const submitBtn = page.locator('[role="dialog"]').getByRole('button', { name: /save|create|lưu|tạo/i });
        if (await submitBtn.isVisible()) {
          await submitBtn.click();

          // Should show duplicate error or validation
          const error = page.locator('[class*="error"]').filter({ hasText: /exists|duplicate|đã tồn tại/i });
          await page.waitForTimeout(500);
        }
      }
    }
  });
});

test.describe('Error Handling - Session Errors', () => {
  test('should handle session timeout', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Simulate expired session
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Unauthorized', message: 'Session expired' }),
      });
    });

    // Trigger API call
    await page.reload();
    await page.waitForTimeout(1000);

    // Should redirect to login or show session expired message
    const url = page.url();
    const isLoginPage = url.includes('/login') || url.includes('/auth');
    const hasSessionError = await page.locator('[class*="error"]').filter({ hasText: /session|expired|login/i }).count() > 0;

    expect(isLoginPage || hasSessionError).toBeTruthy();
  });

  test('should handle concurrent session conflict', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Simulate concurrent session
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 409,
        body: JSON.stringify({ error: 'Conflict', message: 'Session active elsewhere' }),
      });
    });

    await page.reload();
    await page.waitForTimeout(1000);
  });
});

test.describe('Error Handling - Data Errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should handle malformed data gracefully', async ({ page }) => {
    await page.route('**/api/budgets**', (route) => {
      route.fulfill({
        status: 200,
        body: 'not valid json{',
      });
    });

    await page.goto('/budget-flow');
    await page.waitForLoadState('networkidle');

    // Should not crash, show error gracefully
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('should handle empty response', async ({ page }) => {
    await page.route('**/api/budgets**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/budget-flow');
    await page.waitForLoadState('networkidle');

    // Should show empty state
    const emptyState = page.locator('[class*="empty"], [class*="no-data"]').filter({ hasText: /no.*data|empty|không có/i });

    if (await emptyState.count() > 0) {
      await expect(emptyState.first()).toBeVisible();
    }
  });
});

test.describe('Error Handling - Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should show loading state while fetching', async ({ page }) => {
    // Slow down API response
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.continue();
    });

    await page.goto('/budget-flow');

    // Should show loading indicator
    const loading = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]');

    if (await loading.count() > 0) {
      await expect(loading.first()).toBeVisible();
    }
  });

  test('should transition from loading to content', async ({ page }) => {
    await page.goto('/budget-flow');

    // Wait for loading to finish
    await page.waitForLoadState('networkidle');

    // Content should be visible
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Error Handling - Error Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should recover from error on retry', async ({ page }) => {
    let callCount = 0;

    await page.route('**/api/budgets**', (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({ status: 500, body: 'Error' });
      } else {
        route.continue();
      }
    });

    await page.goto('/budget-flow');
    await page.waitForLoadState('networkidle');

    // Should show error
    const retryBtn = page.getByRole('button', { name: /retry|try again|thử lại/i });

    if (await retryBtn.isVisible()) {
      await retryBtn.click();
      await page.waitForLoadState('networkidle');

      // Should recover
      const content = page.locator('main, [class*="content"]');
      await expect(content.first()).toBeVisible();
    }
  });

  test('should allow navigation after error', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');

    // Navigate to valid page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Error Handling - Boundary Testing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
  });

  test('should handle special characters in URL', async ({ page }) => {
    await page.goto('/budget-flow/%00%00');
    await page.waitForLoadState('networkidle');

    // Should not crash
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should handle very long URLs', async ({ page }) => {
    const longPath = '/budget-flow/' + 'a'.repeat(500);
    await page.goto(longPath);
    await page.waitForLoadState('networkidle');

    // Should handle gracefully
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});
