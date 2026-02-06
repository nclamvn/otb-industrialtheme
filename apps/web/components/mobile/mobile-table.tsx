'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { SwipeActions, presetActions } from './swipe-actions';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface MobileTableProps<T> {
  data: T[];
  columns: Column<T>[];
  primaryKey: keyof T;
  title?: (item: T) => React.ReactNode;
  subtitle?: (item: T) => React.ReactNode;
  badge?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  expandable?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function MobileTable<T extends Record<string, unknown>>({
  data,
  columns,
  primaryKey,
  title,
  subtitle,
  badge,
  onRowClick,
  onEdit,
  onDelete,
  expandable = false,
  emptyMessage = 'No data',
  className,
}: MobileTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<unknown>>(new Set());

  const toggleRow = (id: unknown) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const visibleColumns = columns.filter((col) => !col.hideOnMobile);
  const hiddenColumns = columns.filter((col) => col.hideOnMobile);

  if (data.length === 0) {
    return (
      <div className={cn('py-8 text-center text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  const renderCell = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item);
    }
    const key = column.key as keyof T;
    const value = item[key];
    return value != null ? String(value) : '-';
  };

  return (
    <div className={cn('divide-y divide-border', className)}>
      {data.map((item) => {
        const id = item[primaryKey];
        const isExpanded = expandedRows.has(id);
        const hasActions = onEdit || onDelete;
        const hasHiddenContent = expandable && hiddenColumns.length > 0;

        const rowContent = (
          <div
            className={cn(
              'px-4 py-3',
              (onRowClick || hasHiddenContent) && 'cursor-pointer active:bg-muted/50'
            )}
            onClick={() => {
              if (hasHiddenContent) {
                toggleRow(id);
              } else if (onRowClick) {
                onRowClick(item);
              }
            }}
          >
            {/* Header row with title/subtitle/badge */}
            <div className="flex items-start gap-3">
              {/* Expand icon */}
              {hasHiddenContent && (
                <div className="mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Main content */}
              <div className="flex-1 min-w-0">
                {title && (
                  <div className="font-medium truncate">
                    {title(item)}
                  </div>
                )}
                {subtitle && (
                  <div className="text-sm text-muted-foreground truncate">
                    {subtitle(item)}
                  </div>
                )}

                {/* Visible columns */}
                {visibleColumns.length > 0 && !title && (
                  <div className="space-y-1">
                    {visibleColumns.map((column) => (
                      <div key={String(column.key)} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{column.label}</span>
                        <span className={column.className}>{renderCell(item, column)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Badge */}
              {badge && (
                <div className="flex-shrink-0">
                  {badge(item)}
                </div>
              )}

              {/* Chevron for row click */}
              {onRowClick && !hasHiddenContent && (
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </div>

            {/* Expanded content */}
            {hasHiddenContent && isExpanded && (
              <div className="mt-3 pt-3 border-t space-y-2">
                {hiddenColumns.map((column) => (
                  <div key={String(column.key)} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{column.label}</span>
                    <span className={column.className}>{renderCell(item, column)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

        if (hasActions) {
          return (
            <SwipeActions
              key={String(id)}
              rightActions={[
                ...(onEdit ? [presetActions.edit(() => onEdit(item))] : []),
                ...(onDelete ? [presetActions.delete(() => onDelete(item))] : []),
              ]}
            >
              {rowContent}
            </SwipeActions>
          );
        }

        return <div key={String(id)}>{rowContent}</div>;
      })}
    </div>
  );
}
