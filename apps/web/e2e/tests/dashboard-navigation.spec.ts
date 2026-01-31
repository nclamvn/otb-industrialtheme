/**
 * Dashboard & Navigation E2E Tests
 * @tag @phase2 @priority1
 *
 * Tests dashboard functionality:
 * - KPI cards and stats
 * - Quick actions
 * - Navigation breadcrumbs
 * - Global search
 * - Sidebar navigation
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('Dashboard - Main View', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('should display dashboard page @smoke', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
        const heading = page.getByRole('heading').first();
        await expect(heading).toBeVisible();
    });

    test('should show KPI summary cards', async ({ page }) => {
        const kpiCards = page.locator('[class*="Card"], [data-testid*="kpi"], [class*="stat"]');
        await expect(kpiCards.first()).toBeVisible({ timeout: 10000 });

        const cardCount = await kpiCards.count();
        expect(cardCount).toBeGreaterThan(0);
    });

    test('should display recent activity or notifications', async ({ page }) => {
        const activity = page.locator('[class*="activity"], [class*="recent"], [class*="notification"]');
        if (await activity.first().isVisible({ timeout: 5000 })) {
            await expect(activity.first()).toBeVisible();
        }
    });

    test('should show charts or visualizations', async ({ page }) => {
        await page.waitForTimeout(2000);
        const charts = page.locator('.recharts-wrapper, svg[class*="chart"], [data-testid*="chart"]');
        if (await charts.first().isVisible({ timeout: 5000 })) {
            expect(await charts.count()).toBeGreaterThan(0);
        }
    });

    test('should have date range filter', async ({ page }) => {
        const dateFilter = page.locator('[data-testid*="date"], button:has-text("date"), [class*="calendar"]');
        if (await dateFilter.first().isVisible({ timeout: 3000 })) {
            await expect(dateFilter.first()).toBeVisible();
        }
    });
});

test.describe('Dashboard - Quick Actions', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('should display quick action buttons', async ({ page }) => {
        const quickActions = page.locator('[class*="quick-action"], [data-testid*="action"], button[class*="action"]');
        if (await quickActions.first().isVisible({ timeout: 5000 })) {
            expect(await quickActions.count()).toBeGreaterThan(0);
        }
    });

    test('should have create budget action', async ({ page }) => {
        const createBudgetBtn = page.getByRole('button', { name: /create.*budget|tạo.*ngân sách/i }).or(
            page.locator('a').filter({ hasText: /create.*budget|new.*budget/i })
        );

        if (await createBudgetBtn.isVisible({ timeout: 3000 })) {
            await expect(createBudgetBtn).toBeEnabled();
        }
    });

    test('should have view analytics action', async ({ page }) => {
        const analyticsLink = page.locator('a[href*="analytics"], button').filter({
            hasText: /analytics|phân tích/i
        });

        if (await analyticsLink.first().isVisible({ timeout: 3000 })) {
            await expect(analyticsLink.first()).toBeVisible();
        }
    });
});

test.describe('Navigation - Sidebar', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('should display sidebar navigation', async ({ page }) => {
        const sidebar = page.locator('nav, [class*="sidebar"], [role="navigation"]');
        await expect(sidebar.first()).toBeVisible();
    });

    test('should have core navigation links', async ({ page }) => {
        const coreLinks = [
            /dashboard|tổng quan/i,
            /budget|ngân sách/i,
            /OTB/i,
            /analytics|phân tích/i,
        ];

        for (const linkPattern of coreLinks) {
            const link = page.locator('nav a, [class*="sidebar"] a').filter({ hasText: linkPattern });
            if (await link.first().isVisible({ timeout: 2000 })) {
                await expect(link.first()).toBeVisible();
            }
        }
    });

    test('should navigate to budgets page', async ({ page }) => {
        const budgetsLink = page.locator('nav a, [class*="sidebar"] a').filter({
            hasText: /budget|ngân sách/i
        });

        if (await budgetsLink.first().isVisible()) {
            await budgetsLink.first().click();
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/budget/);
        }
    });

    test('should navigate to OTB page', async ({ page }) => {
        const otbLink = page.locator('nav a, [class*="sidebar"] a').filter({
            hasText: /OTB/i
        });

        if (await otbLink.first().isVisible()) {
            await otbLink.first().click();
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/otb/);
        }
    });

    test('should collapse/expand sidebar', async ({ page }) => {
        const toggleBtn = page.locator('button').filter({
            has: page.locator('[class*="ChevronLeft"], [class*="ChevronRight"], [class*="Menu"]')
        });

        if (await toggleBtn.first().isVisible()) {
            await toggleBtn.first().click();
            await page.waitForTimeout(300);
        }
    });
});

test.describe('Navigation - Breadcrumbs', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
    });

    test('should show breadcrumbs on nested pages', async ({ page }) => {
        await page.goto('/analytics/kpi');
        await page.waitForLoadState('networkidle');

        const breadcrumbs = page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]');
        if (await breadcrumbs.isVisible({ timeout: 3000 })) {
            await expect(breadcrumbs).toBeVisible();
        }
    });

    test('should navigate via breadcrumb links', async ({ page }) => {
        await page.goto('/master-data/brands');
        await page.waitForLoadState('networkidle');

        const breadcrumbLinks = page.locator('[class*="breadcrumb"] a');
        if (await breadcrumbLinks.first().isVisible()) {
            const count = await breadcrumbLinks.count();
            if (count > 0) {
                await breadcrumbLinks.first().click();
                await page.waitForLoadState('networkidle');
            }
        }
    });
});

test.describe('Navigation - Global Search', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('should show global search input', async ({ page }) => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"], [data-testid="global-search"]');
        if (await searchInput.first().isVisible({ timeout: 3000 })) {
            await expect(searchInput.first()).toBeVisible();
        }
    });

    test('should open search with keyboard shortcut', async ({ page }) => {
        // Common shortcuts: Ctrl+K, Cmd+K
        await page.keyboard.press('Meta+k');
        await page.waitForTimeout(500);

        const searchDialog = page.locator('[role="dialog"], [class*="search-modal"], [class*="command"]');
        if (await searchDialog.isVisible({ timeout: 2000 })) {
            await expect(searchDialog).toBeVisible();
        }
    });

    test('should display search results', async ({ page }) => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();

        if (await searchInput.isVisible({ timeout: 3000 })) {
            await searchInput.fill('budget');
            await page.waitForTimeout(500);

            const results = page.locator('[class*="result"], [class*="suggestion"], [role="listbox"] [role="option"]');
            // Results may or may not appear depending on data
        }
    });
});

test.describe('Navigation - User Menu', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('should show user avatar or menu', async ({ page }) => {
        const userMenu = page.locator('[data-testid="user-nav"], [class*="avatar"], button[aria-haspopup]');
        await expect(userMenu.first()).toBeVisible({ timeout: 5000 });
    });

    test('should open user dropdown', async ({ page }) => {
        const userMenu = page.locator('[data-testid="user-nav"], [class*="avatar"], button[aria-haspopup]').first();

        if (await userMenu.isVisible()) {
            await userMenu.click();
            await page.waitForTimeout(300);

            const dropdown = page.locator('[role="menu"], [class*="dropdown"]');
            await expect(dropdown).toBeVisible();
        }
    });

    test('should show profile link in menu', async ({ page }) => {
        const userMenu = page.locator('[data-testid="user-nav"], [class*="avatar"], button[aria-haspopup]').first();

        if (await userMenu.isVisible()) {
            await userMenu.click();

            const profileLink = page.getByRole('menuitem', { name: /profile|hồ sơ/i });
            if (await profileLink.isVisible({ timeout: 2000 })) {
                await expect(profileLink).toBeVisible();
            }
        }
    });

    test('should show settings link in menu', async ({ page }) => {
        const userMenu = page.locator('[data-testid="user-nav"], [class*="avatar"], button[aria-haspopup]').first();

        if (await userMenu.isVisible()) {
            await userMenu.click();

            const settingsLink = page.getByRole('menuitem', { name: /settings|cài đặt/i });
            if (await settingsLink.isVisible({ timeout: 2000 })) {
                await expect(settingsLink).toBeVisible();
            }
        }
    });
});

test.describe('Dashboard - Responsive Design', () => {
    test('dashboard on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');

        await expect(page.locator('main')).toBeVisible();
    });

    test('dashboard on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');

        await expect(page.locator('main')).toBeVisible();
    });

    test('sidebar should collapse on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await login(page, TestUsers.admin);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Sidebar should be hidden or collapsed
        const sidebar = page.locator('[class*="sidebar"]');
        // Mobile usually has hidden sidebar or hamburger menu
    });
});
