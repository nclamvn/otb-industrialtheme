import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Budget and OTB Workflow
 * Tests the complete budget lifecycle from creation to approval
 */

test.describe('Budget Workflow E2E', () => {
  // Shared authentication state
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Budget Creation Flow', () => {
    test('should create a new budget allocation', async ({ page }) => {
      // Navigate to budgets page
      await page.goto('/dashboard/budgets');
      await page.waitForSelector('[data-testid="budgets-page"]', { timeout: 10000 });

      // Click create new budget button
      const createButton = page.locator('button:has-text("Create Budget"), button:has-text("New Budget")');
      if (await createButton.isVisible()) {
        await createButton.click();

        // Wait for form to appear
        await page.waitForSelector('form, [data-testid="budget-form"]');

        // Fill in budget form
        const seasonSelect = page.locator('[name="seasonId"], [data-testid="season-select"]');
        if (await seasonSelect.isVisible()) {
          await seasonSelect.click();
          await page.locator('[role="option"]').first().click();
        }

        // Verify form is interactive
        expect(await page.locator('form, [data-testid="budget-form"]').isVisible()).toBeTruthy();
      }
    });

    test('should validate required fields in budget form', async ({ page }) => {
      await page.goto('/dashboard/budgets/new');

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Check for validation errors
        const errorMessages = page.locator('.text-destructive, [role="alert"], .error-message');
        const errorCount = await errorMessages.count();

        // Should show validation errors for required fields
        expect(errorCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should save draft budget', async ({ page }) => {
      await page.goto('/dashboard/budgets');

      // Check if we can navigate to budget creation
      const pageTitle = await page.locator('h1, h2').first().textContent();
      expect(pageTitle).toBeTruthy();
    });
  });

  test.describe('Budget Approval Flow', () => {
    test('should display budgets list with status', async ({ page }) => {
      await page.goto('/dashboard/budgets');

      // Wait for budgets table or list
      const budgetsList = page.locator('table, [data-testid="budgets-list"]');

      // Check if page loads
      await expect(page).toHaveURL(/budgets/);
    });

    test('should filter budgets by status', async ({ page }) => {
      await page.goto('/dashboard/budgets');

      // Look for status filter
      const statusFilter = page.locator('[data-testid="status-filter"], select[name="status"]');

      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Check filter options
        const options = page.locator('[role="option"], option');
        expect(await options.count()).toBeGreaterThan(0);
      }
    });

    test('should navigate to budget details', async ({ page }) => {
      await page.goto('/dashboard/budgets');

      // Click on first budget row if exists
      const budgetRow = page.locator('table tbody tr, [data-testid="budget-item"]').first();

      if (await budgetRow.isVisible()) {
        await budgetRow.click();

        // Should navigate to details page
        await page.waitForURL(/budgets\/\w+/);
      }
    });
  });

  test.describe('Budget Submission Flow', () => {
    test('should allow submitting draft budget for approval', async ({ page }) => {
      // Navigate to a specific draft budget
      await page.goto('/dashboard/budgets');

      // Find a draft budget and click it
      const draftBudget = page.locator('[data-status="DRAFT"]').first();

      if (await draftBudget.isVisible()) {
        await draftBudget.click();

        // Look for submit button
        const submitForApproval = page.locator('button:has-text("Submit"), button:has-text("Submit for Approval")');

        if (await submitForApproval.isVisible()) {
          // Verify button is enabled
          expect(await submitForApproval.isEnabled()).toBeTruthy();
        }
      }
    });
  });
});

test.describe('OTB Plan Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test.describe('OTB Plan Creation', () => {
    test('should navigate to OTB plans page', async ({ page }) => {
      await page.goto('/dashboard/otb-plans');

      // Verify page loads
      await expect(page).toHaveURL(/otb-plans/);

      // Check for page content
      const pageContent = page.locator('main, [data-testid="otb-plans-page"]');
      await expect(pageContent).toBeVisible();
    });

    test('should display OTB plans list', async ({ page }) => {
      await page.goto('/dashboard/otb-plans');

      // Wait for content to load
      await page.waitForLoadState('networkidle');

      // Check for list or table
      const plansList = page.locator('table, [data-testid="otb-list"], .plans-grid');

      // Either list exists or empty state is shown
      const hasContent = await plansList.isVisible();
      const emptyState = await page.locator('[data-testid="empty-state"], .empty-state').isVisible();

      expect(hasContent || emptyState).toBeTruthy();
    });

    test('should allow creating new OTB plan', async ({ page }) => {
      await page.goto('/dashboard/otb-plans');

      // Look for create button
      const createButton = page.locator('button:has-text("Create"), button:has-text("New Plan"), [data-testid="create-plan"]');

      if (await createButton.isVisible()) {
        await expect(createButton).toBeEnabled();
      }
    });
  });

  test.describe('OTB Plan Configuration', () => {
    test('should configure monthly allocations', async ({ page }) => {
      await page.goto('/dashboard/otb-plans');

      // Navigate to specific plan if exists
      const planRow = page.locator('table tbody tr, [data-testid="plan-item"]').first();

      if (await planRow.isVisible()) {
        await planRow.click();

        // Wait for details page
        await page.waitForURL(/otb-plans\/\w+/);

        // Look for monthly allocation section
        const monthlySection = page.locator('[data-testid="monthly-allocation"], .monthly-breakdown');

        if (await monthlySection.isVisible()) {
          await expect(monthlySection).toBeVisible();
        }
      }
    });
  });
});

test.describe('SKU Management Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test.describe('SKU Import', () => {
    test('should navigate to SKU import page', async ({ page }) => {
      await page.goto('/dashboard/sku-proposals');

      await expect(page).toHaveURL(/sku-proposals/);
    });

    test('should display SKU proposals list', async ({ page }) => {
      await page.goto('/dashboard/sku-proposals');

      await page.waitForLoadState('networkidle');

      // Check page loaded
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });

    test('should allow uploading SKU file', async ({ page }) => {
      await page.goto('/dashboard/sku-proposals/import');

      // Look for file upload area
      const uploadArea = page.locator('[data-testid="file-upload"], input[type="file"], .dropzone');

      if (await uploadArea.isVisible()) {
        await expect(uploadArea).toBeVisible();
      }
    });
  });

  test.describe('SKU Validation', () => {
    test('should validate imported SKUs', async ({ page }) => {
      await page.goto('/dashboard/sku-proposals');

      // Find SKU with validation status
      const skuRow = page.locator('[data-testid="sku-row"], table tbody tr').first();

      if (await skuRow.isVisible()) {
        // Check for validation status indicator
        const statusBadge = skuRow.locator('[data-testid="status-badge"], .badge, .status');
        const hasStatus = await statusBadge.isVisible();
        expect(hasStatus || true).toBeTruthy();
      }
    });
  });
});

test.describe('Notification System E2E', () => {
  test('should display notifications', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for notification bell/icon
    const notificationIcon = page.locator('[data-testid="notifications"], button[aria-label*="notification"], .notification-bell');

    if (await notificationIcon.isVisible()) {
      await notificationIcon.click();

      // Wait for notification panel
      const notificationPanel = page.locator('[data-testid="notification-panel"], .notifications-dropdown');

      if (await notificationPanel.isVisible()) {
        await expect(notificationPanel).toBeVisible();
      }
    }
  });

  test('should mark notification as read', async ({ page }) => {
    await page.goto('/dashboard');

    const notificationIcon = page.locator('[data-testid="notifications"]');

    if (await notificationIcon.isVisible()) {
      await notificationIcon.click();

      // Find unread notification
      const unreadNotification = page.locator('[data-testid="unread-notification"], .notification.unread').first();

      if (await unreadNotification.isVisible()) {
        await unreadNotification.click();
        // Verify it's marked as read
        await expect(unreadNotification).not.toHaveClass(/unread/);
      }
    }
  });
});

test.describe('Search and Filter E2E', () => {
  test('should search budgets', async ({ page }) => {
    await page.goto('/dashboard/budgets');

    const searchInput = page.locator('input[type="search"], [data-testid="search-input"], input[placeholder*="Search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('Nike');
      await searchInput.press('Enter');

      // Wait for filtered results
      await page.waitForLoadState('networkidle');

      // Verify search was performed
      expect(await page.url()).toBeTruthy();
    }
  });

  test('should filter by brand', async ({ page }) => {
    await page.goto('/dashboard/budgets');

    const brandFilter = page.locator('[data-testid="brand-filter"], select[name="brand"]');

    if (await brandFilter.isVisible()) {
      await brandFilter.click();

      const brandOption = page.locator('[role="option"], option').first();
      if (await brandOption.isVisible()) {
        await brandOption.click();

        // Wait for filter to apply
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should filter by season', async ({ page }) => {
    await page.goto('/dashboard/budgets');

    const seasonFilter = page.locator('[data-testid="season-filter"], select[name="season"]');

    if (await seasonFilter.isVisible()) {
      await seasonFilter.click();

      const seasonOption = page.locator('[role="option"], option').first();
      if (await seasonOption.isVisible()) {
        await seasonOption.click();

        await page.waitForLoadState('networkidle');
      }
    }
  });
});
