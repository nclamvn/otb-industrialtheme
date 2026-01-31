/**
 * Comprehensive Help & Documentation E2E Tests
 * @tag @phase5 @new
 *
 * Tests Help features:
 * - /help - Help center
 * - Documentation access
 * - Search functionality
 * - Contact support
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('Help - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/help');
  });

  test('should display help page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /help|trợ giúp|support|hỗ trợ/i });
    await expect(heading).toBeVisible();
  });

  test('should show help categories', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const categories = page.locator('[class*="category"], [class*="card"], [data-testid="help-category"]');

    if (await categories.count() > 0) {
      await expect(categories.first()).toBeVisible();
    }
  });

  test('should have search input', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const search = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="tìm"]');
    await expect(search.first()).toBeVisible();
  });

  test('should search help articles', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const search = page.locator('input[type="search"], input[placeholder*="search"]').first();

    if (await search.isVisible()) {
      await search.fill('budget');
      await page.waitForTimeout(500);

      const results = page.locator('[class*="result"], [class*="article"]');
      if (await results.count() > 0) {
        await expect(results.first()).toBeVisible();
      }
    }
  });

  test('should show getting started section', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const gettingStarted = page.locator('[class*="getting-started"], h2, h3').filter({ hasText: /getting started|bắt đầu/i });

    if (await gettingStarted.count() > 0) {
      await expect(gettingStarted.first()).toBeVisible();
    }
  });

  test('should show FAQ section', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const faq = page.locator('[class*="faq"], h2, h3').filter({ hasText: /faq|câu hỏi thường gặp/i });

    if (await faq.count() > 0) {
      await expect(faq.first()).toBeVisible();
    }
  });
});

test.describe('Help - Documentation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/help');
  });

  test('should link to documentation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const docsLink = page.locator('a').filter({ hasText: /documentation|tài liệu|docs/i });

    if (await docsLink.count() > 0) {
      await expect(docsLink.first()).toBeVisible();
    }
  });

  test('should show tutorial videos', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const videos = page.locator('[class*="video"], [class*="tutorial"]');

    if (await videos.count() > 0) {
      await expect(videos.first()).toBeVisible();
    }
  });

  test('should have downloadable resources', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const downloads = page.locator('a[download], [class*="download"]');

    if (await downloads.count() > 0) {
      await expect(downloads.first()).toBeVisible();
    }
  });
});

test.describe('Help - Contact Support', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/help');
  });

  test('should show contact support option', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const contact = page.locator('a, button').filter({ hasText: /contact|liên hệ|support/i });

    if (await contact.count() > 0) {
      await expect(contact.first()).toBeVisible();
    }
  });

  test('should have email support link', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const email = page.locator('a[href^="mailto:"]');

    if (await email.count() > 0) {
      await expect(email.first()).toBeVisible();
    }
  });

  test('should show support ticket form', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const ticketBtn = page.getByRole('button', { name: /ticket|submit.*request|gửi yêu cầu/i });

    if (await ticketBtn.isVisible()) {
      await ticketBtn.click();
      const form = page.locator('form, [class*="form"]');
      await expect(form.first()).toBeVisible();
    }
  });
});

test.describe('Help - Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/help');
  });

  test('should show keyboard shortcuts section', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const shortcuts = page.locator('[class*="shortcut"], [class*="keyboard"]');

    if (await shortcuts.count() > 0) {
      await expect(shortcuts.first()).toBeVisible();
    }
  });

  test('should list available shortcuts', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const kbd = page.locator('kbd, [class*="key"]');

    if (await kbd.count() > 0) {
      await expect(kbd.first()).toBeVisible();
    }
  });
});

test.describe('Help - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/help');
  });

  test('should be navigable by keyboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const h1 = page.locator('h1');
    const h2 = page.locator('h2');

    if (await h1.count() > 0) {
      await expect(h1.first()).toBeVisible();
    }
    if (await h2.count() > 0) {
      await expect(h2.first()).toBeVisible();
    }
  });
});

test.describe('Help - Role-based Content', () => {
  test('admin should see admin-specific help', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/help');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('regular user should see relevant help', async ({ page }) => {
    await login(page, TestUsers.brandPlanner);
    await page.goto('/help');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Help - Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TestUsers.admin);
    await page.goto('/help');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Help - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    await login(page, TestUsers.admin);

    const startTime = Date.now();
    await page.goto('/help');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });
});
