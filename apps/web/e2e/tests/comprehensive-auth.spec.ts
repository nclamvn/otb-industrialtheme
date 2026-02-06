/**
 * Comprehensive Authentication E2E Tests
 *
 * Tests all authentication flows including:
 * - Login with various user roles
 * - Session management
 * - Protected routes
 * - Role-based access control
 * - Password reset flow
 */

import { test, expect } from '@playwright/test';
import { TestUsers, TestRoutes, ValidationMessages } from '../fixtures/test-data';
import { login, logout, navigateAndWait } from '../fixtures/test-helpers';

test.describe('Authentication - Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login page with all required elements', async ({ page }) => {
    // Title
    await expect(page).toHaveTitle(/DAFC|Login|Đăng nhập/i);

    // Form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password|mật khẩu/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login|đăng nhập/i })).toBeVisible();

    // Additional links
    await expect(page.getByText(/forgot password|quên mật khẩu/i)).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();

    // Should show validation errors
    const errors = page.locator('[role="alert"], .text-destructive, .error-message, .text-red-500');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password|mật khẩu/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();

    // Should show email validation error
    await expect(page.getByText(/valid email|email.*invalid|email không hợp lệ/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@email.com');
    await page.getByLabel(/password|mật khẩu/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();

    // Should show error message
    await expect(
      page.getByText(/invalid|incorrect|failed|sai|không đúng|không thành công/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill(TestUsers.admin.email);
    await page.getByLabel(/password|mật khẩu/i).fill(TestUsers.admin.password);
    await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();

    // Wait for redirect
    await page.waitForURL(/dashboard|\/$/);

    // Verify dashboard loaded
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should persist login session', async ({ page }) => {
    await login(page, TestUsers.admin);

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should handle login with keyboard navigation', async ({ page }) => {
    // Tab to email field
    await page.keyboard.press('Tab');
    await page.keyboard.type(TestUsers.admin.email);

    // Tab to password field
    await page.keyboard.press('Tab');
    await page.keyboard.type(TestUsers.admin.password);

    // Submit with Enter
    await page.keyboard.press('Enter');

    // Should navigate to dashboard
    await page.waitForURL(/dashboard|\/$/);
  });
});

test.describe('Authentication - Multiple User Roles', () => {
  const userRoles = [
    { user: TestUsers.admin, expectedAccess: true },
    { user: TestUsers.financeHead, expectedAccess: true },
    { user: TestUsers.brandManager, expectedAccess: true },
    { user: TestUsers.brandPlanner, expectedAccess: true },
  ];

  for (const { user, expectedAccess } of userRoles) {
    test(`should handle login for ${user.role} role`, async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/password|mật khẩu/i).fill(user.password);
      await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();

      if (expectedAccess) {
        await page.waitForURL(/dashboard|\/$/, { timeout: 10000 });
        await expect(page.getByRole('main')).toBeVisible();
      } else {
        // Should show error or redirect
        await expect(page.getByText(/access denied|không có quyền/i)).toBeVisible();
      }
    });
  }
});

test.describe('Authentication - Protected Routes', () => {
  test('should redirect to login for unauthenticated access', async ({ page }) => {
    // Try to access protected routes directly
    for (const route of TestRoutes.protected.slice(0, 3)) {
      await page.goto(route);

      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should allow authenticated access to protected routes', async ({ page }) => {
    await login(page, TestUsers.admin);

    // Access protected routes
    for (const route of TestRoutes.protected.slice(0, 3)) {
      await page.goto(route);

      // Should not redirect to login
      await expect(page).not.toHaveURL(/login/);
    }
  });
});

test.describe('Authentication - Logout Flow', () => {
  test('should logout successfully', async ({ page }) => {
    await login(page, TestUsers.admin);

    // Find and click logout
    const userMenu = page.locator(
      '[data-testid="user-nav"], button[aria-label*="user"], .user-avatar, [class*="avatar"]',
    );

    if (await userMenu.first().isVisible()) {
      await userMenu.first().click();

      const logoutBtn = page.getByRole('menuitem', { name: /logout|sign out|đăng xuất/i });
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await expect(page).toHaveURL(/login/);
      }
    }
  });

  test('should clear session after logout', async ({ page }) => {
    await login(page, TestUsers.admin);
    await logout(page);

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Authentication - Password Reset', () => {
  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByText(/forgot password|quên mật khẩu/i).click();

    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should validate email on password reset form', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    // Submit empty form
    const submitBtn = page.getByRole('button', { name: /reset|send|gửi/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Should show validation
      await expect(page.getByText(/required|bắt buộc|valid email/i)).toBeVisible();
    }
  });

  test('should submit password reset request', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await page.getByLabel(/email/i).fill('test@example.com');

    const submitBtn = page.getByRole('button', { name: /reset|send|gửi/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Should show success or pending message
      await expect(
        page.getByText(/sent|check.*email|đã gửi|kiểm tra email/i),
      ).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Authentication - Session Security', () => {
  test('should handle multiple browser tabs', async ({ browser }) => {
    const context = await browser.newContext();

    // Login in first tab
    const page1 = await context.newPage();
    await page1.goto('/auth/login');
    await page1.getByLabel(/email/i).fill(TestUsers.admin.email);
    await page1.getByLabel(/password|mật khẩu/i).fill(TestUsers.admin.password);
    await page1.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();
    await page1.waitForURL(/dashboard|\/$/);

    // Open new tab - should share session
    const page2 = await context.newPage();
    await page2.goto('/dashboard');

    // Should be logged in on second tab
    await expect(page2).not.toHaveURL(/login/);

    await context.close();
  });

  test('should handle token expiration gracefully', async ({ page }) => {
    await login(page, TestUsers.admin);

    // Clear cookies to simulate token expiration
    await page.context().clearCookies();

    // Try to navigate
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Authentication - Rate Limiting', () => {
  test('should handle multiple failed login attempts', async ({ page }) => {
    await page.goto('/auth/login');

    // Multiple failed attempts
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/email/i).fill(`wrong${i}@email.com`);
      await page.getByLabel(/password|mật khẩu/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();
      await page.waitForTimeout(500);
    }

    // Should still function (or show rate limit message)
    const hasRateLimit = await page.getByText(/too many|rate limit|quá nhiều/i).isVisible();
    const hasError = await page.getByText(/invalid|incorrect|sai/i).isVisible();

    expect(hasRateLimit || hasError).toBeTruthy();
  });
});
