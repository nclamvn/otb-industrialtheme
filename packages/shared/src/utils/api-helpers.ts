import type { ApiResponse, PaginationMeta } from '../types/api';

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  meta?: PaginationMeta
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  details?: unknown
): ApiResponse<never> {
  const response: ApiResponse<never> = {
    success: false,
    error,
  };
  if (details !== undefined) {
    response.details = details;
  }
  return response;
}

/**
 * Create pagination meta
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Parse pagination params from query string
 */
export function parsePaginationParams(params: Record<string, string | undefined>) {
  return {
    page: Math.max(1, parseInt(params.page || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(params.limit || '20', 10))),
    skip: 0, // Will be calculated
  };
}

/**
 * Calculate skip for Prisma pagination
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Handle Prisma error codes
 */
export function handlePrismaError(error: unknown): ApiResponse<never> {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };

    switch (prismaError.code) {
      case 'P2002':
        const target = prismaError.meta?.target?.join(', ') || 'field';
        return errorResponse(`Duplicate value: ${target} already exists`);

      case 'P2025':
        return errorResponse('Record not found');

      case 'P2003':
        return errorResponse('Invalid reference: related record not found');

      case 'P2014':
        return errorResponse('The change would violate a required relation');

      default:
        return errorResponse('Database error occurred');
    }
  }

  if (error instanceof Error) {
    return errorResponse(error.message);
  }

  return errorResponse('An unexpected error occurred');
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    }
  }

  return missingFields;
}
