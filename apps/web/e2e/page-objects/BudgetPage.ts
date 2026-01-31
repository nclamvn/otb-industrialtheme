/**
 * Budget Page Object - Budget management flows
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface BudgetData {
  seasonId?: string;
  brandId?: string;
  totalBudget?: number;
  seasonalBudget?: number;
  replenishmentBudget?: number;
  notes?: string;
}

export class BudgetPage extends BasePage {
  // List view
  readonly budgetTable: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly brandFilter: Locator;
  readonly seasonFilter: Locator;
  readonly exportButton: Locator;

  // Form fields
  readonly seasonSelect: Locator;
  readonly brandSelect: Locator;
  readonly totalBudgetInput: Locator;
  readonly seasonalBudgetInput: Locator;
  readonly replenishmentBudgetInput: Locator;
  readonly notesInput: Locator;
  readonly submitButton: Locator;
  readonly saveButton: Locator;

  // Detail view
  readonly statusBadge: Locator;
  readonly submitForApprovalButton: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);

    // List view
    this.budgetTable = page.locator('table, [data-testid="budget-list"]');
    this.createButton = page.getByRole('button', { name: /new|create|add|tạo|thêm/i });
    this.searchInput = page.locator('input[type="search"], [data-testid="search-input"]');
    this.statusFilter = page.locator('[data-testid="status-filter"], [name*="status"]');
    this.brandFilter = page.locator('[data-testid="brand-filter"], [name*="brand"]');
    this.seasonFilter = page.locator('[data-testid="season-filter"], [name*="season"]');
    this.exportButton = page.getByRole('button', { name: /export|xuất/i });

    // Form fields
    this.seasonSelect = page.locator('[name="seasonId"], [data-testid="season-select"]');
    this.brandSelect = page.locator('[name="brandId"], [data-testid="brand-select"]');
    this.totalBudgetInput = page.locator('[name="totalBudget"], [data-testid="total-budget"]');
    this.seasonalBudgetInput = page.locator('[name="seasonalBudget"]');
    this.replenishmentBudgetInput = page.locator('[name="replenishmentBudget"]');
    this.notesInput = page.locator('[name="notes"], textarea');
    this.submitButton = page.getByRole('button', { name: /submit|create|tạo/i });
    this.saveButton = page.getByRole('button', { name: /save|lưu|update|cập nhật/i });

    // Detail view
    this.statusBadge = page.locator('[data-testid="status-badge"], .badge');
    this.submitForApprovalButton = page.getByRole('button', { name: /submit.*approval|gửi.*duyệt/i });
    this.approveButton = page.getByRole('button', { name: /approve|duyệt/i });
    this.rejectButton = page.getByRole('button', { name: /reject|từ chối/i });
    this.editButton = page.getByRole('button', { name: /edit|sửa/i });
    this.deleteButton = page.getByRole('button', { name: /delete|xóa/i });
  }

  async navigateToList(): Promise<void> {
    await this.goto('/budget');
  }

  async navigateToCreate(): Promise<void> {
    await this.goto('/budget/new');
  }

  async navigateToDetail(budgetId: string): Promise<void> {
    await this.goto(`/budget/${budgetId}`);
  }

  async createBudget(data: BudgetData): Promise<void> {
    await this.navigateToCreate();

    // Select season
    if (data.seasonId && await this.seasonSelect.isVisible()) {
      await this.seasonSelect.click();
      await this.page.locator('[role="option"]').first().click();
    }

    // Select brand
    if (data.brandId && await this.brandSelect.isVisible()) {
      await this.brandSelect.click();
      await this.page.locator('[role="option"]').first().click();
    }

    // Fill budget amounts
    if (data.totalBudget && await this.totalBudgetInput.isVisible()) {
      await this.totalBudgetInput.fill(String(data.totalBudget));
    }

    if (data.seasonalBudget && await this.seasonalBudgetInput.isVisible()) {
      await this.seasonalBudgetInput.fill(String(data.seasonalBudget));
    }

    if (data.replenishmentBudget && await this.replenishmentBudgetInput.isVisible()) {
      await this.replenishmentBudgetInput.fill(String(data.replenishmentBudget));
    }

    if (data.notes && await this.notesInput.isVisible()) {
      await this.notesInput.fill(data.notes);
    }

    // Submit
    await this.submitButton.click();
    await this.waitForPageLoad();
  }

  async filterByStatus(status: string): Promise<void> {
    if (await this.statusFilter.isVisible()) {
      await this.statusFilter.click();
      await this.page.locator('[role="option"]').filter({ hasText: new RegExp(status, 'i') }).click();
      await this.waitForPageLoad();
    }
  }

  async filterByBrand(brand: string): Promise<void> {
    if (await this.brandFilter.isVisible()) {
      await this.brandFilter.click();
      await this.page.locator('[role="option"]').filter({ hasText: new RegExp(brand, 'i') }).click();
      await this.waitForPageLoad();
    }
  }

  async filterBySeason(season: string): Promise<void> {
    if (await this.seasonFilter.isVisible()) {
      await this.seasonFilter.click();
      await this.page.locator('[role="option"]').filter({ hasText: new RegExp(season, 'i') }).click();
      await this.waitForPageLoad();
    }
  }

  async searchBudgets(query: string): Promise<void> {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query);
      await this.searchInput.press('Enter');
      await this.waitForPageLoad();
    }
  }

  async clickFirstBudgetRow(): Promise<void> {
    const firstRow = this.page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await this.waitForPageLoad();
    }
  }

  async submitForApproval(): Promise<void> {
    if (await this.submitForApprovalButton.isVisible()) {
      await this.submitForApprovalButton.click();
      await this.confirmAction();
      await this.waitForPageLoad();
    }
  }

  async approve(comment?: string): Promise<void> {
    if (await this.approveButton.isVisible()) {
      await this.approveButton.click();
      if (comment) {
        const commentInput = this.page.locator('textarea, [name="comment"]');
        if (await commentInput.isVisible()) {
          await commentInput.fill(comment);
        }
      }
      await this.confirmAction();
      await this.waitForPageLoad();
    }
  }

  async reject(reason: string): Promise<void> {
    if (await this.rejectButton.isVisible()) {
      await this.rejectButton.click();
      const reasonInput = this.page.locator('textarea, [name="reason"]');
      if (await reasonInput.isVisible()) {
        await reasonInput.fill(reason);
      }
      await this.confirmAction();
      await this.waitForPageLoad();
    }
  }

  async expectStatus(status: string): Promise<void> {
    await expect(this.statusBadge).toContainText(new RegExp(status, 'i'));
  }

  async getBudgetCount(): Promise<number> {
    return this.getTableRowCount();
  }

  async export(): Promise<void> {
    if (await this.exportButton.isVisible()) {
      await this.exportButton.click();
    }
  }
}
