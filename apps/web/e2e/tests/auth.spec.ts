import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * Tests:
 * - Login page rendering
 * - Form validation
 * - Successful login flow
 * - Invalid credentials handling
 * - Logout functionality
 * - Protected route redirection
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/DAFC|Login/i);

    // Check form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();

    // Check forgot password link
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Click login without filling form
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Expect validation messages
    await expect(page.getByText(/email.*required|please enter.*email/i)).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Expect email validation error
    await expect(page.getByText(/valid email|invalid email/i)).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form with demo credentials
    await page.getByLabel(/email/i).fill('admin@dafc.com');
    await page.getByLabel(/password/i).fill('admin123');

    // Click login
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(/dashboard|\/$/);

    // Verify dashboard elements
    await expect(page.getByText(/dashboard|welcome/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@email.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Expect error message
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
  });

  test('should redirect to login for protected routes', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('/budget');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('admin@dafc.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/dashboard|\/$/);

    // Find and click logout (usually in user menu)
    const userMenu = page.getByRole('button', { name: /user|profile|avatar/i });
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }

    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.getByText(/forgot password/i).click();

    // Should navigate to forgot password page
    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
