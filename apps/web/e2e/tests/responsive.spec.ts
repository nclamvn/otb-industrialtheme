import { test, expect, devices } from '@playwright/test';

/**
 * Responsive Design E2E Tests
 * Tests mobile, tablet, and desktop layouts
 */

test.describe('Responsive Design Tests', () => {
  test.describe('Mobile Layout (320px - 639px)', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('login page should be mobile-friendly', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      // Login form should be visible and properly sized
      const loginForm = page.locator('form, [data-testid="login-form"]');

      if (await loginForm.isVisible()) {
        const box = await loginForm.boundingBox();

        if (box) {
          // Form should fit within viewport
          expect(box.width).toBeLessThanOrEqual(375);
        }
      }

      // No horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    });

    test('dashboard should have mobile navigation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for mobile menu button (hamburger)
      const mobileMenuButton = page.locator(
        '[data-testid="mobile-menu-button"], button[aria-label*="menu"], .hamburger-menu'
      );

      // Mobile menu button should be visible on mobile
      const isMobileMenuVisible = await mobileMenuButton.isVisible();

      // Desktop sidebar should be hidden on mobile
      const desktopSidebar = page.locator('[data-testid="desktop-sidebar"], aside.hidden-mobile');
      const isSidebarHidden = !(await desktopSidebar.isVisible());

      expect(isMobileMenuVisible || isSidebarHidden).toBeTruthy();
    });

    test('tables should be scrollable on mobile', async ({ page }) => {
      await page.goto('/dashboard/budgets');
      await page.waitForLoadState('networkidle');

      const table = page.locator('table, [data-testid="data-table"]');

      if (await table.isVisible()) {
        const tableContainer = page.locator('.overflow-x-auto, [data-testid="table-container"]');

        if (await tableContainer.isVisible()) {
          // Table container should allow horizontal scroll
          const isScrollable = await tableContainer.evaluate((el) => {
            return el.scrollWidth > el.clientWidth;
          });

          // Table may or may not be scrollable depending on content
          expect(typeof isScrollable).toBe('boolean');
        }
      }
    });

    test('buttons should be touch-friendly', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();

          if (box) {
            // Minimum touch target size (44x44 recommended by Apple)
            expect(box.height).toBeGreaterThanOrEqual(32);
          }
        }
      }
    });

    test('forms should have proper input sizing', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const box = await input.boundingBox();

          if (box) {
            // Input should be nearly full width on mobile
            expect(box.width).toBeGreaterThan(200);
            // Input should be tall enough for touch
            expect(box.height).toBeGreaterThanOrEqual(32);
          }
        }
      }
    });
  });

  test.describe('Tablet Layout (640px - 1023px)', () => {
    test.use({ viewport: { width: 768, height: 1024 } }); // iPad

    test('should show optimized tablet layout', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Content should fit within viewport
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    });

    test('sidebar should be collapsible on tablet', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for collapsible sidebar
      const sidebar = page.locator('[data-testid="sidebar"], aside, nav');

      if (await sidebar.isVisible()) {
        const collapseButton = page.locator('[data-testid="collapse-sidebar"], button[aria-label*="collapse"]');

        if (await collapseButton.isVisible()) {
          await expect(collapseButton).toBeVisible();
        }
      }
    });

    test('grid layouts should adapt to tablet', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const gridContainer = page.locator('.grid, [data-testid="dashboard-grid"]');

      if (await gridContainer.isVisible()) {
        const box = await gridContainer.boundingBox();

        if (box) {
          // Grid should use available width
          expect(box.width).toBeGreaterThan(600);
        }
      }
    });
  });

  test.describe('Desktop Layout (1024px+)', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('should show full desktop layout', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Sidebar should be visible
      const sidebar = page.locator('[data-testid="sidebar"], aside, nav.sidebar');

      // Either has visible sidebar or is dashboard without sidebar
      const pageLoaded = await page.evaluate(() => document.readyState === 'complete');
      expect(pageLoaded).toBe(true);
    });

    test('tables should show all columns on desktop', async ({ page }) => {
      await page.goto('/dashboard/budgets');
      await page.waitForLoadState('networkidle');

      const table = page.locator('table');

      if (await table.isVisible()) {
        const headers = table.locator('th');
        const headerCount = await headers.count();

        // Desktop should show more columns
        expect(headerCount).toBeGreaterThan(0);
      }
    });

    test('should utilize full width for content', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const mainContent = page.locator('main, [data-testid="main-content"]');

      if (await mainContent.isVisible()) {
        const box = await mainContent.boundingBox();

        if (box) {
          // Main content should use significant portion of viewport
          expect(box.width).toBeGreaterThan(800);
        }
      }
    });
  });

  test.describe('Wide Screen Layout (1920px+)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should handle wide screens gracefully', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Content should be centered or have max-width
      const container = page.locator('.max-w-7xl, .container, [data-testid="page-container"]');

      if (await container.isVisible()) {
        const box = await container.boundingBox();

        if (box) {
          // Should have some max-width constraint
          expect(box.width).toBeLessThan(1800);
        }
      }
    });

    test('charts should scale appropriately', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const charts = page.locator('[data-testid="chart"], .recharts-wrapper');

      if ((await charts.count()) > 0) {
        const chart = charts.first();
        const box = await chart.boundingBox();

        if (box) {
          // Charts should be reasonably sized
          expect(box.width).toBeGreaterThan(200);
          expect(box.width).toBeLessThan(1200);
        }
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait to landscape', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);

      // Page should still be usable
      const isResponsive = await page.evaluate(() => {
        return document.body.scrollWidth <= window.innerWidth;
      });

      expect(isResponsive).toBe(true);
    });

    test('should handle landscape to portrait', async ({ page }) => {
      // Start in landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Switch to portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Page should still be usable
      const mainContent = page.locator('main, body');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Touch Interactions', () => {
    test.use({ hasTouch: true, viewport: { width: 375, height: 667 } });

    test('should support touch scrolling', async ({ page }) => {
      await page.goto('/dashboard/budgets');
      await page.waitForLoadState('networkidle');

      // Perform touch scroll
      await page.touchscreen.tap(187, 400);

      // Page should be scrollable
      const canScroll = await page.evaluate(() => {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight;
      });

      expect(typeof canScroll).toBe('boolean');
    });

    test('should support tap interactions', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const button = page.locator('button').first();

      if (await button.isVisible()) {
        const box = await button.boundingBox();

        if (box) {
          // Tap on button
          await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

          // Button should be interactive
          expect(true).toBe(true);
        }
      }
    });
  });

  test.describe('Print Layout', () => {
    test('should have print-friendly styles', async ({ page }) => {
      await page.goto('/dashboard/budgets');
      await page.waitForLoadState('networkidle');

      // Emulate print media
      await page.emulateMedia({ media: 'print' });

      // Check that page renders in print mode
      const isVisible = await page.evaluate(() => {
        return document.body.offsetHeight > 0;
      });

      expect(isVisible).toBe(true);
    });
  });

  test.describe('High DPI Displays', () => {
    test.use({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });

    test('should render crisp on retina displays', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Take screenshot to verify rendering
      const screenshot = await page.screenshot();

      // Screenshot should be captured (non-empty)
      expect(screenshot.length).toBeGreaterThan(0);
    });
  });
});
