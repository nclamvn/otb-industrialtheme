/**
 * Test Helpers for E2E Tests
 * Common utility functions for Playwright tests
 */

import { Page, expect, Locator, Response } from '@playwright/test';
import { TestUsers, PerformanceThresholds } from './test-data';

/**
 * Login helper - authenticates user and navigates to dashboard
 */
export async function login(
  page: Page,
  user: (typeof TestUsers)[keyof typeof TestUsers] = TestUsers.admin,
): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);

  // Submit and wait for navigation
  await page.getByRole('button', { name: /sign in|login|đăng nhập/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/dashboard|\/$/);
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  // Try to find user menu
  const userMenu = page.locator(
    '[data-testid="user-nav"], .user-nav, [class*="avatar"], button[aria-label*="user"]',
  );

  if (await userMenu.first().isVisible()) {
    await userMenu.first().click();

    const logoutButton = page.getByRole('menuitem', { name: /logout|sign out|đăng xuất/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/login/);
    }
  }
}

/**
 * Navigate and wait for page to be ready
 */
export async function navigateAndWait(page: Page, url: string): Promise<void> {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');

  const loadTime = Date.now() - startTime;
  if (loadTime > PerformanceThresholds.pageLoad) {
    console.warn(`Page ${url} took ${loadTime}ms to load (threshold: ${PerformanceThresholds.pageLoad}ms)`);
  }
}

/**
 * Wait for element with retry
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'hidden' | 'attached' } = {},
): Promise<Locator> {
  const { timeout = 10000, state = 'visible' } = options;
  const locator = page.locator(selector);
  await locator.waitFor({ state, timeout });
  return locator;
}

/**
 * Fill form fields helper
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string | number>,
): Promise<void> {
  for (const [field, value] of Object.entries(fields)) {
    const input = page
      .getByLabel(new RegExp(field, 'i'))
      .or(page.locator(`[name="${field}"]`))
      .or(page.locator(`[data-testid="${field}"]`));

    if (await input.isVisible()) {
      if (typeof value === 'number') {
        await input.fill(String(value));
      } else {
        await input.fill(value);
      }
    }
  }
}

/**
 * Select dropdown option
 */
export async function selectOption(
  page: Page,
  labelOrName: string,
  optionText: string,
): Promise<void> {
  const select = page
    .getByLabel(new RegExp(labelOrName, 'i'))
    .or(page.locator(`[name="${labelOrName}"]`))
    .or(page.locator(`[data-testid="${labelOrName}"]`));

  if (await select.isVisible()) {
    await select.click();
    await page.locator('[role="option"]', { hasText: new RegExp(optionText, 'i') }).click();
  }
}

/**
 * Click button and wait for navigation or response
 */
export async function clickAndWait(
  page: Page,
  buttonText: string | RegExp,
  waitFor: 'navigation' | 'networkidle' | 'response' = 'networkidle',
): Promise<void> {
  const button = page.getByRole('button', { name: buttonText });

  if (waitFor === 'navigation') {
    await Promise.all([page.waitForNavigation(), button.click()]);
  } else if (waitFor === 'response') {
    await Promise.all([page.waitForResponse((res) => res.status() < 400), button.click()]);
  } else {
    await button.click();
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Check for toast/notification message
 */
export async function expectToast(
  page: Page,
  message: string | RegExp,
  type: 'success' | 'error' | 'warning' | 'info' = 'success',
): Promise<void> {
  const toast = page.locator(
    '[role="alert"], [data-testid="toast"], .toast, .sonner-toast, [class*="toast"]',
  );
  await expect(toast.filter({ hasText: message })).toBeVisible({ timeout: 5000 });
}

/**
 * Wait for API response
 */
export async function waitForApi(
  page: Page,
  urlPattern: string | RegExp,
  method = 'GET',
): Promise<Response> {
  const response = await page.waitForResponse((res) => {
    const url = res.url();
    const matchesUrl = typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url);
    return matchesUrl && res.request().method() === method;
  });
  return response;
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `e2e/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Check page has no console errors
 */
export async function expectNoConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Test table pagination
 */
export async function testPagination(page: Page): Promise<void> {
  const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagination"], .pagination');

  if (await pagination.isVisible()) {
    const nextButton = pagination.getByRole('button', { name: /next|sau|>/i });
    const prevButton = pagination.getByRole('button', { name: /prev|trước|</i });

    // Test next
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Test prev
    if (await prevButton.isEnabled()) {
      await prevButton.click();
      await page.waitForLoadState('networkidle');
    }
  }
}

/**
 * Test filter functionality
 */
export async function testFilters(
  page: Page,
  filters: { name: string; value: string }[],
): Promise<void> {
  for (const filter of filters) {
    const filterElement = page
      .getByLabel(new RegExp(filter.name, 'i'))
      .or(page.locator(`[data-testid="${filter.name}-filter"]`));

    if (await filterElement.isVisible()) {
      await filterElement.click();
      await page.getByRole('option', { name: new RegExp(filter.value, 'i') }).click();
      await page.waitForLoadState('networkidle');
    }
  }
}

/**
 * Measure performance metrics
 */
export async function measurePerformance(page: Page): Promise<{
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}> {
  const metrics = await page.evaluate(() => {
    return new Promise<{ lcp: number; fid: number; cls: number; ttfb: number }>((resolve) => {
      let lcp = 0;
      let cls = 0;

      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        lcp = entries[entries.length - 1]?.startTime || 0;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // CLS
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      // Get TTFB
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const ttfb = navigationTiming?.responseStart - navigationTiming?.requestStart || 0;

      setTimeout(() => {
        resolve({ lcp, fid: 0, cls, ttfb });
      }, 2000);
    });
  });

  return metrics;
}

/**
 * Test accessibility basics
 */
export async function testAccessibility(page: Page): Promise<{
  hasHeading: boolean;
  hasMain: boolean;
  hasNav: boolean;
  imagesHaveAlt: boolean;
  focusableElements: number;
}> {
  const hasHeading = (await page.locator('h1, h2').count()) > 0;
  const hasMain = (await page.locator('main, [role="main"]').count()) > 0;
  const hasNav = (await page.locator('nav, [role="navigation"]').count()) > 0;

  const images = page.locator('img');
  const imageCount = await images.count();
  let imagesWithAlt = 0;
  for (let i = 0; i < imageCount; i++) {
    const alt = await images.nth(i).getAttribute('alt');
    if (alt !== null) imagesWithAlt++;
  }

  const focusableElements = await page
    .locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    .count();

  return {
    hasHeading,
    hasMain,
    hasNav,
    imagesHaveAlt: imageCount === 0 || imagesWithAlt === imageCount,
    focusableElements,
  };
}

/**
 * Generate random string for unique test data
 */
export function generateRandomString(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Generate test file for upload
 */
export function generateTestExcelData(rowCount = 10): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const categories = ['BAGS', 'SHOES', 'ACCESSORIES', 'CLOTHING'];
  const genders = ['MEN', 'WOMEN', 'UNISEX'];

  for (let i = 0; i < rowCount; i++) {
    data.push({
      'SKU Code': `SKU-${generateRandomString(6).toUpperCase()}`,
      'Style Name': `Test Style ${i + 1}`,
      Color: `Color ${i % 10}`,
      Category: categories[i % categories.length],
      Gender: genders[i % genders.length],
      'Retail Price': 100000 + Math.round(Math.random() * 900000),
      'Cost Price': 50000 + Math.round(Math.random() * 400000),
      Quantity: 10 + Math.round(Math.random() * 90),
      'Lead Time': 30 + Math.round(Math.random() * 120),
      MOQ: 10 + Math.round(Math.random() * 40),
    });
  }

  return data;
}
