/**
 * OTB Plan Page Object - Open-to-Buy planning flows
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface OTBPlanData {
  name?: string;
  seasonId?: string;
  brandId?: string;
  budgetId?: string;
  categoryAllocations?: Record<string, number>;
  monthlyAllocations?: Record<string, number>;
}

export class OTBPlanPage extends BasePage {
  // List view
  readonly planTable: Locator;
  readonly createButton: Locator;
  readonly statusFilter: Locator;
  readonly brandFilter: Locator;
  readonly seasonFilter: Locator;

  // Form/Detail fields
  readonly nameInput: Locator;
  readonly seasonSelect: Locator;
  readonly brandSelect: Locator;
  readonly budgetSelect: Locator;
  readonly categoryGrid: Locator;
  readonly monthlyGrid: Locator;
  readonly totalBudgetDisplay: Locator;
  readonly allocatedDisplay: Locator;
  readonly remainingDisplay: Locator;

  // Actions
  readonly saveButton: Locator;
  readonly submitButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly duplicateButton: Locator;
  readonly exportButton: Locator;

  // Tabs
  readonly overviewTab: Locator;
  readonly categoryTab: Locator;
  readonly monthlyTab: Locator;
  readonly skuTab: Locator;
  readonly historyTab: Locator;

  constructor(page: Page) {
    super(page);

    // List view
    this.planTable = page.locator('table, [data-testid="otb-list"]');
    this.createButton = page.getByRole('button', { name: /new|create|add|tạo/i });
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.brandFilter = page.locator('[data-testid="brand-filter"]');
    this.seasonFilter = page.locator('[data-testid="season-filter"]');

    // Form fields
    this.nameInput = page.locator('[name="name"], [data-testid="plan-name"]');
    this.seasonSelect = page.locator('[name="seasonId"], [data-testid="season-select"]');
    this.brandSelect = page.locator('[name="brandId"], [data-testid="brand-select"]');
    this.budgetSelect = page.locator('[name="budgetId"], [data-testid="budget-select"]');
    this.categoryGrid = page.locator('[data-testid="category-allocation"], .category-grid');
    this.monthlyGrid = page.locator('[data-testid="monthly-allocation"], .monthly-grid');
    this.totalBudgetDisplay = page.locator('[data-testid="total-budget"]');
    this.allocatedDisplay = page.locator('[data-testid="allocated-budget"]');
    this.remainingDisplay = page.locator('[data-testid="remaining-budget"]');

    // Actions
    this.saveButton = page.getByRole('button', { name: /save|lưu/i });
    this.submitButton = page.getByRole('button', { name: /submit|gửi/i });
    this.editButton = page.getByRole('button', { name: /edit|sửa/i });
    this.deleteButton = page.getByRole('button', { name: /delete|xóa/i });
    this.duplicateButton = page.getByRole('button', { name: /duplicate|copy|sao chép/i });
    this.exportButton = page.getByRole('button', { name: /export|xuất/i });

    // Tabs
    this.overviewTab = page.getByRole('tab', { name: /overview|tổng quan/i });
    this.categoryTab = page.getByRole('tab', { name: /category|danh mục/i });
    this.monthlyTab = page.getByRole('tab', { name: /month|tháng/i });
    this.skuTab = page.getByRole('tab', { name: /sku/i });
    this.historyTab = page.getByRole('tab', { name: /history|lịch sử/i });
  }

  async navigateToList(): Promise<void> {
    await this.goto('/otb-plans');
  }

  async navigateToCreate(): Promise<void> {
    await this.goto('/otb-plans/new');
  }

  async navigateToDetail(planId: string): Promise<void> {
    await this.goto(`/otb-plans/${planId}`);
  }

  async createPlan(data: OTBPlanData): Promise<void> {
    await this.navigateToCreate();

    if (data.name && await this.nameInput.isVisible()) {
      await this.nameInput.fill(data.name);
    }

    if (data.seasonId && await this.seasonSelect.isVisible()) {
      await this.seasonSelect.click();
      await this.page.locator('[role="option"]').first().click();
    }

    if (data.brandId && await this.brandSelect.isVisible()) {
      await this.brandSelect.click();
      await this.page.locator('[role="option"]').first().click();
    }

    if (data.budgetId && await this.budgetSelect.isVisible()) {
      await this.budgetSelect.click();
      await this.page.locator('[role="option"]').first().click();
    }

    await this.saveButton.click();
    await this.waitForPageLoad();
  }

  async clickFirstPlanRow(): Promise<void> {
    const firstRow = this.page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await this.waitForPageLoad();
    }
  }

  async switchToTab(tabName: 'overview' | 'category' | 'monthly' | 'sku' | 'history'): Promise<void> {
    const tabs = {
      overview: this.overviewTab,
      category: this.categoryTab,
      monthly: this.monthlyTab,
      sku: this.skuTab,
      history: this.historyTab,
    };

    const tab = tabs[tabName];
    if (await tab.isVisible()) {
      await tab.click();
      await this.waitForPageLoad();
    }
  }

  async setCategoryAllocation(category: string, amount: number): Promise<void> {
    const categoryRow = this.categoryGrid.locator(`[data-category="${category}"], tr:has-text("${category}")`);
    const input = categoryRow.locator('input[type="number"]');
    if (await input.isVisible()) {
      await input.fill(String(amount));
    }
  }

  async setMonthlyAllocation(month: string, amount: number): Promise<void> {
    const monthRow = this.monthlyGrid.locator(`[data-month="${month}"], tr:has-text("${month}")`);
    const input = monthRow.locator('input[type="number"]');
    if (await input.isVisible()) {
      await input.fill(String(amount));
    }
  }

  async getTotalBudget(): Promise<number> {
    const text = await this.totalBudgetDisplay.textContent();
    return parseInt(text?.replace(/[^0-9]/g, '') || '0');
  }

  async getAllocatedBudget(): Promise<number> {
    const text = await this.allocatedDisplay.textContent();
    return parseInt(text?.replace(/[^0-9]/g, '') || '0');
  }

  async getRemainingBudget(): Promise<number> {
    const text = await this.remainingDisplay.textContent();
    return parseInt(text?.replace(/[^0-9]/g, '') || '0');
  }

  async submitPlan(): Promise<void> {
    if (await this.submitButton.isVisible()) {
      await this.submitButton.click();
      await this.confirmAction();
      await this.waitForPageLoad();
    }
  }

  async duplicatePlan(): Promise<void> {
    if (await this.duplicateButton.isVisible()) {
      await this.duplicateButton.click();
      await this.waitForPageLoad();
    }
  }

  async exportPlan(): Promise<void> {
    if (await this.exportButton.isVisible()) {
      await this.exportButton.click();
    }
  }

  async getPlanCount(): Promise<number> {
    return this.getTableRowCount();
  }
}
