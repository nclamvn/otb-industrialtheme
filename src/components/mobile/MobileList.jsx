'use client';
import { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';

export default function MobileList({
  items = [],
  renderItem,
  estimateSize = 72,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  skeleton: SkeletonComponent,
  skeletonCount = 5,
  emptyMessage = 'No items found',
}) {
  const parentRef = useRef(null);
  const loadMoreRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || isLoading || !onLoadMore) return;
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  // Loading skeleton
  if (isLoading && items.length === 0) {
    if (SkeletonComponent) {
      return (
        <div className="space-y-3 p-4">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonComponent key={i} />
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[#F0EBE5] animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#8C8178]">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto overscroll-contain"
      style={{ contain: 'strict' }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            className="absolute left-0 w-full"
            style={{
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
              height: `${virtualItem.size}px`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isLoading && (
            <Loader2 size={20} className="animate-spin" style={{ color: '#C4975A' }} />
          )}
        </div>
      )}
    </div>
  );
}
