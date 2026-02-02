'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ColumnResizeHandleProps {
  columnId: string;
  initialWidth: number;
  minWidth?: number;
  maxWidth?: number;
  onResize: (columnId: string, width: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  className?: string;
}

/**
 * ColumnResizeHandle - Draggable resize handle for table columns
 * Features:
 * - Smooth drag resize with min/max constraints
 * - Visual feedback during resize
 * - Double-click to auto-fit (reset to initial)
 */
export function ColumnResizeHandle({
  columnId,
  initialWidth,
  minWidth = 50,
  maxWidth = 500,
  onResize,
  onResizeStart,
  onResizeEnd,
  className,
}: ColumnResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(initialWidth);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = initialWidth;
      onResizeStart?.();

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [initialWidth, onResizeStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + delta));

      onResize(columnId, newWidth);
    },
    [isResizing, columnId, minWidth, maxWidth, onResize]
  );

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;

    setIsResizing(false);
    onResizeEnd?.();

    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isResizing, onResizeEnd]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Reset to initial width on double-click
      onResize(columnId, initialWidth);
    },
    [columnId, initialWidth, onResize]
  );

  // Global mouse event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={cn(
        'absolute top-0 right-0 w-1 h-full cursor-col-resize group z-10',
        'hover:bg-[#127749] transition-colors',
        isResizing && 'bg-[#127749]',
        className
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Visual handle indicator */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 right-0 w-0.5 h-6 rounded-full transition-all',
          'bg-muted-foreground/30 group-hover:bg-[#127749] group-hover:h-8',
          isResizing && 'bg-[#127749] h-full'
        )}
      />
    </div>
  );
}

/**
 * useColumnResize - Hook for managing resizable column widths
 */
export interface ColumnWidthConfig {
  id: string;
  initialWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

export function useColumnResize(columns: ColumnWidthConfig[]) {
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    columns.reduce(
      (acc, col) => ({ ...acc, [col.id]: col.initialWidth }),
      {} as Record<string, number>
    )
  );

  const [isAnyResizing, setIsAnyResizing] = useState(false);

  const handleResize = useCallback((columnId: string, width: number) => {
    setWidths((prev) => ({ ...prev, [columnId]: width }));
  }, []);

  const handleResizeStart = useCallback(() => {
    setIsAnyResizing(true);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsAnyResizing(false);
  }, []);

  const resetAllWidths = useCallback(() => {
    setWidths(
      columns.reduce(
        (acc, col) => ({ ...acc, [col.id]: col.initialWidth }),
        {} as Record<string, number>
      )
    );
  }, [columns]);

  const getColumnWidth = useCallback(
    (columnId: string) => widths[columnId] ?? 100,
    [widths]
  );

  const getColumnStyle = useCallback(
    (columnId: string): React.CSSProperties => ({
      width: widths[columnId] ?? 100,
      minWidth: columns.find((c) => c.id === columnId)?.minWidth ?? 50,
      maxWidth: columns.find((c) => c.id === columnId)?.maxWidth ?? 500,
    }),
    [widths, columns]
  );

  return {
    widths,
    isAnyResizing,
    handleResize,
    handleResizeStart,
    handleResizeEnd,
    resetAllWidths,
    getColumnWidth,
    getColumnStyle,
  };
}
