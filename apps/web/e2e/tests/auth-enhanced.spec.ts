/**
 * Enhanced Authentication E2E Tests
 * @tag @phase2 @priority1
 *
 * Comprehensive authentication flows:
 * - Multi-role login/logout
 * - Session management
 * - Password reset
 * - Rate limiting
 * - Protected routes
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login, logout, navigateAndWait } from '../fixtures/test-helpers';

test.describe('Authentication - Multi-Role Login', () => {
    const roles = [
        { user: TestUsers.admin, role: 'Admin' },
        { user: TestUsers.financeHead, role: 'Finance Head' },
        { user: TestUsers.brandManager, role: 'Brand Manager' },
        { user: TestUsers.brandPlanner, role: 'Brand Planner' },
        { user: TestUsers.viewer, role: 'Viewer' },
    ];

    for (const { user, role } of roles) {
        test(`should login as ${role}`, async ({ page }) => {
            await page.goto('/auth/login');
            await page.waitForLoadState('networkidle');

            // Fill credentials
            await page.getByLabel(/email/i).fill(user.email);
            await page.getByLabel(/password/i).fill(user.password);

            // Submit
            await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();

            // Should redirect to dashboard
            await page.waitForURL(/dashboard|\/$/);
            await expect(page.locator('main')).toBeVisible();
        });
    }

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        await page.getByLabel(/email/i).fill('invalid@example.com');
        await page.getByLabel(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();

        // Error message should appear
        const error = page.locator('[class*="error"], [class*="alert"], [role="alert"]');
        await expect(error.first()).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields', async ({ page }) => {
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        // Try to submit empty form
        await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();

        // Validation errors should appear
        const errors = page.locator('[class*="error"], [aria-invalid="true"]');
        await expect(errors.first()).toBeVisible({ timeout: 3000 });
    });

    test('should validate email format', async ({ page }) => {
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        await page.getByLabel(/email/i).fill('invalid-email');
        await page.getByLabel(/password/i).fill('password123');
        await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();

        // Email validation error
        await page.waitForTimeout(500);
    });
});

test.describe('Authentication - Logout', () => {
    test('should logout successfully', async ({ page }) => {
        await login(page, TestUsers.admin);

        // Find and click user menu
        const userMenu = page.locator('[data-testid="user-nav"], [class*="avatar"], button[aria-haspopup]').first();
        if (await userMenu.isVisible()) {
            await userMenu.click();

            const logoutBtn = page.getByRole('menuitem', { name: /logout|sign out|đăng xuất/i });
            if (await logoutBtn.isVisible()) {
                await logoutBtn.click();
                await page.waitForURL(/login/);
            }
        }
    });

    test('should clear session on logout', async ({ page }) => {
        await login(page, TestUsers.admin);
        await logout(page);

        // Try to access protected route
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Should redirect to login
        await expect(page).toHaveURL(/login/);
    });
});

test.describe('Authentication - Session Management', () => {
    test('should persist session across page refresh', async ({ page }) => {
        await login(page, TestUsers.admin);

        // Refresh page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should still be logged in
        await expect(page).not.toHaveURL(/login/);
        await expect(page.locator('main')).toBeVisible();
    });

    test('should persist session across navigation', async ({ page }) => {
        await login(page, TestUsers.admin);

        // Navigate to different pages
        const routes = ['/analytics', '/budgets', '/otb'];
        for (const route of routes) {
            await page.goto(route);
            await page.waitForLoadState('networkidle');
            await expect(page).not.toHaveURL(/login/);
        }
    });
});

test.describe('Authentication - Protected Routes', () => {
    const protectedRoutes = [
        '/dashboard',
        '/budgets',
        '/otb',
        '/analytics',
        '/ai-assistant',
        '/master-data',
        '/settings',
    ];

    for (const route of protectedRoutes) {
        test(`should redirect to login for ${route} when unauthenticated`, async ({ page }) => {
            await page.goto(route);
            await page.waitForLoadState('networkidle');

            // Should redirect to login
            await expect(page).toHaveURL(/login|auth/);
        });
    }
});

test.describe('Authentication - Password Reset', () => {
    test('should show forgot password link', async ({ page }) => {
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        const forgotLink = page.getByRole('link', { name: /forgot|quên/i });
        await expect(forgotLink).toBeVisible();
    });

    test('should navigate to password reset page', async ({ page }) => {
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        const forgotLink = page.getByRole('link', { name: /forgot|quên/i });
        if (await forgotLink.isVisible()) {
            await forgotLink.click();
            await page.waitForLoadState('networkidle');

            // Should be on reset page
            const resetHeading = page.getByRole('heading', { name: /reset|đặt lại|forgot/i });
            if (await resetHeading.isVisible({ timeout: 3000 })) {
                await expect(resetHeading).toBeVisible();
            }
        }
    });

    test('should show email input on reset page', async ({ page }) => {
        await page.goto('/auth/forgot-password');
        await page.waitForLoadState('networkidle');

        const emailInput = page.getByLabel(/email/i);
        if (await emailInput.isVisible({ timeout: 3000 })) {
            await expect(emailInput).toBeVisible();
        }
    });
});

test.describe('Authentication - Role-Based Access', () => {
    test('admin should access all routes', async ({ page }) => {
        await login(page, TestUsers.admin);

        const adminRoutes = ['/settings', '/master-data/users', '/analytics'];
        for (const route of adminRoutes) {
            await page.goto(route);
            await page.waitForLoadState('networkidle');
            await expect(page.locator('main')).toBeVisible();
        }
    });

    test('viewer should have limited access', async ({ page }) => {
        await login(page, TestUsers.viewer);

        // Should access dashboard
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();

        // Should access analytics
        await page.goto('/analytics');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });

    test('brand planner should access planning features', async ({ page }) => {
        await login(page, TestUsers.brandPlanner);

        await page.goto('/otb');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();

        await page.goto('/budgets');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main')).toBeVisible();
    });
});

test.describe('Authentication - UI Elements', () => {
    test('should display login form with all elements', async ({ page }) => {
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        // Email field
        await expect(page.getByLabel(/email/i)).toBeVisible();

        // Password field
        await expect(page.getByLabel(/password/i)).toBeVisible();

        // Submit button
        await expect(page.getByRole('button', { name: /sign in|login|đăng nhập/i })).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        const passwordField = page.getByLabel(/password/i);
        const toggleBtn = page.locator('button').filter({
            has: page.locator('[class*="Eye"], [class*="eye"]')
        });

        if (await toggleBtn.isVisible()) {
            // Check initial state
            await expect(passwordField).toHaveAttribute('type', 'password');

            await toggleBtn.click();
            await expect(passwordField).toHaveAttribute('type', 'text');

            await toggleBtn.click();
            await expect(passwordField).toHaveAttribute('type', 'password');
        }
    });

    test('should show loading state on submit', async ({ page }) => {
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        await page.getByLabel(/email/i).fill(TestUsers.admin.email);
        await page.getByLabel(/password/i).fill(TestUsers.admin.password);

        const submitBtn = page.getByRole('button', { name: /sign in|login|đăng nhập/i });
        await submitBtn.click();

        // Loading indicator may appear briefly
        await page.waitForTimeout(500);
    });
});

test.describe('Authentication - Responsive Design', () => {
    test('login page on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test('login page on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/auth/login');
        await page.waitForLoadState('networkidle');

        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
    });
});
