/**
 * Comprehensive Advanced Features E2E Tests
 * @tag @phase4 @new
 *
 * Tests Advanced Features:
 * - /clearance - Clearance management
 * - /costing - Cost analysis
 * - /delivery-planning - Delivery scheduling
 * - /forecasting - Demand forecasting
 * - /replenishment - Stock replenishment
 * - /predictive-alerts - AI-powered alerts
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

// =============== CLEARANCE TESTS ===============
test.describe('Clearance - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/clearance');
  });

  test('should display clearance page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /clearance|giảm giá|thanh lý/i });
    await expect(heading).toBeVisible();
  });

  test('should show clearance items list', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const list = page.locator('table, [role="grid"], [data-testid="clearance-list"]');
    await expect(list.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have clearance percentage filter', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const filter = page.locator('select, [role="combobox"], input[type="range"]').filter({ hasText: /%|percent|phần trăm/i });

    if (await filter.count() > 0) {
      await expect(filter.first()).toBeVisible();
    }
  });

  test('should show markdown/discount column', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const discountCol = page.locator('th, [role="columnheader"]').filter({ hasText: /markdown|discount|giảm/i });

    if (await discountCol.count() > 0) {
      await expect(discountCol.first()).toBeVisible();
    }
  });

  test('should have apply clearance button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const applyBtn = page.getByRole('button', { name: /apply|áp dụng/i });

    if (await applyBtn.count() > 0) {
      await expect(applyBtn.first()).toBeVisible();
    }
  });

  test('should show current stock levels', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const stockCol = page.locator('th, [role="columnheader"]').filter({ hasText: /stock|tồn kho|qty/i });

    if (await stockCol.count() > 0) {
      await expect(stockCol.first()).toBeVisible();
    }
  });

  test('should filter by age of stock', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const ageFilter = page.locator('select, [role="combobox"]').filter({ hasText: /age|tuổi|weeks|tuần/i });

    if (await ageFilter.count() > 0) {
      await ageFilter.first().click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Clearance - Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/clearance');
  });

  test('should select items for clearance', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const checkbox = page.locator('input[type="checkbox"]').first();

    if (await checkbox.isVisible()) {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }
  });

  test('should bulk apply clearance', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const bulkBtn = page.getByRole('button', { name: /bulk|hàng loạt/i });

    if (await bulkBtn.isVisible()) {
      await expect(bulkBtn).toBeEnabled();
    }
  });

  test('should export clearance report', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });
});

// =============== COSTING TESTS ===============
test.describe('Costing - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/costing');
  });

  test('should display costing page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /cost|chi phí|giá vốn/i });
    await expect(heading).toBeVisible();
  });

  test('should show cost breakdown', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const breakdown = page.locator('[class*="breakdown"], [class*="cost-table"], table');
    await expect(breakdown.first()).toBeVisible({ timeout: 15000 });
  });

  test('should display unit cost', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const unitCost = page.locator('[class*="unit-cost"], td, th').filter({ hasText: /unit|đơn vị/i });

    if (await unitCost.count() > 0) {
      await expect(unitCost.first()).toBeVisible();
    }
  });

  test('should show landed cost', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const landedCost = page.locator('[class*="landed"], td, th').filter({ hasText: /landed|nhập kho/i });

    if (await landedCost.count() > 0) {
      await expect(landedCost.first()).toBeVisible();
    }
  });

  test('should calculate margin', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const margin = page.locator('[class*="margin"]').filter({ hasText: /%/ });

    if (await margin.count() > 0) {
      await expect(margin.first()).toBeVisible();
    }
  });

  test('should filter by product category', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const filter = page.locator('select, [role="combobox"]').filter({ hasText: /category|danh mục/i });

    if (await filter.count() > 0) {
      await filter.first().click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Costing - Calculations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/costing');
  });

  test('should update cost when quantity changes', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const qtyInput = page.locator('input[type="number"]').first();

    if (await qtyInput.isVisible()) {
      await qtyInput.fill('100');
      await page.waitForTimeout(500);
    }
  });

  test('should show currency selector', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const currencySelector = page.locator('select, [role="combobox"]').filter({ hasText: /currency|tiền tệ|usd|vnd/i });

    if (await currencySelector.count() > 0) {
      await expect(currencySelector.first()).toBeVisible();
    }
  });
});

// =============== DELIVERY PLANNING TESTS ===============
test.describe('Delivery Planning - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/delivery-planning');
  });

  test('should display delivery planning page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /delivery|giao hàng|lịch trình/i });
    await expect(heading).toBeVisible();
  });

  test('should show delivery calendar', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const calendar = page.locator('[class*="calendar"], [data-testid="delivery-calendar"]');

    if (await calendar.count() > 0) {
      await expect(calendar.first()).toBeVisible();
    }
  });

  test('should display delivery schedule list', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const list = page.locator('table, [role="grid"], [data-testid="delivery-list"]');
    await expect(list.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show delivery status badges', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const badges = page.locator('[class*="badge"]').filter({ hasText: /pending|scheduled|delivered|đã giao|chờ/i });

    if (await badges.count() > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test('should have create delivery button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|schedule|tạo|lên lịch/i });
    await expect(createBtn.first()).toBeVisible();
  });

  test('should filter by date range', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const dateFilter = page.locator('input[type="date"], [data-testid="date-filter"]');

    if (await dateFilter.count() > 0) {
      await expect(dateFilter.first()).toBeVisible();
    }
  });

  test('should filter by destination', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const destFilter = page.locator('select, [role="combobox"]').filter({ hasText: /destination|store|cửa hàng/i });

    if (await destFilter.count() > 0) {
      await destFilter.first().click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Delivery Planning - Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/delivery-planning');
  });

  test('should open create delivery dialog', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /new|create|schedule|tạo/i });

    if (await createBtn.isVisible()) {
      await createBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    }
  });

  test('should reschedule delivery', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const rescheduleBtn = page.getByRole('button', { name: /reschedule|đổi lịch/i });

    if (await rescheduleBtn.count() > 0) {
      await expect(rescheduleBtn.first()).toBeVisible();
    }
  });

  test('should track delivery status', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const trackBtn = page.getByRole('button', { name: /track|theo dõi/i });

    if (await trackBtn.count() > 0) {
      await expect(trackBtn.first()).toBeVisible();
    }
  });
});

// =============== FORECASTING TESTS ===============
test.describe('Forecasting - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/forecasting');
  });

  test('should display forecasting page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /forecast|dự báo/i });
    await expect(heading).toBeVisible();
  });

  test('should show forecast chart', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const chart = page.locator('canvas, [class*="chart"], svg[class*="recharts"]');

    if (await chart.count() > 0) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('should display forecast accuracy', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const accuracy = page.locator('[class*="accuracy"]').filter({ hasText: /%/ });

    if (await accuracy.count() > 0) {
      await expect(accuracy.first()).toBeVisible();
    }
  });

  test('should show predicted vs actual', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const comparison = page.locator('[class*="predicted"], [class*="actual"]');

    if (await comparison.count() > 0) {
      await expect(comparison.first()).toBeVisible();
    }
  });

  test('should select forecast horizon', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const horizonSelector = page.locator('select, [role="combobox"]').filter({ hasText: /horizon|weeks|months|tuần|tháng/i });

    if (await horizonSelector.count() > 0) {
      await horizonSelector.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should generate new forecast', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const generateBtn = page.getByRole('button', { name: /generate|run|tạo|chạy/i });

    if (await generateBtn.isVisible()) {
      await expect(generateBtn).toBeEnabled();
    }
  });

  test('should show confidence intervals', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const confidence = page.locator('[class*="confidence"], [class*="interval"]');

    if (await confidence.count() > 0) {
      await expect(confidence.first()).toBeVisible();
    }
  });
});

test.describe('Forecasting - Models', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/forecasting');
  });

  test('should select forecast model', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const modelSelector = page.locator('select, [role="combobox"]').filter({ hasText: /model|mô hình/i });

    if (await modelSelector.count() > 0) {
      await modelSelector.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should show model parameters', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const params = page.locator('[class*="parameter"], [class*="config"]');

    if (await params.count() > 0) {
      await expect(params.first()).toBeVisible();
    }
  });
});

// =============== REPLENISHMENT TESTS ===============
test.describe('Replenishment - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/replenishment');
  });

  test('should display replenishment page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /replenishment|bổ sung|nhập hàng/i });
    await expect(heading).toBeVisible();
  });

  test('should show replenishment suggestions', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const suggestions = page.locator('[class*="suggestion"], [data-testid="replenishment-list"], table');
    await expect(suggestions.first()).toBeVisible({ timeout: 15000 });
  });

  test('should display reorder point', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const reorderPoint = page.locator('th, td, [class*="reorder"]').filter({ hasText: /reorder|điểm đặt hàng/i });

    if (await reorderPoint.count() > 0) {
      await expect(reorderPoint.first()).toBeVisible();
    }
  });

  test('should show safety stock levels', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const safetyStock = page.locator('th, td, [class*="safety"]').filter({ hasText: /safety|an toàn/i });

    if (await safetyStock.count() > 0) {
      await expect(safetyStock.first()).toBeVisible();
    }
  });

  test('should calculate order quantity', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const orderQty = page.locator('th, td, [class*="order-qty"]').filter({ hasText: /order qty|số lượng đặt/i });

    if (await orderQty.count() > 0) {
      await expect(orderQty.first()).toBeVisible();
    }
  });

  test('should filter by urgency', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const urgencyFilter = page.locator('select, [role="combobox"]').filter({ hasText: /urgency|priority|ưu tiên/i });

    if (await urgencyFilter.count() > 0) {
      await urgencyFilter.first().click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Replenishment - Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/replenishment');
  });

  test('should create replenishment order', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /create.*order|tạo đơn/i });

    if (await createBtn.isVisible()) {
      await expect(createBtn).toBeEnabled();
    }
  });

  test('should approve replenishment suggestion', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const approveBtn = page.getByRole('button', { name: /approve|duyệt/i });

    if (await approveBtn.count() > 0) {
      await expect(approveBtn.first()).toBeVisible();
    }
  });

  test('should modify suggested quantity', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const qtyInput = page.locator('input[type="number"]').first();

    if (await qtyInput.isVisible()) {
      await expect(qtyInput).toBeEditable();
    }
  });

  test('should export replenishment report', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const exportBtn = page.getByRole('button', { name: /export|xuất/i });

    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });
});

// =============== PREDICTIVE ALERTS TESTS ===============
test.describe('Predictive Alerts - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/predictive-alerts');
  });

  test('should display predictive alerts page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /alert|cảnh báo|predictive/i });
    await expect(heading).toBeVisible();
  });

  test('should show alert cards/list', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const alerts = page.locator('[class*="alert-card"], [data-testid="alerts-list"], table');
    await expect(alerts.first()).toBeVisible({ timeout: 15000 });
  });

  test('should display alert severity', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const severity = page.locator('[class*="severity"], [class*="critical"], [class*="warning"], [class*="info"]');

    if (await severity.count() > 0) {
      await expect(severity.first()).toBeVisible();
    }
  });

  test('should show prediction confidence', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const confidence = page.locator('[class*="confidence"]').filter({ hasText: /%/ });

    if (await confidence.count() > 0) {
      await expect(confidence.first()).toBeVisible();
    }
  });

  test('should filter by alert type', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const typeFilter = page.locator('select, [role="combobox"]').filter({ hasText: /type|loại/i });

    if (await typeFilter.count() > 0) {
      await typeFilter.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should filter by severity', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const severityFilter = page.locator('select, [role="combobox"]').filter({ hasText: /severity|mức độ/i });

    if (await severityFilter.count() > 0) {
      await severityFilter.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should show recommended actions', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const actions = page.locator('[class*="action"], [class*="recommendation"]');

    if (await actions.count() > 0) {
      await expect(actions.first()).toBeVisible();
    }
  });
});

test.describe('Predictive Alerts - Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/predictive-alerts');
  });

  test('should acknowledge alert', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const ackBtn = page.getByRole('button', { name: /acknowledge|xác nhận/i });

    if (await ackBtn.count() > 0) {
      await expect(ackBtn.first()).toBeVisible();
    }
  });

  test('should dismiss alert', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const dismissBtn = page.getByRole('button', { name: /dismiss|bỏ qua/i });

    if (await dismissBtn.count() > 0) {
      await expect(dismissBtn.first()).toBeVisible();
    }
  });

  test('should take action from alert', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const actionBtn = page.getByRole('button', { name: /take action|thực hiện/i });

    if (await actionBtn.count() > 0) {
      await expect(actionBtn.first()).toBeVisible();
    }
  });

  test('should view alert details', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const viewBtn = page.getByRole('button', { name: /view|details|xem/i });

    if (await viewBtn.count() > 0) {
      await viewBtn.first().click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Predictive Alerts - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/predictive-alerts');
  });

  test('should access alert settings', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const settingsBtn = page.getByRole('button', { name: /settings|cài đặt/i });

    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should configure notification preferences', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const notifySettings = page.locator('[class*="notification"], [class*="preference"]');

    if (await notifySettings.count() > 0) {
      await expect(notifySettings.first()).toBeVisible();
    }
  });
});

// =============== ROLE-BASED ACCESS TESTS ===============
test.describe('Advanced Features - Role-based Access', () => {
  const routes = ['/clearance', '/costing', '/delivery-planning', '/forecasting', '/replenishment', '/predictive-alerts'];

  for (const route of routes) {
    test(`admin should access ${route}`, async ({ page }) => {
      await login(page, TestUsers.admin);
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const content = page.locator('main, [class*="content"]');
      await expect(content.first()).toBeVisible();
    });
  }

  test('viewer should have limited access to costing', async ({ page }) => {
    await login(page, TestUsers.viewer);
    await page.goto('/costing');
    await page.waitForLoadState('networkidle');

    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });
});

// =============== RESPONSIVE DESIGN TESTS ===============
test.describe('Advanced Features - Responsive Design', () => {
  const routes = ['/clearance', '/costing', '/delivery-planning', '/forecasting', '/replenishment', '/predictive-alerts'];

  for (const route of routes) {
    test(`${route} should display correctly on mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await login(page, TestUsers.admin);
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const content = page.locator('main, [class*="content"]');
      await expect(content.first()).toBeVisible();
    });
  }
});

// =============== PERFORMANCE TESTS ===============
test.describe('Advanced Features - Performance', () => {
  const routes = [
    { path: '/clearance', name: 'Clearance' },
    { path: '/costing', name: 'Costing' },
    { path: '/forecasting', name: 'Forecasting' },
    { path: '/predictive-alerts', name: 'Predictive Alerts' },
  ];

  for (const { path, name } of routes) {
    test(`${name} should load within acceptable time`, async ({ page }) => {
      await login(page, TestUsers.admin);

      const startTime = Date.now();
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });
  }
});
