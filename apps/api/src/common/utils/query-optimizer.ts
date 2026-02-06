/**
 * Database Query Optimization Utilities
 *
 * Provides optimized query patterns for Prisma
 */

import { Prisma } from '@prisma/client';

// ============================================
// CURSOR-BASED PAGINATION
// ============================================

export interface CursorPaginationParams {
  cursor?: string;
  take?: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginationResult<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount?: number;
  };
}

/**
 * Build cursor pagination parameters for Prisma
 */
export function buildCursorPagination(params: CursorPaginationParams) {
  const { cursor, take = 20, direction = 'forward' } = params;

  return {
    take: direction === 'forward' ? take + 1 : -(take + 1),
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  };
}

/**
 * Process cursor pagination result
 */
export function processCursorResult<T extends { id: string }>(
  items: T[],
  take: number,
  direction: 'forward' | 'backward' = 'forward'
): CursorPaginationResult<T> {
  const hasMore = items.length > take;
  const data = hasMore ? items.slice(0, take) : items;

  if (direction === 'backward') {
    data.reverse();
  }

  return {
    data,
    pageInfo: {
      hasNextPage: direction === 'forward' ? hasMore : data.length > 0,
      hasPreviousPage: direction === 'backward' ? hasMore : data.length > 0,
      startCursor: data[0]?.id ?? null,
      endCursor: data[data.length - 1]?.id ?? null,
    },
  };
}

// ============================================
// OFFSET PAGINATION
// ============================================

export interface OffsetPaginationParams {
  page?: number;
  limit?: number;
}

export interface OffsetPaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Build offset pagination parameters
 */
export function buildOffsetPagination(params: OffsetPaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}

/**
 * Process offset pagination result
 */
export function processOffsetResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): OffsetPaginationResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// ============================================
// SELECT OPTIMIZATION
// ============================================

/**
 * Minimal select fields to reduce data transfer
 */
export const selectMinimal = {
  sku: {
    id: true,
    skuCode: true,
    name: true,
    status: true,
  } as const,

  skuWithBrand: {
    id: true,
    skuCode: true,
    name: true,
    status: true,
    brand: {
      select: {
        id: true,
        name: true,
        code: true,
      },
    },
  } as const,

  store: {
    id: true,
    code: true,
    name: true,
    type: true,
  } as const,

  budget: {
    id: true,
    totalBudget: true,
    status: true,
    version: true,
  } as const,

  budgetWithRelations: {
    id: true,
    totalBudget: true,
    seasonalBudget: true,
    replenishmentBudget: true,
    status: true,
    version: true,
    season: {
      select: {
        id: true,
        code: true,
        name: true,
      },
    },
    brand: {
      select: {
        id: true,
        code: true,
        name: true,
      },
    },
    location: {
      select: {
        id: true,
        code: true,
        name: true,
      },
    },
  } as const,

  user: {
    id: true,
    name: true,
    email: true,
    avatar: true,
  } as const,
} as const;

// ============================================
// BATCH LOADING (DataLoader Pattern)
// ============================================

/**
 * Generic batch loader for N+1 prevention
 */
export async function batchLoad<T, K extends string | number>(
  ids: K[],
  loader: (ids: K[]) => Promise<T[]>,
  keyExtractor: (item: T) => K
): Promise<Map<K, T>> {
  if (ids.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(ids)];
  const items = await loader(uniqueIds);
  return new Map(items.map((item) => [keyExtractor(item), item]));
}

/**
 * Create a simple DataLoader-like function
 */
export function createBatchLoader<T, K extends string | number>(
  loader: (ids: K[]) => Promise<T[]>,
  keyExtractor: (item: T) => K
) {
  const cache = new Map<K, T>();
  let pendingIds: K[] = [];
  let pendingPromise: Promise<void> | null = null;
  let resolvers: Map<K, { resolve: (value: T | null) => void }> = new Map();

  const scheduleBatch = () => {
    if (pendingPromise) return;

    pendingPromise = Promise.resolve().then(async () => {
      const ids = [...pendingIds];
      const currentResolvers = new Map(resolvers);
      pendingIds = [];
      resolvers = new Map();
      pendingPromise = null;

      try {
        const items = await loader(ids);
        const itemMap = new Map(items.map((item) => [keyExtractor(item), item]));

        for (const id of ids) {
          const item = itemMap.get(id) || null;
          if (item) cache.set(id, item);
          currentResolvers.get(id)?.resolve(item);
        }
      } catch (error) {
        for (const id of ids) {
          currentResolvers.get(id)?.resolve(null);
        }
      }
    });
  };

  return {
    load: (id: K): Promise<T | null> => {
      const cached = cache.get(id);
      if (cached) return Promise.resolve(cached);

      return new Promise((resolve) => {
        pendingIds.push(id);
        resolvers.set(id, { resolve });
        scheduleBatch();
      });
    },
    loadMany: async (ids: K[]): Promise<(T | null)[]> => {
      return Promise.all(ids.map((id) => cache.get(id) || null));
    },
    clear: () => {
      cache.clear();
    },
    prime: (id: K, value: T) => {
      cache.set(id, value);
    },
  };
}

// ============================================
// QUERY BUILDING HELPERS
// ============================================

/**
 * Build where clause from filters
 */
export function buildWhereClause<T extends Record<string, unknown>>(
  filters: T,
  fieldMappings?: Record<keyof T, string>
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const fieldName = fieldMappings?.[key as keyof T] || key;

    if (typeof value === 'string') {
      // Check if it's a search field (contains, startsWith, etc.)
      if (key.endsWith('_contains')) {
        where[fieldName.replace('_contains', '')] = {
          contains: value,
          mode: 'insensitive',
        };
      } else if (key.endsWith('_startsWith')) {
        where[fieldName.replace('_startsWith', '')] = {
          startsWith: value,
          mode: 'insensitive',
        };
      } else {
        where[fieldName] = value;
      }
    } else if (Array.isArray(value) && value.length > 0) {
      where[fieldName] = { in: value };
    } else if (typeof value === 'object' && value !== null) {
      // Handle range queries
      const rangeObj = value as Record<string, unknown>;
      if ('min' in rangeObj || 'max' in rangeObj) {
        where[fieldName] = {
          ...(rangeObj.min !== undefined && { gte: rangeObj.min }),
          ...(rangeObj.max !== undefined && { lte: rangeObj.max }),
        };
      } else {
        where[fieldName] = value;
      }
    } else {
      where[fieldName] = value;
    }
  }

  return where;
}

/**
 * Build orderBy clause
 */
export function buildOrderBy(
  sortField?: string,
  sortOrder?: 'asc' | 'desc',
  defaultField = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc'
): { [key: string]: 'asc' | 'desc' } {
  return {
    [sortField || defaultField]: sortOrder || defaultOrder,
  };
}

// ============================================
// RAW QUERY HELPERS
// ============================================

/**
 * Safe template tag for raw SQL queries
 */
export function rawSql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Prisma.Sql {
  return Prisma.sql(strings, ...values);
}

/**
 * Build IN clause for raw queries
 */
export function buildInClause(values: (string | number)[]): string {
  if (values.length === 0) return "('')";
  return `(${values.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(',')})`;
}

// ============================================
// PERFORMANCE UTILITIES
// ============================================

/**
 * Log query execution time
 */
export async function withTiming<T>(
  name: string,
  operation: () => Promise<T>,
  threshold = 100
): Promise<T> {
  const start = Date.now();
  const result = await operation();
  const duration = Date.now() - start;

  if (duration > threshold) {
    console.warn(`[SLOW QUERY] ${name}: ${duration}ms`);
  }

  return result;
}

/**
 * Chunk array for batch operations
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Execute in batches to avoid overwhelming the database
 */
export async function executeInBatches<T, R>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<R[]>,
  delayMs = 0
): Promise<R[]> {
  const results: R[] = [];
  const chunks = chunkArray(items, batchSize);

  for (let i = 0; i < chunks.length; i++) {
    const batchResults = await operation(chunks[i]);
    results.push(...batchResults);

    if (delayMs > 0 && i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
