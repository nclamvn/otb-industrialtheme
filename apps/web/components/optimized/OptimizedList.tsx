'use client';

import React, { memo, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

// ============================================
// VIRTUALIZED LIST
// ============================================

interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  itemHeight?: number | ((index: number) => number);
  overscan?: number;
  className?: string;
  listClassName?: string;
  emptyMessage?: string;
  EmptyComponent?: React.ComponentType;
  horizontal?: boolean;
}

function OptimizedListInner<T>({
  items,
  renderItem,
  keyExtractor,
  itemHeight = 60,
  overscan = 5,
  className = '',
  listClassName = '',
  emptyMessage = 'No items found',
  EmptyComponent,
  horizontal = false,
}: OptimizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof itemHeight === 'function' ? itemHeight : () => itemHeight,
    overscan,
    horizontal,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (items.length === 0) {
    if (EmptyComponent) {
      return <EmptyComponent />;
    }
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn(
        'overflow-auto',
        horizontal ? 'overflow-x-auto' : 'overflow-y-auto',
        className
      )}
    >
      <div
        className={listClassName}
        style={{
          height: horizontal ? '100%' : `${virtualizer.getTotalSize()}px`,
          width: horizontal ? `${virtualizer.getTotalSize()}px` : '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={keyExtractor(item, virtualItem.index)}
              style={{
                position: 'absolute',
                top: horizontal ? 0 : 0,
                left: horizontal ? 0 : 0,
                width: horizontal ? `${virtualItem.size}px` : '100%',
                height: horizontal ? '100%' : `${virtualItem.size}px`,
                transform: horizontal
                  ? `translateX(${virtualItem.start}px)`
                  : `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const OptimizedList = memo(OptimizedListInner) as typeof OptimizedListInner;

// ============================================
// GRID LIST (Virtualized)
// ============================================

interface OptimizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  columns?: number;
  rowHeight?: number;
  gap?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
}

function OptimizedGridInner<T>({
  items,
  renderItem,
  keyExtractor,
  columns = 3,
  rowHeight = 200,
  gap = 16,
  overscan = 3,
  className = '',
  emptyMessage = 'No items found',
}: OptimizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate rows
  const rows = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      result.push(items.slice(i, i + columns));
    }
    return result;
  }, [items, columns]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight + gap,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowItems = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${rowHeight}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
                padding: `0 ${gap / 2}px`,
              }}
            >
              {rowItems.map((item, colIndex) => {
                const index = virtualRow.index * columns + colIndex;
                return (
                  <div key={keyExtractor(item, index)}>
                    {renderItem(item, index)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const OptimizedGrid = memo(OptimizedGridInner) as typeof OptimizedGridInner;

// ============================================
// INFINITE SCROLL LIST
// ============================================

interface InfiniteScrollListProps<T> extends Omit<OptimizedListProps<T>, 'overscan'> {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  loadingComponent?: React.ReactNode;
}

function InfiniteScrollListInner<T>({
  items,
  renderItem,
  keyExtractor,
  itemHeight = 60,
  className,
  hasMore,
  isLoading,
  onLoadMore,
  loadingComponent,
  ...rest
}: InfiniteScrollListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasMore ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof itemHeight === 'function' ? itemHeight : () => itemHeight,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Check if we should load more
  React.useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= items.length - 1 &&
      hasMore &&
      !isLoading
    ) {
      onLoadMore();
    }
  }, [virtualItems, items.length, hasMore, isLoading, onLoadMore]);

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const isLoadingRow = virtualItem.index >= items.length;

          if (isLoadingRow) {
            return (
              <div
                key="loading"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {loadingComponent || (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Loading more...
                  </div>
                )}
              </div>
            );
          }

          const item = items[virtualItem.index];
          return (
            <div
              key={keyExtractor(item, virtualItem.index)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const InfiniteScrollList = memo(InfiniteScrollListInner) as typeof InfiniteScrollListInner;
