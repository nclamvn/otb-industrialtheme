/**
 * BATCH PROCESSOR SERVICE
 *
 * Xử lý bulk operations với:
 * 1. Chunked processing - tránh transaction timeout
 * 2. Parallel execution với concurrency limit
 * 3. Progress tracking
 * 4. Retry mechanism
 * 5. Error aggregation
 *
 * Use cases:
 * - Import 50,000+ SKU items
 * - Bulk update prices
 * - Mass validation
 * - Report generation
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Types
export interface BatchOptions<T> {
  items: T[];
  chunkSize?: number;
  concurrency?: number;
  onProgress?: (progress: BatchProgress) => void;
  onChunkComplete?: (result: ChunkResult<T>) => void;
  retries?: number;
  retryDelay?: number;
  abortSignal?: AbortSignal;
}

export interface BatchProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
  estimatedTimeRemaining?: number;
}

export interface ChunkResult<T> {
  chunkIndex: number;
  items: T[];
  succeeded: number;
  failed: number;
  errors: BatchError[];
  duration: number;
}

export interface BatchError {
  index: number;
  item: unknown;
  error: string;
  retryable: boolean;
}

export interface BatchResult<T> {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  errors: BatchError[];
  duration: number;
  results?: T[];
}

// Default config
const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000;

@Injectable()
export class BatchProcessorService {
  private readonly logger = new Logger(BatchProcessorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process items in batches with a processor function
   */
  async processBatch<T, R>(
    options: BatchOptions<T>,
    processor: (chunk: T[], chunkIndex: number) => Promise<R[]>
  ): Promise<BatchResult<R>> {
    const {
      items,
      chunkSize = DEFAULT_CHUNK_SIZE,
      concurrency = DEFAULT_CONCURRENCY,
      onProgress,
      onChunkComplete,
      retries = DEFAULT_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
      abortSignal,
    } = options;

    const startTime = Date.now();
    const allResults: R[] = [];
    const allErrors: BatchError[] = [];
    let succeeded = 0;
    let failed = 0;

    // Split into chunks
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    const totalChunks = chunks.length;
    let processedChunks = 0;
    const chunkTimes: number[] = [];

    // Process chunks with concurrency limit
    const processingQueue = [...chunks.entries()];
    const activePromises: Promise<void>[] = [];

    while (processingQueue.length > 0 || activePromises.length > 0) {
      // Check abort
      if (abortSignal?.aborted) {
        throw new Error('Batch processing aborted');
      }

      // Fill up to concurrency limit
      while (processingQueue.length > 0 && activePromises.length < concurrency) {
        const [chunkIndex, chunk] = processingQueue.shift()!;

        const promise = this.processChunkWithRetry(
          chunk,
          chunkIndex,
          processor,
          retries,
          retryDelay
        ).then((result) => {
          processedChunks++;
          succeeded += result.succeeded;
          failed += result.failed;
          allErrors.push(...result.errors);
          chunkTimes.push(result.duration);

          // Report progress
          const avgChunkTime = chunkTimes.reduce((a, b) => a + b, 0) / chunkTimes.length;
          const remainingChunks = totalChunks - processedChunks;

          onProgress?.({
            total: items.length,
            processed: processedChunks * chunkSize,
            succeeded,
            failed,
            percentage: Math.round((processedChunks / totalChunks) * 100),
            currentChunk: processedChunks,
            totalChunks,
            estimatedTimeRemaining: remainingChunks * avgChunkTime,
          });

          onChunkComplete?.(result);
        });

        activePromises.push(promise);
      }

      // Wait for at least one to complete
      if (activePromises.length > 0) {
        await Promise.race(activePromises);
        // Remove completed promises
        for (let i = activePromises.length - 1; i >= 0; i--) {
          const status = await Promise.race([
            activePromises[i].then(() => 'resolved'),
            Promise.resolve('pending'),
          ]);
          if (status === 'resolved') {
            activePromises.splice(i, 1);
          }
        }
      }
    }

    return {
      success: failed === 0,
      total: items.length,
      succeeded,
      failed,
      errors: allErrors.slice(0, 100), // Limit errors in response
      duration: Date.now() - startTime,
      results: allResults,
    };
  }

  /**
   * Bulk insert with Prisma transactions
   */
  async bulkInsert<T extends Record<string, unknown>>(
    model: string,
    items: T[],
    options: Partial<BatchOptions<T>> = {}
  ): Promise<BatchResult<T>> {
    const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;

    return this.processBatch(
      { ...options, items, chunkSize },
      async (chunk) => {
        // Use raw query for better performance on large inserts
        const result = await this.prisma.$transaction(async (tx) => {
          const txModel = (tx as unknown as Record<string, { createMany: (args: { data: T[]; skipDuplicates?: boolean }) => Promise<{ count: number }> }>)[model];
          const created = await txModel.createMany({
            data: chunk,
            skipDuplicates: true,
          });
          return chunk.slice(0, created.count);
        }, {
          timeout: 30000, // 30 seconds per chunk
        });
        return result;
      }
    );
  }

  /**
   * Bulk update with Prisma transactions
   */
  async bulkUpdate<T extends { id: string }>(
    model: string,
    items: T[],
    options: Partial<BatchOptions<T>> = {}
  ): Promise<BatchResult<T>> {
    const chunkSize = options.chunkSize ?? 100; // Smaller chunks for updates

    return this.processBatch(
      { ...options, items, chunkSize },
      async (chunk) => {
        const prismaModel = (this.prisma as unknown as Record<string, { update: (args: { where: { id: string }; data: Omit<T, 'id'> }) => Promise<T> }>)[model];
        const updatePromises = chunk.map((item) => {
          const { id, ...data } = item;
          return prismaModel.update({
            where: { id },
            data,
          });
        });
        await this.prisma.$transaction(updatePromises as unknown as Parameters<typeof this.prisma.$transaction>[0], {
          timeout: 30000,
        });
        return chunk;
      }
    );
  }

  /**
   * Bulk delete
   */
  async bulkDelete(
    model: string,
    ids: string[],
    options: Partial<BatchOptions<string>> = {}
  ): Promise<BatchResult<string>> {
    const chunkSize = options.chunkSize ?? 1000;

    return this.processBatch(
      { ...options, items: ids, chunkSize },
      async (chunk) => {
        const prismaModel = (this.prisma as unknown as Record<string, { deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<{ count: number }> }>)[model];
        await prismaModel.deleteMany({
          where: { id: { in: chunk } },
        });
        return chunk;
      }
    );
  }

  /**
   * Bulk validate items
   */
  async bulkValidate<T>(
    items: T[],
    validator: (item: T, index: number) => Promise<string[]>,
    options: Partial<BatchOptions<T>> = {}
  ): Promise<BatchResult<{ item: T; errors: string[] }>> {
    const chunkSize = options.chunkSize ?? 1000;
    const concurrency = options.concurrency ?? 5; // Higher concurrency for validation

    return this.processBatch(
      { ...options, items, chunkSize, concurrency },
      async (chunk, chunkIndex) => {
        const results = await Promise.all(
          chunk.map(async (item, i) => {
            const globalIndex = chunkIndex * chunkSize + i;
            const errors = await validator(item, globalIndex);
            return { item, errors };
          })
        );
        return results;
      }
    );
  }

  /**
   * Process SKU items in batches (specialized for SKU import)
   */
  async processSKUImport(
    proposalId: string,
    items: Array<{
      skuCode: string;
      styleName: string;
      category: string;
      gender: string;
      retailPrice: number;
      costPrice: number;
      orderQuantity: number;
      colorCode?: string;
      colorName?: string;
      material?: string;
      sizeBreakdown?: unknown;
      supplierSKU?: string;
      leadTime?: number;
      moq?: number;
      countryOfOrigin?: string;
    }>,
    options: Partial<BatchOptions<typeof items[0]>> = {}
  ): Promise<BatchResult<typeof items[0]>> {
    const chunkSize = options.chunkSize ?? 500;

    return this.processBatch(
      { ...options, items, chunkSize },
      async (chunk) => {
        const skuItems = chunk.map((item) => ({
          proposalId,
          skuCode: item.skuCode,
          styleName: item.styleName,
          gender: item.gender as 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS',
          categoryId: item.category, // Should be resolved to ID
          retailPrice: item.retailPrice,
          costPrice: item.costPrice,
          margin: ((item.retailPrice - item.costPrice) / item.retailPrice) * 100,
          orderQuantity: item.orderQuantity,
          orderValue: item.orderQuantity * item.costPrice,
          colorCode: item.colorCode,
          colorName: item.colorName,
          material: item.material,
          sizeBreakdown: item.sizeBreakdown as Record<string, unknown> | undefined,
          supplierSKU: item.supplierSKU,
          leadTime: item.leadTime,
          moq: item.moq,
          countryOfOrigin: item.countryOfOrigin,
          validationStatus: 'PENDING' as const,
        }));

        await this.prisma.$transaction(
          async (tx) => {
            await tx.sKUItem.createMany({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data: skuItems as any,
              skipDuplicates: true,
            });

            // Update proposal counts
            const counts = await tx.sKUItem.aggregate({
              where: { proposalId },
              _count: true,
              _sum: {
                orderQuantity: true,
                orderValue: true,
              },
            });

            await tx.sKUProposal.update({
              where: { id: proposalId },
              data: {
                totalSKUs: counts._count,
                totalUnits: counts._sum.orderQuantity ?? 0,
                totalValue: counts._sum.orderValue ?? 0,
              },
            });
          },
          { timeout: 60000 }
        );

        return chunk;
      }
    );
  }

  // Private helpers

  private async processChunkWithRetry<T, R>(
    chunk: T[],
    chunkIndex: number,
    processor: (chunk: T[], chunkIndex: number) => Promise<R[]>,
    retries: number,
    retryDelay: number
  ): Promise<ChunkResult<T>> {
    const startTime = Date.now();
    const errors: BatchError[] = [];
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const results = await processor(chunk, chunkIndex);
        return {
          chunkIndex,
          items: chunk,
          succeeded: results.length,
          failed: chunk.length - results.length,
          errors,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error as Error;
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === retries) {
          // Add error for all items in chunk
          for (let i = 0; i < chunk.length; i++) {
            errors.push({
              index: chunkIndex * chunk.length + i,
              item: chunk[i],
              error: lastError.message,
              retryable: isRetryable,
            });
          }
          break;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        this.logger.warn(`Retrying chunk ${chunkIndex}, attempt ${attempt + 2}/${retries + 1}`);
      }
    }

    return {
      chunkIndex,
      items: chunk,
      succeeded: 0,
      failed: chunk.length,
      errors,
      duration: Date.now() - startTime,
    };
  }

  private isRetryableError(error: unknown): boolean {
    const message = (error as Error).message?.toLowerCase() || '';
    return (
      message.includes('deadlock') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('too many connections') ||
      message.includes('serialization failure')
    );
  }
}
