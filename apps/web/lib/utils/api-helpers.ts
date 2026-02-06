// lib/utils/api-helpers.ts
// Shared utilities for API routes - error handling, validation, responses

import { NextResponse } from 'next/server';

/**
 * Standard API response type
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: unknown
): NextResponse<ApiResponse> {
  const isDev = process.env.NODE_ENV === 'development';
  const response: ApiResponse = {
    success: false,
    error,
  };
  if (isDev && details) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}

/**
 * Safely parse JSON from request body
 * Returns [data, null] on success, [null, Response] on error
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request
): Promise<[T | null, NextResponse<ApiResponse> | null]> {
  try {
    const body = await request.json();
    return [body as T, null];
  } catch (error) {
    console.error('JSON parse error:', error);
    return [null, errorResponse('Invalid JSON in request body', 400)];
  }
}

/**
 * Handle Prisma errors and return appropriate response
 */
export function handlePrismaError(
  error: unknown,
  context?: string
): NextResponse<ApiResponse> | null {
  const err = error as { code?: string; meta?: { target?: string[]; field_name?: string }; message?: string; name?: string };

  // Check for Prisma known request errors (have a code starting with P)
  if (err.code && err.code.startsWith('P')) {
    console.error(`Prisma error${context ? ` (${context})` : ''}:`, {
      code: err.code,
      meta: err.meta,
      message: err.message,
    });

    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = err.meta?.target?.join(', ') || 'field';
        return errorResponse(`Duplicate value: ${target} already exists`, 409, err.meta);
      }
      case 'P2003': {
        // Foreign key constraint failure
        const field = err.meta?.field_name || 'reference';
        return errorResponse(`Invalid ${field}: referenced record does not exist`, 400, err.meta);
      }
      case 'P2025': {
        // Record not found
        return errorResponse('Record not found', 404, err.meta);
      }
      case 'P2014': {
        // Required relation violation
        return errorResponse('Cannot delete: record has related data', 400, err.meta);
      }
      case 'P2016': {
        // Query interpretation error
        return errorResponse('Invalid query parameters', 400, err.meta);
      }
      default:
        return errorResponse(`Database error: ${err.code}`, 500, err.meta);
    }
  }

  // Check for Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    console.error('Prisma validation error:', err.message);
    return errorResponse('Invalid data format', 400, err.message);
  }

  // Not a Prisma error, return null to let caller handle it
  return null;
}

/**
 * Validate required fields in request body
 * Returns error response if validation fails, null if all fields present
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: { name: string; type?: 'string' | 'number' | 'array' | 'object'; label?: string }[]
): NextResponse<ApiResponse> | null {
  for (const field of fields) {
    const value = body[field.name];
    const label = field.label || field.name;

    if (value === undefined || value === null) {
      return errorResponse(`${label} is required`, 400);
    }

    if (field.type === 'string' && (typeof value !== 'string' || value.trim() === '')) {
      return errorResponse(`${label} must be a non-empty string`, 400);
    }

    if (field.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
      return errorResponse(`${label} must be a valid number`, 400);
    }

    if (field.type === 'array' && !Array.isArray(value)) {
      return errorResponse(`${label} must be an array`, 400);
    }

    if (field.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
      return errorResponse(`${label} must be an object`, 400);
    }
  }

  return null;
}

/**
 * Validate that a number is positive
 */
export function validatePositiveNumber(
  value: unknown,
  fieldName: string
): NextResponse<ApiResponse> | null {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    return errorResponse(`${fieldName} must be a positive number`, 400);
  }
  return null;
}

/**
 * Validate that a string is a valid UUID/CUID
 */
export function validateId(
  value: unknown,
  fieldName: string
): NextResponse<ApiResponse> | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return errorResponse(`Invalid ${fieldName}`, 400);
  }
  return null;
}

/**
 * Wrap async handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>,
  context?: string
): Promise<NextResponse<T | ApiResponse>> {
  return handler().catch((error) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);

    // Try to handle as Prisma error
    const prismaResponse = handlePrismaError(error, context);
    if (prismaResponse) return prismaResponse;

    // Generic error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(
      `Failed to ${context || 'process request'}`,
      500,
      errorMessage
    );
  });
}

/**
 * Convert value to number safely (Prisma handles Decimal conversion automatically)
 */
export function toDecimal(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
}
