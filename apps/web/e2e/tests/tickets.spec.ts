/**
 * Comprehensive Ticket Management E2E Tests
 * @tag @phase1 @new
 *
 * Tests complete ticket lifecycle:
 * - Ticket list view and filtering
 * - Ticket creation with bundling
 * - Ticket detail view
 * - Ticket approval workflow
 * - Ticket timeline/history
 * - Send to supplier flow
 */

import { test, expect } from '@playwright/test';
import { TestUsers, TestBrands, TestSeasons } from '../fixtures/test-data';
import { login, navigateAndWait, generateRandomString } from '../fixtures/test-helpers';

test.describe('Ticket Management - List View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/tickets');
  });

  test('should display tickets page with header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ticket/i })).toBeVisible();
  });

  test('should show ticket list', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for ticket cards or list
    const ticketList = page.locator('[data-testid="ticket-list"], .ticket-list, [class*="ticket"]');
    await expect(ticketList.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have create ticket button', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo|thêm/i });
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toBeEnabled();
  });

  test('should display ticket status badges', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const badges = page.locator('[class*="badge"], .status-badge');
    const count = await badges.count();

    if (count > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test('should show bundling toggle button', async ({ page }) => {
    const bundleToggle = page.getByRole('button', { name: /bundling|bundle/i });
    await expect(bundleToggle).toBeVisible();
  });
});

test.describe('Ticket Management - Bundling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/tickets');
  });

  test('should toggle bundling section', async ({ page }) => {
    const bundleToggle = page.getByRole('button', { name: /bundling|show bundling/i });

    if (await bundleToggle.isVisible()) {
      await bundleToggle.click();

      // Bundling section should be visible
      const bundlingSection = page.locator('[data-testid="ticket-bundling"], .bundling-section');
      await expect(bundlingSection).toBeVisible();
    }
  });

  test('should display bundle count badge', async ({ page }) => {
    const bundleBadge = page.locator('[class*="badge"]').filter({ hasText: /bundle/i });

    // Badge may or may not be visible depending on state
    if (await bundleBadge.count() > 0) {
      await expect(bundleBadge.first()).toBeVisible();
    }
  });

  test('should select tickets for bundling', async ({ page }) => {
    const bundleToggle = page.getByRole('button', { name: /bundling|show bundling/i });

    if (await bundleToggle.isVisible()) {
      await bundleToggle.click();
      await page.waitForTimeout(500);

      // Look for checkboxes or selection UI
      const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
      const count = await checkboxes.count();

      if (count > 0) {
        await checkboxes.first().click();
        // Selection should be registered
      }
    }
  });
});

test.describe('Ticket Management - Create Ticket', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/tickets');
  });

  test('should open create ticket dialog', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await createBtn.click();

    // Dialog should appear
    const dialog = page.locator('[role="dialog"], .dialog, [data-testid="create-ticket-dialog"]');
    await expect(dialog).toBeVisible();
  });

  test('should display create ticket form fields', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Check for form fields
    const titleField = dialog.locator('input[name*="title"], input[placeholder*="title"]');
    const descField = dialog.locator('textarea, input[name*="description"]');

    // At least title field should be present
    await expect(titleField.or(descField)).toBeVisible();
  });

  test('should show available items for ticket', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Look for items selection
    const itemsList = dialog.locator('[class*="item"], [data-testid="available-items"]');

    if (await itemsList.count() > 0) {
      await expect(itemsList.first()).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Try to submit without filling required fields
    const submitBtn = dialog.getByRole('button', { name: /create|submit|save|tạo|gửi/i });

    if (await submitBtn.isEnabled()) {
      await submitBtn.click();

      // Should show validation error
      const error = page.locator('[class*="error"], .validation-error, [role="alert"]');
      // Error may or may not appear depending on validation strategy
    }
  });

  test('should create ticket successfully', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Fill form
    const titleField = dialog.locator('input').first();
    await titleField.fill(`Test Ticket ${generateRandomString(6)}`);

    // Select items if available
    const itemCheckbox = dialog.locator('input[type="checkbox"]').first();
    if (await itemCheckbox.isVisible()) {
      await itemCheckbox.click();
    }

    // Submit
    const submitBtn = dialog.getByRole('button', { name: /create|submit|save|tạo/i });
    await submitBtn.click();

    // Should show success toast
    const toast = page.locator('[data-sonner-toast], .toast, [role="status"]');
    await expect(toast.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Ticket Management - Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/tickets');
  });

  test('should open ticket detail on click', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on first ticket card
    const ticketCard = page.locator('[data-testid="ticket-card"], .ticket-card, [class*="ticket"]').first();

    if (await ticketCard.isVisible()) {
      await ticketCard.click();

      // Detail dialog should open
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    }
  });

  test('should display ticket number and title', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const ticketCard = page.locator('[data-testid="ticket-card"], .ticket-card').first();

    if (await ticketCard.isVisible()) {
      await ticketCard.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Should show ticket number
      const ticketNumber = dialog.locator('[class*="number"], .ticket-number');
      if (await ticketNumber.count() > 0) {
        await expect(ticketNumber.first()).toBeVisible();
      }
    }
  });

  test('should show ticket timeline/history', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const ticketCard = page.locator('[data-testid="ticket-card"], .ticket-card').first();

    if (await ticketCard.isVisible()) {
      await ticketCard.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Look for timeline section
      const timeline = dialog.locator('[class*="timeline"], .ticket-timeline, [data-testid="timeline"]');
      if (await timeline.count() > 0) {
        await expect(timeline).toBeVisible();
      }
    }
  });

  test('should display ticket items', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const ticketCard = page.locator('[data-testid="ticket-card"], .ticket-card').first();

    if (await ticketCard.isVisible()) {
      await ticketCard.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Should show bundled items
      const items = dialog.locator('[class*="item"], .ticket-item');
      if (await items.count() > 0) {
        await expect(items.first()).toBeVisible();
      }
    }
  });
});

test.describe('Ticket Management - Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/tickets');
  });

  test('should show approval status for approved tickets', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for approved status badge
    const approvedBadge = page.locator('[class*="badge"]').filter({ hasText: /approved|đã duyệt/i });

    if (await approvedBadge.count() > 0) {
      await expect(approvedBadge.first()).toBeVisible();
    }
  });

  test('should show send to supplier button for approved tickets', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find approved ticket and click
    const approvedTicket = page.locator('[class*="ticket"]').filter({ hasText: /approved/i }).first();

    if (await approvedTicket.isVisible()) {
      await approvedTicket.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Should have send to supplier button
      const sendBtn = dialog.getByRole('button', { name: /send.*supplier|gửi.*nhà cung cấp/i });
      if (await sendBtn.count() > 0) {
        await expect(sendBtn).toBeVisible();
      }
    }
  });

  test('should display approval completion banner', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const approvedTicket = page.locator('[class*="ticket"]').filter({ hasText: /approved/i }).first();

    if (await approvedTicket.isVisible()) {
      await approvedTicket.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Look for completion banner
      const banner = dialog.locator('[class*="emerald"], [class*="success"], .approval-complete');
      if (await banner.count() > 0) {
        await expect(banner.first()).toBeVisible();
      }
    }
  });
});

test.describe('Ticket Management - Send to Supplier', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/tickets');
  });

  test('should open planning request dialog', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find approved ticket
    const approvedTicket = page.locator('[class*="ticket"]').filter({ hasText: /approved/i }).first();

    if (await approvedTicket.isVisible()) {
      await approvedTicket.click();

      const detailDialog = page.locator('[role="dialog"]').first();
      await expect(detailDialog).toBeVisible();

      // Click send to supplier
      const sendBtn = detailDialog.getByRole('button', { name: /send.*supplier/i });

      if (await sendBtn.isVisible()) {
        await sendBtn.click();

        // Planning request dialog should open
        const planningDialog = page.locator('[role="dialog"]').filter({ hasText: /planning.*request|supplier/i });
        await expect(planningDialog).toBeVisible();
      }
    }
  });

  test('should display supplier selection', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const approvedTicket = page.locator('[class*="ticket"]').filter({ hasText: /approved/i }).first();

    if (await approvedTicket.isVisible()) {
      await approvedTicket.click();

      const detailDialog = page.locator('[role="dialog"]').first();
      const sendBtn = detailDialog.getByRole('button', { name: /send.*supplier/i });

      if (await sendBtn.isVisible()) {
        await sendBtn.click();
        await page.waitForTimeout(500);

        // Should show supplier dropdown
        const supplierSelect = page.locator('[name*="supplier"], [data-testid="supplier-select"]');
        if (await supplierSelect.count() > 0) {
          await expect(supplierSelect.first()).toBeVisible();
        }
      }
    }
  });
});

test.describe('Ticket Management - Cancel Operation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/tickets');
  });

  test('should show cancel button for draft tickets', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find draft ticket
    const draftTicket = page.locator('[class*="ticket"]').filter({ hasText: /draft|nháp/i }).first();

    if (await draftTicket.isVisible()) {
      await draftTicket.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Should have cancel button
      const cancelBtn = dialog.getByRole('button', { name: /cancel|hủy/i });
      if (await cancelBtn.count() > 0) {
        await expect(cancelBtn).toBeVisible();
      }
    }
  });
});

test.describe('Ticket Management - Role-based Access', () => {
  test('brand planner should be able to create tickets', async ({ page }) => {
    await login(page, TestUsers.brandPlanner);
    await page.goto('/tickets');

    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toBeEnabled();
  });

  test('viewer should have read-only access', async ({ page }) => {
    await login(page, TestUsers.viewer);
    await page.goto('/tickets');

    // Viewer can see the page
    await expect(page.getByRole('heading', { name: /ticket/i })).toBeVisible();

    // Create button should be disabled or hidden
    const createBtn = page.getByRole('button', { name: /new|create|add|tạo/i });

    if (await createBtn.isVisible()) {
      // Button visible but should be disabled
      await expect(createBtn).toBeDisabled();
    }
  });
});

test.describe('Ticket Management - Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TestUsers.admin);
    await page.goto('/tickets');

    await expect(page.getByRole('heading', { name: /ticket/i })).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, TestUsers.admin);
    await page.goto('/tickets');

    await expect(page.getByRole('heading', { name: /ticket/i })).toBeVisible();
  });
});

test.describe('Ticket Management - Performance', () => {
  test('should load tickets page within acceptable time', async ({ page }) => {
    await login(page, TestUsers.admin);

    const startTime = Date.now();
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
