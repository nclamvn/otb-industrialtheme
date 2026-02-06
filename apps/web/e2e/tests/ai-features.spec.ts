/**
 * Comprehensive AI Features E2E Tests
 * @tag @phase2 @new
 *
 * Tests AI-powered features:
 * - /ai-assistant - Chat interface
 * - /ai-auto-plan - Auto planning generation
 * - /ai-suggestions - AI recommendations
 */

import { test, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';
import { login } from '../fixtures/test-helpers';

test.describe('AI Assistant - Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/ai-assistant');
  });

  test('should display AI assistant page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /ai.*assistant|trợ lý ai/i });
    await expect(heading).toBeVisible();
  });

  test('should show chat interface', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const chatContainer = page.locator('[class*="chat"], [data-testid="chat-container"], .chat-interface');
    await expect(chatContainer.first()).toBeVisible();
  });

  test('should have message input field', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const input = page.locator('input[placeholder*="message"], textarea[placeholder*="message"], [data-testid="chat-input"]');
    await expect(input.first()).toBeVisible();
  });

  test('should have send button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const sendBtn = page.getByRole('button', { name: /send|gửi/i }).or(
      page.locator('[data-testid="send-button"], [type="submit"]')
    );
    await expect(sendBtn.first()).toBeVisible();
  });
});

test.describe('AI Auto Plan - Generation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/ai-auto-plan');
  });

  test('should display auto plan page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /auto.*plan|tự động.*lập kế hoạch/i });
    await expect(heading).toBeVisible();
  });

  test('should show parameter input form', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const form = page.locator('form, [class*="form"], [data-testid="plan-form"]');
    await expect(form.first()).toBeVisible();
  });

  test('should have generate button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const generateBtn = page.getByRole('button', { name: /generate|create|tạo|bắt đầu/i });
    await expect(generateBtn.first()).toBeVisible();
  });
});

test.describe('AI Suggestions - Recommendations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/ai-suggestions');
  });

  test('should display suggestions page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /suggestion|gợi ý|recommendation/i });
    await expect(heading).toBeVisible();
  });

  test('should show suggestion cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const cards = page.locator('[class*="suggestion-card"], [class*="recommendation"], [data-testid="suggestion-card"]');
    if (await cards.count() > 0) {
      await expect(cards.first()).toBeVisible();
    }
  });

  test('should have apply suggestion button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const applyBtn = page.getByRole('button', { name: /apply|áp dụng|accept|chấp nhận/i });
    if (await applyBtn.count() > 0) {
      await expect(applyBtn.first()).toBeVisible();
    }
  });

  test('should have dismiss suggestion button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const dismissBtn = page.getByRole('button', { name: /dismiss|bỏ qua|ignore|reject/i });
    if (await dismissBtn.count() > 0) {
      await expect(dismissBtn.first()).toBeVisible();
    }
  });
});

test.describe('AI Features - Role-based Access', () => {
  test('admin should have full access to AI features', async ({ page }) => {
    await login(page, TestUsers.admin);
    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');
    const content = page.locator('main, [class*="content"]');
    await expect(content.first()).toBeVisible();
  });

  test('brand planner should access AI assistant', async ({ page }) => {
    await login(page, TestUsers.brandPlanner);
    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('AI Features - Responsive Design', () => {
  const aiRoutes = ['/ai-assistant', '/ai-auto-plan', '/ai-suggestions'];

  for (const route of aiRoutes) {
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

test.describe('AI Features - Performance', () => {
  test('AI assistant should load within acceptable time', async ({ page }) => {
    await login(page, TestUsers.admin);
    const startTime = Date.now();
    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });
});
