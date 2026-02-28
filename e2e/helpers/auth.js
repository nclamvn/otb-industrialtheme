// E2E Authentication helpers

const TEST_CREDENTIALS = {
  admin: { email: 'admin@dafc.vn', password: 'admin123' },
  manager: { email: 'manager@dafc.vn', password: 'manager123' },
  viewer: { email: 'viewer@dafc.vn', password: 'viewer123' },
};

/**
 * Login via UI
 */
export async function loginViaUI(page, role = 'admin') {
  const creds = TEST_CREDENTIALS[role];
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', creds.email);
  await page.fill('input[name="password"], input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

/**
 * Login via localStorage (faster, skip UI)
 */
export async function loginViaToken(page, role = 'admin') {
  const creds = TEST_CREDENTIALS[role];
  await page.goto('/login');
  await page.evaluate(({ email }) => {
    localStorage.setItem('accessToken', 'test-token-' + email);
    localStorage.setItem('refreshToken', 'test-refresh-' + email);
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test User', email, role: 'ADMIN' }));
  }, creds);
  await page.goto('/');
}

/**
 * Logout helper
 */
export async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  });
  await page.goto('/login');
}
