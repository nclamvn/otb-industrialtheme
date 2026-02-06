'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

// Inline CSS transform utility (from @dnd-kit/utilities)
const CSS = {
  Transform: {
    toString(transform: { x: number; y: number; scaleX: number; scaleY: number } | null) {
      if (!transform) return undefined;
      return `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`;
    },
  },
};
import {
  Settings2,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
  Pin,
  PinOff,
  Search,
  Check,
  Columns3,
} from 'lucide-react';

export interface ColumnConfig {
  id: string;
  label: string;
  labelVi?: string;
  visible: boolean;
  pinned?: 'left' | 'right' | false;
  width?: number;
  order: number;
  canHide?: boolean;
  canPin?: boolean;
  group?: string;
}

interface TableColumnConfigProps {
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
  onReset?: () => void;
  groups?: { id: string; label: string }[];
  locale?: 'en' | 'vi';
  className?: string;
}

/**
 * TableColumnConfig - Column visibility and order configuration popover
 * Features:
 * - Toggle column visibility
 * - Drag-and-drop reorder
 * - Pin columns left/right
 * - Search/filter columns
 * - Group columns
 * - Reset to defaults
 */
export function TableColumnConfig({
  columns,
  onChange,
  onReset,
  groups,
  locale = 'vi',
  className,
}: TableColumnConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const visibleCount = columns.filter((c) => c.visible).length;
  const pinnedCount = columns.filter((c) => c.pinned).length;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter columns by search
  const filteredColumns = useMemo(() => {
    if (!searchQuery) return columns;
    const query = searchQuery.toLowerCase();
    return columns.filter(
      (col) =>
        col.label.toLowerCase().includes(query) ||
        col.labelVi?.toLowerCase().includes(query) ||
        col.id.toLowerCase().includes(query)
    );
  }, [columns, searchQuery]);

  // Group columns if groups provided
  const groupedColumns = useMemo(() => {
    if (!groups) return { _ungrouped: filteredColumns };

    const grouped: Record<string, ColumnConfig[]> = {};
    groups.forEach((g) => (grouped[g.id] = []));
    grouped._ungrouped = [];

    filteredColumns.forEach((col) => {
      const groupId = col.group || '_ungrouped';
      if (!grouped[groupId]) grouped[groupId] = [];
      grouped[groupId].push(col);
    });

    return grouped;
  }, [filteredColumns, groups]);

  // Toggle visibility
  const toggleVisibility = useCallback(
    (columnId: string) => {
      const updated = columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      );
      onChange(updated);
    },
    [columns, onChange]
  );

  // Toggle pin
  const togglePin = useCallback(
    (columnId: string, side: 'left' | 'right') => {
      const updated = columns.map((col): ColumnConfig =>
        col.id === columnId
          ? { ...col, pinned: col.pinned === side ? false : side }
          : col
      );
      onChange(updated);
    },
    [columns, onChange]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = columns.findIndex((c) => c.id === active.id);
      const newIndex = columns.findIndex((c) => c.id === over.id);

      const reordered = arrayMove(columns, oldIndex, newIndex).map(
        (col, idx) => ({ ...col, order: idx })
      );

      onChange(reordered);
    },
    [columns, onChange]
  );

  // Show all / Hide all
  const toggleAll = useCallback(
    (visible: boolean) => {
      const updated = columns.map((col) =>
        col.canHide !== false ? { ...col, visible } : col
      );
      onChange(updated);
    },
    [columns, onChange]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2', className)}
        >
          <Columns3 className="h-4 w-4" />
          <span className="hidden sm:inline">
            {locale === 'vi' ? 'Cột hiển thị' : 'Columns'}
          </span>
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
            {visibleCount}/{columns.length}
          </Badge>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <Command>
          <div className="flex items-center border-b px-3 py-2">
            <Settings2 className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="font-medium text-sm">
              {locale === 'vi' ? 'Cấu hình cột' : 'Column Settings'}
            </span>
          </div>

          <CommandInput
            placeholder={locale === 'vi' ? 'Tìm cột...' : 'Search columns...'}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />

          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {locale === 'vi' ? 'Không tìm thấy cột' : 'No columns found'}
            </CommandEmpty>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredColumns.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {Object.entries(groupedColumns).map(([groupId, groupColumns]) => {
                  if (groupColumns.length === 0) return null;
                  const group = groups?.find((g) => g.id === groupId);

                  return (
                    <CommandGroup
                      key={groupId}
                      heading={group?.label}
                      className="px-0"
                    >
                      {groupColumns.map((column) => (
                        <SortableColumnItem
                          key={column.id}
                          column={column}
                          locale={locale}
                          onToggleVisibility={() => toggleVisibility(column.id)}
                          onTogglePin={(side) => togglePin(column.id, side)}
                        />
                      ))}
                    </CommandGroup>
                  );
                })}
              </SortableContext>
            </DndContext>
          </CommandList>

          <CommandSeparator />

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-2 border-t">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => toggleAll(true)}
              >
                <Eye className="h-3 w-3 mr-1" />
                {locale === 'vi' ? 'Tất cả' : 'All'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => toggleAll(false)}
              >
                <EyeOff className="h-3 w-3 mr-1" />
                {locale === 'vi' ? 'Ẩn hết' : 'None'}
              </Button>
            </div>

            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onReset}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {locale === 'vi' ? 'Mặc định' : 'Reset'}
              </Button>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Sortable Column Item Component
interface SortableColumnItemProps {
  column: ColumnConfig;
  locale: 'en' | 'vi';
  onToggleVisibility: () => void;
  onTogglePin: (side: 'left' | 'right') => void;
}

function SortableColumnItem({
  column,
  locale,
  onToggleVisibility,
  onTogglePin,
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-sm',
        isDragging && 'opacity-50 bg-muted'
      )}
    >
      {/* Drag Handle */}
      <button
        className="cursor-grab hover:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Visibility Toggle */}
      <Switch
        checked={column.visible}
        onCheckedChange={onToggleVisibility}
        disabled={column.canHide === false}
        className="h-4 w-7 data-[state=checked]:bg-[#127749]"
      />

      {/* Column Label */}
      <span
        className={cn(
          'flex-1 text-sm truncate',
          !column.visible && 'text-muted-foreground'
        )}
      >
        {locale === 'vi' && column.labelVi ? column.labelVi : column.label}
      </span>

      {/* Pinned Badge */}
      {column.pinned && (
        <Badge variant="outline" className="h-5 px-1 text-[10px]">
          {column.pinned === 'left' ? 'L' : 'R'}
        </Badge>
      )}

      {/* Pin Button */}
      {column.canPin !== false && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onTogglePin('left')}
        >
          {column.pinned ? (
            <PinOff className="h-3 w-3" />
          ) : (
            <Pin className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * useTableColumnConfig - Hook for managing column configuration state
 */
export function useTableColumnConfig(initialColumns: ColumnConfig[]) {
  const [columns, setColumns] = useState(initialColumns);

  const visibleColumns = useMemo(
    () =>
      columns
        .filter((c) => c.visible)
        .sort((a, b) => a.order - b.order),
    [columns]
  );

  const pinnedLeftColumns = useMemo(
    () => visibleColumns.filter((c) => c.pinned === 'left'),
    [visibleColumns]
  );

  const pinnedRightColumns = useMemo(
    () => visibleColumns.filter((c) => c.pinned === 'right'),
    [visibleColumns]
  );

  const scrollableColumns = useMemo(
    () => visibleColumns.filter((c) => !c.pinned),
    [visibleColumns]
  );

  const reset = useCallback(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const updateColumn = useCallback(
    (columnId: string, updates: Partial<ColumnConfig>) => {
      setColumns((prev) =>
        prev.map((col) => (col.id === columnId ? { ...col, ...updates } : col))
      );
    },
    []
  );

  return {
    columns,
    setColumns,
    visibleColumns,
    pinnedLeftColumns,
    pinnedRightColumns,
    scrollableColumns,
    reset,
    updateColumn,
  };
}
