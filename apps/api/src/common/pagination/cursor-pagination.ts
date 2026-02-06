import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cursor-based pagination DTO
 * More efficient than offset pagination for large datasets
 */
export class CursorPaginationDto {
  @ApiPropertyOptional({ description: 'Cursor for pagination (ID of last item)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Direction of pagination', enum: ['forward', 'backward'], default: 'forward' })
  @IsOptional()
  @IsString()
  direction?: 'forward' | 'backward' = 'forward';
}

/**
 * Cursor-based pagination response
 */
export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount?: number;
  };
}

/**
 * Options for cursor pagination query
 */
export interface CursorPaginationOptions {
  cursor?: string;
  limit: number;
  direction?: 'forward' | 'backward';
  cursorField?: string; // Default: 'id'
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * Build Prisma query options for cursor pagination
 */
export function buildCursorPaginationQuery<T>(
  options: CursorPaginationOptions,
): {
  take: number;
  skip?: number;
  cursor?: Record<string, string>;
  orderBy?: Record<string, 'asc' | 'desc'>[];
} {
  const {
    cursor,
    limit,
    direction = 'forward',
    cursorField = 'id',
    orderBy = { createdAt: 'desc' },
  } = options;

  const query: any = {
    take: direction === 'forward' ? limit + 1 : -(limit + 1), // +1 to check if there's a next page
  };

  if (cursor) {
    query.skip = 1; // Skip the cursor itself
    query.cursor = { [cursorField]: cursor };
  }

  // Convert orderBy to array format
  query.orderBy = Object.entries(orderBy).map(([key, value]) => ({
    [key]: value,
  }));

  return query;
}

/**
 * Process cursor pagination results
 */
export function processCursorPaginationResult<T extends { id: string }>(
  items: T[],
  limit: number,
  direction: 'forward' | 'backward' = 'forward',
  totalCount?: number,
): CursorPaginatedResponse<T> {
  // Check if there are more items
  const hasMore = items.length > limit;

  // Remove the extra item used to check for more
  if (hasMore) {
    if (direction === 'forward') {
      items.pop();
    } else {
      items.shift();
    }
  }

  // Reverse items if going backward
  if (direction === 'backward') {
    items.reverse();
  }

  const hasNextPage = direction === 'forward' ? hasMore : true;
  const hasPreviousPage = direction === 'backward' ? hasMore : !!items.length;

  return {
    data: items,
    meta: {
      hasNextPage,
      hasPreviousPage,
      startCursor: items.length > 0 ? items[0].id : null,
      endCursor: items.length > 0 ? items[items.length - 1].id : null,
      totalCount,
    },
  };
}

/**
 * Encode cursor (for complex cursors with multiple fields)
 */
export function encodeCursor(data: Record<string, any>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decode cursor
 */
export function decodeCursor(cursor: string): Record<string, any> | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Helper class for building cursor-paginated queries
 */
export class CursorPaginationBuilder<T extends { id: string }> {
  private options: CursorPaginationOptions;

  constructor(dto: CursorPaginationDto) {
    this.options = {
      cursor: dto.cursor,
      limit: dto.limit || 20,
      direction: dto.direction || 'forward',
      cursorField: 'id',
      orderBy: { createdAt: 'desc' },
    };
  }

  /**
   * Set the cursor field (default: 'id')
   */
  cursorField(field: string): this {
    this.options.cursorField = field;
    return this;
  }

  /**
   * Set the order by clause
   */
  orderBy(orderBy: Record<string, 'asc' | 'desc'>): this {
    this.options.orderBy = orderBy;
    return this;
  }

  /**
   * Build the Prisma query options
   */
  build(): ReturnType<typeof buildCursorPaginationQuery> {
    return buildCursorPaginationQuery(this.options);
  }

  /**
   * Process the query results
   */
  processResults(items: T[], totalCount?: number): CursorPaginatedResponse<T> {
    return processCursorPaginationResult(
      items,
      this.options.limit,
      this.options.direction,
      totalCount,
    );
  }
}

/**
 * Create a cursor pagination builder
 */
export function cursorPaginate<T extends { id: string }>(
  dto: CursorPaginationDto,
): CursorPaginationBuilder<T> {
  return new CursorPaginationBuilder<T>(dto);
}

// ============================================
// OFFSET PAGINATION (for backward compatibility)
// ============================================

/**
 * Standard offset-based pagination DTO
 */
export class OffsetPaginationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Offset-based pagination response
 */
export interface OffsetPaginatedResponse<T> {
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
 * Build offset pagination query for Prisma
 */
export function buildOffsetPaginationQuery(dto: OffsetPaginationDto): {
  skip: number;
  take: number;
} {
  const page = dto.page || 1;
  const limit = dto.limit || 20;

  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Process offset pagination results
 */
export function processOffsetPaginationResult<T>(
  items: T[],
  totalCount: number,
  dto: OffsetPaginationDto,
): OffsetPaginatedResponse<T> {
  const page = dto.page || 1;
  const limit = dto.limit || 20;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: items,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
