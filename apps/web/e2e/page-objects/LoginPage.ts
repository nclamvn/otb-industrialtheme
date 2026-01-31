/**
 * Login Page Object - Authentication flows
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface UserCredentials {
  email: string;
  password: string;
  role?: string;
  name?: string;
}

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByLabel(/password|mật khẩu/i).or(page.locator('input[type="password"]'));
    this.loginButton = page.getByRole('button', { name: /sign in|login|đăng nhập/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot|quên/i });
    this.errorMessage = page.locator('.text-destructive, [role="alert"]');
    this.rememberMeCheckbox = page.getByLabel(/remember|ghi nhớ/i);
  }

  async navigate(): Promise<void> {
    await this.goto('/auth/login');
  }

  async login(user: UserCredentials): Promise<void> {
    await this.navigate();
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.loginButton.click();
    await this.page.waitForURL(/dashboard|\/$/);
  }

  async loginWithRememberMe(user: UserCredentials): Promise<void> {
    await this.navigate();
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    if (await this.rememberMeCheckbox.isVisible()) {
      await this.rememberMeCheckbox.check();
    }
    await this.loginButton.click();
    await this.page.waitForURL(/dashboard|\/$/);
  }

  async loginWithInvalidCredentials(email: string, password: string): Promise<void> {
    await this.navigate();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }

  async expectErrorMessage(message?: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectSuccessfulLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/dashboard|\/$/, { timeout: 10000 });
  }

  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/forgot-password/);
  }

  async isLoggedIn(): Promise<boolean> {
    const url = this.page.url();
    return !url.includes('/login') && !url.includes('/auth');
  }
}
