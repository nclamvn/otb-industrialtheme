/**
 * SKU Proposal Page Object - SKU import and management flows
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface SKUData {
  skuCode: string;
  styleName: string;
  color?: string;
  category?: string;
  gender?: string;
  retailPrice: number;
  costPrice: number;
  quantity?: number;
  leadTime?: number;
  moq?: number;
}

export class SKUProposalPage extends BasePage {
  // List view
  readonly skuTable: Locator;
  readonly importButton: Locator;
  readonly addSKUButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly statusFilter: Locator;
  readonly brandFilter: Locator;

  // Import
  readonly fileUpload: Locator;
  readonly dropzone: Locator;
  readonly uploadButton: Locator;
  readonly templateDownload: Locator;
  readonly previewTable: Locator;
  readonly confirmImportButton: Locator;

  // SKU Form
  readonly skuCodeInput: Locator;
  readonly styleNameInput: Locator;
  readonly colorInput: Locator;
  readonly categorySelect: Locator;
  readonly genderSelect: Locator;
  readonly retailPriceInput: Locator;
  readonly costPriceInput: Locator;
  readonly quantityInput: Locator;
  readonly leadTimeInput: Locator;
  readonly moqInput: Locator;
  readonly saveButton: Locator;

  // Detail view
  readonly marginDisplay: Locator;
  readonly statusBadge: Locator;
  readonly validationMessages: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;

  // Size allocation
  readonly sizeGrid: Locator;
  readonly sizeProfileSelect: Locator;
  readonly applySizeProfileButton: Locator;

  constructor(page: Page) {
    super(page);

    // List view
    this.skuTable = page.locator('table, [data-testid="sku-list"]');
    this.importButton = page.getByRole('button', { name: /import|nhập/i });
    this.addSKUButton = page.getByRole('button', { name: /add|new|thêm|tạo/i });
    this.searchInput = page.locator('input[type="search"], [data-testid="search-input"]');
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.brandFilter = page.locator('[data-testid="brand-filter"]');

    // Import
    this.fileUpload = page.locator('input[type="file"]');
    this.dropzone = page.locator('[data-testid="dropzone"], .dropzone, [class*="dropzone"]');
    this.uploadButton = page.getByRole('button', { name: /upload|tải lên/i });
    this.templateDownload = page.getByRole('link', { name: /template|mẫu/i });
    this.previewTable = page.locator('[data-testid="preview-table"], .preview-table');
    this.confirmImportButton = page.getByRole('button', { name: /confirm|xác nhận|import/i });

    // SKU Form
    this.skuCodeInput = page.locator('[name="skuCode"], [data-testid="sku-code"]');
    this.styleNameInput = page.locator('[name="styleName"], [data-testid="style-name"]');
    this.colorInput = page.locator('[name="color"], [data-testid="color"]');
    this.categorySelect = page.locator('[name="category"], [data-testid="category-select"]');
    this.genderSelect = page.locator('[name="gender"], [data-testid="gender-select"]');
    this.retailPriceInput = page.locator('[name="retailPrice"], [data-testid="retail-price"]');
    this.costPriceInput = page.locator('[name="costPrice"], [data-testid="cost-price"]');
    this.quantityInput = page.locator('[name="quantity"], [data-testid="quantity"]');
    this.leadTimeInput = page.locator('[name="leadTime"], [data-testid="lead-time"]');
    this.moqInput = page.locator('[name="moq"], [data-testid="moq"]');
    this.saveButton = page.getByRole('button', { name: /save|lưu/i });

    // Detail view
    this.marginDisplay = page.locator('[data-testid="margin"], .margin-display');
    this.statusBadge = page.locator('[data-testid="status-badge"], .badge');
    this.validationMessages = page.locator('[data-testid="validation"], .validation-message');
    this.editButton = page.getByRole('button', { name: /edit|sửa/i });
    this.deleteButton = page.getByRole('button', { name: /delete|xóa/i });
    this.approveButton = page.getByRole('button', { name: /approve|duyệt/i });
    this.rejectButton = page.getByRole('button', { name: /reject|từ chối/i });

    // Size allocation
    this.sizeGrid = page.locator('[data-testid="size-grid"], .size-grid');
    this.sizeProfileSelect = page.locator('[data-testid="size-profile"], [name="sizeProfile"]');
    this.applySizeProfileButton = page.getByRole('button', { name: /apply.*profile|áp dụng/i });
  }

  async navigateToList(): Promise<void> {
    await this.goto('/sku-proposal');
  }

  async navigateToImport(): Promise<void> {
    await this.goto('/sku-proposal/import');
  }

  async navigateToDetail(skuId: string): Promise<void> {
    await this.goto(`/sku-proposal/${skuId}`);
  }

  async importFile(filePath: string): Promise<void> {
    await this.navigateToImport();
    await this.fileUpload.setInputFiles(filePath);
    await this.waitForPageLoad();
  }

  async confirmImport(): Promise<void> {
    if (await this.confirmImportButton.isVisible()) {
      await this.confirmImportButton.click();
      await this.waitForPageLoad();
    }
  }

  async addSKU(data: SKUData): Promise<void> {
    if (await this.addSKUButton.isVisible()) {
      await this.addSKUButton.click();
    }

    await this.skuCodeInput.fill(data.skuCode);
    await this.styleNameInput.fill(data.styleName);

    if (data.color && await this.colorInput.isVisible()) {
      await this.colorInput.fill(data.color);
    }

    if (data.category && await this.categorySelect.isVisible()) {
      await this.categorySelect.click();
      await this.page.locator('[role="option"]').filter({ hasText: data.category }).click();
    }

    if (data.gender && await this.genderSelect.isVisible()) {
      await this.genderSelect.click();
      await this.page.locator('[role="option"]').filter({ hasText: data.gender }).click();
    }

    await this.retailPriceInput.fill(String(data.retailPrice));
    await this.costPriceInput.fill(String(data.costPrice));

    if (data.quantity && await this.quantityInput.isVisible()) {
      await this.quantityInput.fill(String(data.quantity));
    }

    if (data.leadTime && await this.leadTimeInput.isVisible()) {
      await this.leadTimeInput.fill(String(data.leadTime));
    }

    if (data.moq && await this.moqInput.isVisible()) {
      await this.moqInput.fill(String(data.moq));
    }

    await this.saveButton.click();
    await this.waitForPageLoad();
  }

  async searchSKUs(query: string): Promise<void> {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query);
      await this.searchInput.press('Enter');
      await this.waitForPageLoad();
    }
  }

  async filterByCategory(category: string): Promise<void> {
    if (await this.categoryFilter.isVisible()) {
      await this.categoryFilter.click();
      await this.page.locator('[role="option"]').filter({ hasText: category }).click();
      await this.waitForPageLoad();
    }
  }

  async filterByStatus(status: string): Promise<void> {
    if (await this.statusFilter.isVisible()) {
      await this.statusFilter.click();
      await this.page.locator('[role="option"]').filter({ hasText: status }).click();
      await this.waitForPageLoad();
    }
  }

  async clickFirstSKURow(): Promise<void> {
    const firstRow = this.page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await this.waitForPageLoad();
    }
  }

  async applySizeProfile(profile: string): Promise<void> {
    if (await this.sizeProfileSelect.isVisible()) {
      await this.sizeProfileSelect.click();
      await this.page.locator('[role="option"]').filter({ hasText: profile }).click();
    }
    if (await this.applySizeProfileButton.isVisible()) {
      await this.applySizeProfileButton.click();
      await this.waitForPageLoad();
    }
  }

  async setSizeAllocation(size: string, quantity: number): Promise<void> {
    const sizeInput = this.sizeGrid.locator(`[data-size="${size}"] input, td:has-text("${size}") + td input`);
    if (await sizeInput.isVisible()) {
      await sizeInput.fill(String(quantity));
    }
  }

  async getMargin(): Promise<number> {
    const text = await this.marginDisplay.textContent();
    return parseFloat(text?.replace(/[^0-9.]/g, '') || '0');
  }

  async expectValidationError(message?: string | RegExp): Promise<void> {
    await expect(this.validationMessages).toBeVisible();
    if (message) {
      await expect(this.validationMessages).toContainText(message);
    }
  }

  async approveSKU(): Promise<void> {
    if (await this.approveButton.isVisible()) {
      await this.approveButton.click();
      await this.confirmAction();
      await this.waitForPageLoad();
    }
  }

  async rejectSKU(reason: string): Promise<void> {
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

  async getSKUCount(): Promise<number> {
    return this.getTableRowCount();
  }

  async downloadTemplate(): Promise<void> {
    if (await this.templateDownload.isVisible()) {
      await this.templateDownload.click();
    }
  }
}
