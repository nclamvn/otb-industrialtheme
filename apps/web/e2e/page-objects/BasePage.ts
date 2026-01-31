/**
 * Base Page Object - Common methods for all pages
 */
import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  // Common selectors
  readonly loadingSpinner: Locator;
  readonly toastMessage: Locator;
  readonly errorAlert: Locator;
  readonly successAlert: Locator;
  readonly confirmDialog: Locator;
  readonly userMenu: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loadingSpinner = page.locator('[data-testid="loading"], .loading-spinner, [class*="spinner"]');
    this.toastMessage = page.locator('[data-sonner-toast], [role="alert"], [data-testid="toast"]');
    this.errorAlert = page.locator('.text-destructive, .text-red-500, [data-variant="destructive"]');
    this.successAlert = page.locator('[data-variant="success"], .text-green-500');
    this.confirmDialog = page.locator('[role="alertdialog"], [data-testid="confirm-dialog"]');
    this.userMenu = page.locator('[data-testid="user-nav"], button[aria-label*="user"]');
    this.mainContent = page.locator('main, [role="main"]');
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    // Wait for any loading spinners to disappear
    if (await this.loadingSpinner.isVisible()) {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }

  async expectToastSuccess(message?: string | RegExp): Promise<void> {
    await expect(this.toastMessage).toBeVisible({ timeout: 5000 });
    if (message) {
      await expect(this.toastMessage).toContainText(message);
    }
  }

  async expectToastError(message?: string | RegExp): Promise<void> {
    await expect(this.toastMessage).toBeVisible({ timeout: 5000 });
    if (message) {
      await expect(this.toastMessage).toContainText(message);
    }
  }

  async confirmAction(): Promise<void> {
    if (await this.confirmDialog.isVisible()) {
      const confirmBtn = this.confirmDialog.getByRole('button', { name: /confirm|yes|ok|đồng ý|xác nhận/i });
      await confirmBtn.click();
    }
  }

  async cancelAction(): Promise<void> {
    if (await this.confirmDialog.isVisible()) {
      const cancelBtn = this.confirmDialog.getByRole('button', { name: /cancel|no|hủy/i });
      await cancelBtn.click();
    }
  }

  async clickButton(name: string | RegExp): Promise<void> {
    const button = this.page.getByRole('button', { name });
    await button.click();
  }

  async fillInput(labelOrName: string, value: string): Promise<void> {
    const input = this.page.getByLabel(new RegExp(labelOrName, 'i'))
      .or(this.page.locator(`[name="${labelOrName}"]`))
      .or(this.page.locator(`[data-testid="${labelOrName}"]`));

    await input.fill(value);
  }

  async selectOption(labelOrName: string, optionText: string | RegExp): Promise<void> {
    const select = this.page.getByLabel(new RegExp(labelOrName, 'i'))
      .or(this.page.locator(`[name="${labelOrName}"]`))
      .or(this.page.locator(`[data-testid="${labelOrName}"]`));

    await select.click();
    await this.page.locator('[role="option"]').filter({ hasText: optionText }).click();
  }

  async getTableRowCount(): Promise<number> {
    const rows = this.page.locator('table tbody tr');
    return rows.count();
  }

  async clickTableRow(index: number): Promise<void> {
    const row = this.page.locator('table tbody tr').nth(index);
    await row.click();
  }

  async getPageTitle(): Promise<string> {
    const title = this.page.locator('h1').first();
    return (await title.textContent()) || '';
  }

  async takeScreenshot(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({
      path: `e2e/screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  async logout(): Promise<void> {
    if (await this.userMenu.isVisible()) {
      await this.userMenu.click();
      const logoutBtn = this.page.getByRole('menuitem', { name: /logout|sign out|đăng xuất/i });
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await this.page.waitForURL(/login/);
      }
    }
  }
}
