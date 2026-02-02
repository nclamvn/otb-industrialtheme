'use client';

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

// Types
interface Column<T> {
  id: string;
  header: string | React.ReactNode;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  pinned?: 'left' | 'right' | false;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  cellClassName?: string | ((row: T) => string);
}

interface SortState {
  columnId: string;
  direction: 'asc' | 'desc';
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  overscan?: number;
  getRowId: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  selectedRows?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  sortState?: SortState;
  onSortChange?: (sort: SortState | null) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  className?: string;
}

/**
 * VirtualizedTable - High-performance table with row virtualization
 * Renders only visible rows for handling large datasets (1000+ rows)
 */
export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 48,
  overscan = 5,
  getRowId,
  onRowClick,
  onRowDoubleClick,
  selectedRows,
  onSelectionChange,
  sortState,
  onSortChange,
  isLoading = false,
  emptyMessage = 'Không có dữ liệu',
  stickyHeader = true,
  maxHeight = '600px',
  className,
}: VirtualizedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const { startIndex, endIndex, offsetY, totalHeight } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / rowHeight);
    const end = Math.min(data.length, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      endIndex: end,
      offsetY: start * rowHeight,
      totalHeight: data.length * rowHeight,
    };
  }, [scrollTop, containerHeight, rowHeight, overscan, data.length]);

  // Visible rows
  const visibleRows = useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex]
  );

  // Pinned columns
  const { pinnedLeft, pinnedRight, scrollable } = useMemo(() => {
    const left = columns.filter((c) => c.pinned === 'left');
    const right = columns.filter((c) => c.pinned === 'right');
    const scroll = columns.filter((c) => !c.pinned);
    return { pinnedLeft: left, pinnedRight: right, scrollable: scroll };
  }, [columns]);

  // Calculate column widths
  const getColumnWidth = useCallback((col: Column<T>) => {
    return col.width || 150;
  }, []);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Update container height on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Handle sort
  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSortChange) return;

      if (sortState?.columnId === columnId) {
        if (sortState.direction === 'asc') {
          onSortChange({ columnId, direction: 'desc' });
        } else {
          onSortChange(null);
        }
      } else {
        onSortChange({ columnId, direction: 'asc' });
      }
    },
    [sortState, onSortChange]
  );

  // Handle row selection
  const handleRowSelect = useCallback(
    (rowId: string, shiftKey: boolean) => {
      if (!onSelectionChange) return;

      const newSelection = new Set(selectedRows);
      if (newSelection.has(rowId)) {
        newSelection.delete(rowId);
      } else {
        newSelection.add(rowId);
      }
      onSelectionChange(newSelection);
    },
    [selectedRows, onSelectionChange]
  );

  // Render cell content
  const renderCell = useCallback(
    (row: T, column: Column<T>) => {
      if (typeof column.accessor === 'function') {
        return column.accessor(row);
      }
      const value = row[column.accessor];
      return value as React.ReactNode;
    },
    []
  );

  // Render header cell
  const renderHeader = (column: Column<T>) => {
    const isSorted = sortState?.columnId === column.id;
    const sortDir = isSorted ? sortState.direction : null;

    return (
      <div
        key={column.id}
        className={cn(
          'flex items-center gap-1 px-3 py-2 font-medium text-sm bg-muted/50 border-b',
          column.sortable && 'cursor-pointer hover:bg-muted select-none',
          column.align === 'center' && 'justify-center',
          column.align === 'right' && 'justify-end',
          column.headerClassName
        )}
        style={{ width: getColumnWidth(column), minWidth: column.minWidth }}
        onClick={() => column.sortable && handleSort(column.id)}
      >
        {column.header}
        {column.sortable && (
          <span className="ml-1">
            {sortDir === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : sortDir === 'desc' ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 opacity-30" />
            )}
          </span>
        )}
      </div>
    );
  };

  // Render row
  const renderRow = (row: T, index: number) => {
    const rowId = getRowId(row, startIndex + index);
    const isSelected = selectedRows?.has(rowId);

    return (
      <div
        key={rowId}
        className={cn(
          'flex border-b hover:bg-muted/30 transition-colors',
          isSelected && 'bg-[#127749]/10',
          onRowClick && 'cursor-pointer'
        )}
        style={{ height: rowHeight }}
        onClick={(e) => {
          if (onSelectionChange) {
            handleRowSelect(rowId, e.shiftKey);
          }
          onRowClick?.(row, startIndex + index);
        }}
        onDoubleClick={() => onRowDoubleClick?.(row, startIndex + index)}
      >
        {columns.map((column) => (
          <div
            key={column.id}
            className={cn(
              'flex items-center px-3 text-sm truncate',
              column.align === 'center' && 'justify-center',
              column.align === 'right' && 'justify-end',
              column.cellClassName &&
                (typeof column.cellClassName === 'function'
                  ? column.cellClassName(row)
                  : column.cellClassName)
            )}
            style={{ width: getColumnWidth(column), minWidth: column.minWidth }}
          >
            {renderCell(row, column)}
          </div>
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border overflow-hidden', className)}>
        <div className="flex bg-muted/50 border-b">
          {columns.map((col) => (
            <Skeleton
              key={col.id}
              className="h-10 m-1"
              style={{ width: getColumnWidth(col) - 8 }}
            />
          ))}
        </div>
        <div className="space-y-1 p-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-1">
              {columns.map((col) => (
                <Skeleton
                  key={col.id}
                  className="h-10"
                  style={{ width: getColumnWidth(col) - 8 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn('rounded-lg border overflow-hidden', className)}>
        <div className="flex bg-muted/50 border-b">
          {columns.map(renderHeader)}
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border overflow-hidden', className)}>
      {/* Header */}
      {stickyHeader && (
        <div className="flex bg-muted/50 border-b sticky top-0 z-10">
          {columns.map(renderHeader)}
        </div>
      )}

      {/* Virtualized Body */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ maxHeight }}
        onScroll={handleScroll}
      >
        {!stickyHeader && (
          <div className="flex bg-muted/50 border-b">
            {columns.map(renderHeader)}
          </div>
        )}

        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${offsetY}px)`,
            }}
          >
            {visibleRows.map((row, index) => renderRow(row, index))}
          </div>
        </div>
      </div>

      {/* Footer with row count */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t text-xs text-muted-foreground">
        <span>
          {data.length.toLocaleString()} dòng
          {selectedRows && selectedRows.size > 0 && (
            <span className="ml-2 text-[#127749]">
              ({selectedRows.size} đã chọn)
            </span>
          )}
        </span>
        <span>
          Đang hiển thị {startIndex + 1} - {Math.min(endIndex, data.length)}
        </span>
      </div>
    </div>
  );
}

/**
 * useVirtualizedData - Hook for managing virtualized table data with sorting
 */
export function useVirtualizedData<T>(
  data: T[],
  options: {
    defaultSort?: SortState;
    sortFn?: (a: T, b: T, sort: SortState) => number;
  } = {}
) {
  const [sortState, setSortState] = useState<SortState | null>(
    options.defaultSort || null
  );

  const sortedData = useMemo(() => {
    if (!sortState) return data;

    const sorted = [...data].sort((a, b) => {
      if (options.sortFn) {
        return options.sortFn(a, b, sortState);
      }

      const aVal = (a as any)[sortState.columnId];
      const bVal = (b as any)[sortState.columnId];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortState.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortState, options.sortFn]);

  return {
    data: sortedData,
    sortState,
    setSortState,
  };
}
