import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Mock auth context
const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// All providers wrapper
interface AllProvidersProps {
  children: ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>{children}</MockAuthProvider>
    </QueryClientProvider>
  );
};

// Custom render with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { userEvent };

// Mock data generators
export const mockUser = (overrides = {}) => ({
  id: 'user-001',
  email: 'test@example.com',
  name: 'Test User',
  role: 'ADMIN',
  avatar: null,
  ...overrides,
});

export const mockBudget = (overrides = {}) => ({
  id: 'budget-001',
  seasonId: 'season-001',
  brandId: 'brand-001',
  totalBudget: 1000000,
  status: 'DRAFT',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const mockOtbPlan = (overrides = {}) => ({
  id: 'otb-001',
  budgetId: 'budget-001',
  name: 'Test OTB Plan',
  status: 'DRAFT',
  totalBudget: 1000000,
  allocatedBudget: 0,
  ...overrides,
});

export const mockSeason = (overrides = {}) => ({
  id: 'season-001',
  name: 'Spring/Summer 2025',
  code: 'SS25',
  startDate: '2025-02-01',
  endDate: '2025-07-31',
  isActive: true,
  ...overrides,
});

export const mockBrand = (overrides = {}) => ({
  id: 'brand-001',
  name: 'Nike',
  code: 'NK',
  isActive: true,
  ...overrides,
});

// API mock helpers
export const mockApiResponse = <T,>(data: T, meta?: any) => ({
  success: true,
  data,
  meta,
});

export const mockApiError = (message: string, code = 'ERROR') => ({
  success: false,
  error: { message, code },
});

export const mockPaginatedResponse = <T,>(
  data: T[],
  page = 1,
  limit = 20,
  total?: number,
) => ({
  success: true,
  data,
  meta: {
    total: total ?? data.length,
    page,
    limit,
    totalPages: Math.ceil((total ?? data.length) / limit),
  },
});

// Wait helpers
export const waitForAsync = (ms: number = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Form helpers
export const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  fields: Record<string, string>,
) => {
  for (const [selector, value] of Object.entries(fields)) {
    const input = document.querySelector(selector);
    if (input) {
      await user.clear(input as HTMLInputElement);
      await user.type(input as HTMLInputElement, value);
    }
  }
};

// Accessibility helpers
export const checkA11y = async (container: HTMLElement) => {
  // Basic a11y checks
  const images = container.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.getAttribute('alt')) {
      console.warn('Image missing alt attribute:', img);
    }
  });

  const buttons = container.querySelectorAll('button');
  buttons.forEach((button) => {
    if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
      console.warn('Button missing accessible name:', button);
    }
  });
};
