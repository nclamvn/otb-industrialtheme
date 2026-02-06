import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

// API Error response interface
export interface APIError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId: string;
    timestamp: string;
  };
}

// API Success response interface
export interface APISuccess<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// Create error response
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): NextResponse<APIError> {
  const status = ERROR_CODES[code];
  const requestId = uuidv4();

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
        requestId,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// Create success response
export function createSuccessResponse<T>(
  data: T,
  meta?: APISuccess<T>['meta']
): NextResponse<APISuccess<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

// Validation error response
export function validationError(
  message: string,
  details?: unknown
): NextResponse<APIError> {
  return createErrorResponse('VALIDATION_ERROR', message, details);
}

// Unauthorized error response
export function unauthorizedError(
  message: string = 'Authentication required'
): NextResponse<APIError> {
  return createErrorResponse('UNAUTHORIZED', message);
}

// Forbidden error response
export function forbiddenError(
  message: string = 'Access denied'
): NextResponse<APIError> {
  return createErrorResponse('FORBIDDEN', message);
}

// Not found error response
export function notFoundError(
  resource: string = 'Resource'
): NextResponse<APIError> {
  return createErrorResponse('NOT_FOUND', `${resource} not found`);
}

// Internal server error response
export function internalError(
  message: string = 'An unexpected error occurred'
): NextResponse<APIError> {
  return createErrorResponse('INTERNAL_ERROR', message);
}

// Rate limit error response
export function rateLimitError(retryAfter: number): NextResponse<APIError> {
  const response = createErrorResponse(
    'RATE_LIMITED',
    'Too many requests. Please try again later.',
    { retryAfter }
  );

  response.headers.set('Retry-After', String(retryAfter));
  return response;
}

// Error handler wrapper for API routes
export async function withErrorHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse<APIError>> {
  try {
    return await handler();
  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof Error) {
      // Check for known error types
      if (error.message.includes('Unauthorized')) {
        return unauthorizedError();
      }
      if (error.message.includes('Forbidden')) {
        return forbiddenError();
      }
      if (error.message.includes('not found')) {
        return notFoundError();
      }
    }

    return internalError();
  }
}
