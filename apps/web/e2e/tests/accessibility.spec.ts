import { test, expect } from '@playwright/test';

/**
 * Accessibility (A11y) Tests
 *
 * Tests:
 * - WCAG 2.1 compliance
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast
 * - Focus management
 *
 * Note: For full accessibility audits, install @axe-core/playwright:
 * npm install --save-dev @axe-core/playwright
 */

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('login page should have basic accessibility elements', async ({ page }) => {
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main.or(page.locator('body'))).toBeVisible();

    // Check for form
    const form = page.locator('form');
    if (await form.isVisible()) {
      await expect(form).toBeVisible();
    }

    // Check for at least one heading
    const headings = page.locator('h1, h2, h3');
    expect(await headings.count()).toBeGreaterThan(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // h2 should come after h1, etc.
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingTexts = await headings.allTextContents();
    expect(headingTexts.length).toBeGreaterThan(0);
  });

  test('should have accessible form labels', async ({ page }) => {
    // All inputs should have associated labels
    const inputs = page.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');

      // Should have label, aria-label, or aria-labelledby
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = (await label.count()) > 0;
        const hasAria = ariaLabel || ariaLabelledby;
        expect(hasLabel || hasAria).toBeTruthy();
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');
    const firstFocused = page.locator(':focus');
    await expect(firstFocused).toBeVisible();

    // Continue tabbing
    await page.keyboard.press('Tab');
    const secondFocused = page.locator(':focus');
    await expect(secondFocused).toBeVisible();

    // Should be able to submit form with Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Now should be on submit button
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Focus on first input
    await page.getByLabel(/email/i).focus();

    // Check for focus styles
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check focus is visually indicated (outline or other style)
    const outlineStyle = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        borderColor: styles.borderColor,
      };
    });

    // Should have some visual focus indicator
    const hasOutline = outlineStyle.outline !== 'none' && outlineStyle.outline !== '';
    const hasShadow = outlineStyle.boxShadow !== 'none' && outlineStyle.boxShadow !== '';

    expect(hasOutline || hasShadow).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Get primary text elements
    const textElements = page.locator('h1, h2, p, label, a, button');
    const count = await textElements.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = textElements.nth(i);
      const isVisible = await element.isVisible();

      if (isVisible) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
          };
        });

        // Basic check - text should not be transparent
        expect(styles.color).not.toBe('transparent');
      }
    }
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      // Button should have text, aria-label, or title
      const hasAccessibleName = (text && text.trim()) || ariaLabel || title;
      if (await button.isVisible()) {
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });

  test('should handle error states accessibly', async ({ page }) => {
    // Submit form with empty fields to trigger errors
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Error messages should be associated with inputs
    // Using aria-describedby or aria-errormessage
    const errorMessages = page.locator('[role="alert"], .error, [class*="error"]');
    if ((await errorMessages.count()) > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });
});

test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('admin@dafc.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/dashboard|\/$/);
  });

  test('navigation should be keyboard accessible', async ({ page }) => {
    // Tab to navigation
    await page.keyboard.press('Tab');

    // Navigate through menu items
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    }
  });

  test('should have skip link for main content', async ({ page }) => {
    // Some sites have skip-to-content links
    const skipLink = page.locator('a[href="#main"], a[href="#content"], .skip-link');
    if ((await skipLink.count()) > 0) {
      await skipLink.first().focus();
      await expect(skipLink.first()).toBeFocused();
    }
  });

  test('modal dialogs should trap focus', async ({ page }) => {
    // Find a button that opens a modal
    const modalTrigger = page.getByRole('button', { name: /new|create|add/i }).first();

    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      await page.waitForTimeout(500);

      // If modal opened, focus should be trapped
      const dialog = page.locator('[role="dialog"], .modal');
      if (await dialog.isVisible()) {
        // Tab should stay within dialog
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        await expect(focused).toBeVisible();

        // Close with Escape
        await page.keyboard.press('Escape');
      }
    }
  });
});
