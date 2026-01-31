/**
 * Optimized TanStack Query Client Configuration
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// ============================================
// QUERY CLIENT CONFIGURATION
// ============================================

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Log errors for debugging
        console.error(`Query error [${query.queryKey}]:`, error);

        // Show toast for user-facing errors
        if (error instanceof Error && !error.message.includes('AbortError')) {
          // Could integrate with toast here
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    }),
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh
        staleTime: 1000 * 60 * 5, // 5 minutes

        // Cache time - how long inactive data stays in cache
        gcTime: 1000 * 60 * 30, // 30 minutes

        // Retry configuration
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch configuration
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,

        // Network mode
        networkMode: 'offlineFirst',

        // Structural sharing for better performance
        structuralSharing: true,
      },
      mutations: {
        retry: 1,
        networkMode: 'offlineFirst',
      },
    },
  });
}

// Singleton for client-side
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create new client
    return createQueryClient();
  }

  // Browser: reuse client
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}

// ============================================
// QUERY KEY FACTORY
// ============================================

export const queryKeys = {
  // Budget
  budgets: {
    all: ['budgets'] as const,
    lists: () => [...queryKeys.budgets.all, 'list'] as const,
    list: (seasonCode: string) => [...queryKeys.budgets.lists(), seasonCode] as const,
    details: () => [...queryKeys.budgets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.budgets.details(), id] as const,
    tree: (id: string) => [...queryKeys.budgets.detail(id), 'tree'] as const,
    versions: (id: string) => [...queryKeys.budgets.detail(id), 'versions'] as const,
    gaps: (id: string) => [...queryKeys.budgets.detail(id), 'gaps'] as const,
  },

  // SKU
  skus: {
    all: ['skus'] as const,
    lists: () => [...queryKeys.skus.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.skus.lists(), filters] as const,
    details: () => [...queryKeys.skus.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.skus.details(), id] as const,
    costing: (skuId: string) => [...queryKeys.skus.detail(skuId), 'costing'] as const,
    byBrand: (brandId: string) => [...queryKeys.skus.all, 'brand', brandId] as const,
  },

  // Stores
  stores: {
    all: ['stores'] as const,
    lists: () => [...queryKeys.stores.all, 'list'] as const,
    list: () => [...queryKeys.stores.lists()] as const,
    details: () => [...queryKeys.stores.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.stores.details(), id] as const,
    performance: (storeId: string, period?: string) =>
      [...queryKeys.stores.detail(storeId), 'performance', period] as const,
  },

  // Delivery
  delivery: {
    all: ['delivery'] as const,
    matrix: (seasonCode: string) => [...queryKeys.delivery.all, 'matrix', seasonCode] as const,
    plans: () => [...queryKeys.delivery.all, 'plans'] as const,
    plan: (planId: string) => [...queryKeys.delivery.plans(), planId] as const,
    summary: (seasonCode: string) => [...queryKeys.delivery.all, 'summary', seasonCode] as const,
  },

  // Costing
  costing: {
    all: ['costing'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.costing.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.costing.all, 'detail', id] as const,
    priceRanges: () => [...queryKeys.costing.all, 'price-ranges'] as const,
  },

  // Master data (longer TTL)
  master: {
    all: ['master'] as const,
    categories: () => [...queryKeys.master.all, 'categories'] as const,
    brands: () => [...queryKeys.master.all, 'brands'] as const,
    seasons: () => [...queryKeys.master.all, 'seasons'] as const,
    sizeProfiles: () => [...queryKeys.master.all, 'sizeProfiles'] as const,
    divisions: () => [...queryKeys.master.all, 'divisions'] as const,
  },

  // Approvals
  approvals: {
    all: ['approvals'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.approvals.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.approvals.all, 'detail', id] as const,
    pending: () => [...queryKeys.approvals.all, 'pending'] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    kpis: (period?: string) => [...queryKeys.analytics.all, 'kpis', period] as const,
    trends: (metric: string) => [...queryKeys.analytics.all, 'trends', metric] as const,
  },
} as const;

// ============================================
// STALE TIME CONFIGURATIONS
// ============================================

export const staleTimes = {
  // Very fresh data (changes frequently)
  REALTIME: 1000 * 10, // 10 seconds
  FRESH: 1000 * 30, // 30 seconds

  // Normal data
  SHORT: 1000 * 60, // 1 minute
  MEDIUM: 1000 * 60 * 5, // 5 minutes
  LONG: 1000 * 60 * 15, // 15 minutes

  // Rarely changing data
  STATIC: 1000 * 60 * 60, // 1 hour
  MASTER: 1000 * 60 * 60 * 24, // 24 hours (master data)
} as const;

// ============================================
// GC TIME CONFIGURATIONS
// ============================================

export const gcTimes = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 30, // 30 minutes
  LONG: 1000 * 60 * 60, // 1 hour
  PERSISTENT: 1000 * 60 * 60 * 24, // 24 hours
} as const;
