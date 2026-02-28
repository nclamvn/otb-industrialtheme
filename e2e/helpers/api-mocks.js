// E2E API Mock helpers using Playwright route interception

const API_BASE = '**/api/v1/**';

/**
 * Mock all API routes with default responses
 */
export async function setupApiMocks(page) {
  // Health check
  await page.route('**/api/v1/health', (route) =>
    route.fulfill({ json: { status: 'ok', timestamp: new Date().toISOString() } })
  );

  // Auth
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      json: { accessToken: 'mock-jwt', refreshToken: 'mock-refresh', user: { id: '1', name: 'Admin', role: 'ADMIN' } },
    })
  );

  await page.route('**/api/v1/auth/profile', (route) =>
    route.fulfill({
      json: { id: '1', name: 'Admin User', email: 'admin@dafc.vn', role: 'ADMIN' },
    })
  );

  // Budgets
  await page.route('**/api/v1/budgets?**', (route) =>
    route.fulfill({
      json: {
        data: [
          { id: '1', budgetCode: 'BUD-LV-SS-PRE-2025', status: 'DRAFT', totalBudget: 5000000000, groupBrand: { name: 'Louis Vuitton' } },
        ],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      },
    })
  );

  await page.route('**/api/v1/budgets/statistics**', (route) =>
    route.fulfill({
      json: { totalBudgets: 10, totalAmount: 50000000000, approvedAmount: 30000000000, byStatus: { DRAFT: 3, SUBMITTED: 2, APPROVED: 5 } },
    })
  );

  // Master data
  await page.route('**/api/v1/master-data/brands', (route) =>
    route.fulfill({
      json: [
        { id: 'b1', name: 'Louis Vuitton', code: 'LV' },
        { id: 'b2', name: 'Dior', code: 'DIO' },
      ],
    })
  );

  await page.route('**/api/v1/master-data/stores', (route) =>
    route.fulfill({
      json: [
        { id: 's1', name: 'TTTM Vincom Center', code: 'HCM01' },
        { id: 's2', name: 'Trang Tien Plaza', code: 'HN01' },
      ],
    })
  );

  await page.route('**/api/v1/master-data/seasons', (route) =>
    route.fulfill({ json: [] })
  );
}

/**
 * Mock a specific endpoint with custom response
 */
export async function mockEndpoint(page, urlPattern, response, options = {}) {
  await page.route(urlPattern, (route) =>
    route.fulfill({
      status: options.status || 200,
      json: response,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

/**
 * Wait for a specific API call
 */
export async function waitForApi(page, urlPattern) {
  return page.waitForResponse((response) =>
    response.url().includes(urlPattern) && response.status() === 200
  );
}
