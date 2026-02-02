'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Filter,
  Plus,
  Save,
  Trash2,
  Check,
  ChevronDown,
  Star,
  Loader2,
  RefreshCw,
  Bookmark,
} from 'lucide-react';

// Types
export interface FilterValue {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between';
  value: string | number | boolean | (string | number)[];
}

export interface FilterPreset {
  id: string;
  name: string;
  nameVi?: string;
  filters: FilterValue[];
  isDefault?: boolean;
  isSystem?: boolean; // System presets can't be deleted
  createdBy?: string;
  createdAt?: string;
}

interface FilterPresetsProps {
  presets: FilterPreset[];
  activePresetId?: string;
  currentFilters: FilterValue[];
  onApplyPreset: (preset: FilterPreset) => void;
  onSavePreset: (name: string, filters: FilterValue[]) => Promise<FilterPreset>;
  onDeletePreset?: (presetId: string) => Promise<void>;
  onSetDefault?: (presetId: string) => Promise<void>;
  onClearFilters?: () => void;
  className?: string;
}

/**
 * FilterPresets - Dropdown for saving and applying filter presets
 */
export function FilterPresets({
  presets,
  activePresetId,
  currentFilters,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onSetDefault,
  onClearFilters,
  className,
}: FilterPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activePreset = presets.find((p) => p.id === activePresetId);
  const hasActiveFilters = currentFilters.length > 0;
  const hasUnsavedChanges = hasActiveFilters && !activePresetId;

  // Group presets
  const { systemPresets, userPresets } = useMemo(() => {
    const system = presets.filter((p) => p.isSystem);
    const user = presets.filter((p) => !p.isSystem);
    return { systemPresets: system, userPresets: user };
  }, [presets]);

  // Handle save preset
  const handleSavePreset = async () => {
    if (!newPresetName.trim() || currentFilters.length === 0) return;

    setIsSaving(true);
    try {
      await onSavePreset(newPresetName.trim(), currentFilters);
      setShowSaveDialog(false);
      setNewPresetName('');
    } catch (error) {
      console.error('Failed to save preset:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete preset
  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeletePreset) return;

    try {
      await onDeletePreset(presetId);
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  // Handle set default
  const handleSetDefault = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSetDefault) return;

    try {
      await onSetDefault(presetId);
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('gap-2', className)}
          >
            <Filter className="h-4 w-4" />
            {activePreset ? (
              <span className="truncate max-w-[100px]">
                {activePreset.nameVi || activePreset.name}
              </span>
            ) : hasActiveFilters ? (
              'Bộ lọc tùy chỉnh'
            ) : (
              'Bộ lọc'
            )}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1.5 h-4">
                {currentFilters.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Tìm bộ lọc..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy bộ lọc</CommandEmpty>

              {/* System Presets */}
              {systemPresets.length > 0 && (
                <CommandGroup heading="Mặc định hệ thống">
                  {systemPresets.map((preset) => (
                    <PresetItem
                      key={preset.id}
                      preset={preset}
                      isActive={activePresetId === preset.id}
                      onSelect={() => {
                        onApplyPreset(preset);
                        setIsOpen(false);
                      }}
                    />
                  ))}
                </CommandGroup>
              )}

              {/* User Presets */}
              {userPresets.length > 0 && (
                <>
                  {systemPresets.length > 0 && <CommandSeparator />}
                  <CommandGroup heading="Bộ lọc của tôi">
                    {userPresets.map((preset) => (
                      <PresetItem
                        key={preset.id}
                        preset={preset}
                        isActive={activePresetId === preset.id}
                        onSelect={() => {
                          onApplyPreset(preset);
                          setIsOpen(false);
                        }}
                        onDelete={
                          onDeletePreset
                            ? (e) => handleDeletePreset(preset.id, e)
                            : undefined
                        }
                        onSetDefault={
                          onSetDefault
                            ? (e) => handleSetDefault(preset.id, e)
                            : undefined
                        }
                      />
                    ))}
                  </CommandGroup>
                </>
              )}

              <CommandSeparator />

              {/* Actions */}
              <CommandGroup>
                {hasActiveFilters && (
                  <CommandItem
                    onSelect={() => {
                      setShowSaveDialog(true);
                      setIsOpen(false);
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Lưu bộ lọc hiện tại
                  </CommandItem>
                )}

                {hasActiveFilters && onClearFilters && (
                  <CommandItem
                    onSelect={() => {
                      onClearFilters();
                      setIsOpen(false);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Xóa bộ lọc
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Lưu bộ lọc
            </DialogTitle>
            <DialogDescription>
              Đặt tên cho bộ lọc để sử dụng lại sau này.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên bộ lọc</label>
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="VD: SKU tháng 3, Đơn chưa duyệt..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSavePreset();
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Bộ lọc đã chọn ({currentFilters.length})
              </label>
              <div className="flex flex-wrap gap-1">
                {currentFilters.map((filter, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {filter.field}: {String(filter.value)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowSaveDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSavePreset}
              disabled={!newPresetName.trim() || isSaving}
              className="bg-[#127749] hover:bg-[#0d5a36]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu bộ lọc
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Preset Item Component
interface PresetItemProps {
  preset: FilterPreset;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  onSetDefault?: (e: React.MouseEvent) => void;
}

function PresetItem({
  preset,
  isActive,
  onSelect,
  onDelete,
  onSetDefault,
}: PresetItemProps) {
  return (
    <CommandItem
      onSelect={onSelect}
      className="flex items-center justify-between group"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isActive && <Check className="h-4 w-4 text-[#127749]" />}
        <span className={cn('truncate', !isActive && 'ml-6')}>
          {preset.nameVi || preset.name}
        </span>
        {preset.isDefault && (
          <Star className="h-3 w-3 text-amber-500 fill-current" />
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onSetDefault && !preset.isDefault && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onSetDefault}
            title="Đặt làm mặc định"
          >
            <Star className="h-3 w-3" />
          </Button>
        )}
        {onDelete && !preset.isSystem && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Xóa"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </CommandItem>
  );
}

/**
 * useFilterPresets - Hook for managing filter presets
 */
export function useFilterPresets(
  initialPresets: FilterPreset[] = [],
  options: {
    storageKey?: string;
    onPresetsChange?: (presets: FilterPreset[]) => void;
  } = {}
) {
  const [presets, setPresets] = useState<FilterPreset[]>(initialPresets);
  const [activePresetId, setActivePresetId] = useState<string | undefined>(
    initialPresets.find((p) => p.isDefault)?.id
  );
  const [currentFilters, setCurrentFilters] = useState<FilterValue[]>([]);

  // Apply a preset
  const applyPreset = useCallback((preset: FilterPreset) => {
    setCurrentFilters(preset.filters);
    setActivePresetId(preset.id);
  }, []);

  // Save a new preset
  const savePreset = useCallback(
    async (name: string, filters: FilterValue[]): Promise<FilterPreset> => {
      const newPreset: FilterPreset = {
        id: `preset-${Date.now()}`,
        name,
        filters,
        createdAt: new Date().toISOString(),
      };

      const updated = [...presets, newPreset];
      setPresets(updated);
      setActivePresetId(newPreset.id);
      options.onPresetsChange?.(updated);

      // Persist to localStorage if key provided
      if (options.storageKey) {
        localStorage.setItem(options.storageKey, JSON.stringify(updated));
      }

      return newPreset;
    },
    [presets, options]
  );

  // Delete a preset
  const deletePreset = useCallback(
    async (presetId: string) => {
      const updated = presets.filter((p) => p.id !== presetId);
      setPresets(updated);

      if (activePresetId === presetId) {
        setActivePresetId(undefined);
      }

      options.onPresetsChange?.(updated);

      if (options.storageKey) {
        localStorage.setItem(options.storageKey, JSON.stringify(updated));
      }
    },
    [presets, activePresetId, options]
  );

  // Set default preset
  const setDefaultPreset = useCallback(
    async (presetId: string) => {
      const updated = presets.map((p) => ({
        ...p,
        isDefault: p.id === presetId,
      }));
      setPresets(updated);
      options.onPresetsChange?.(updated);

      if (options.storageKey) {
        localStorage.setItem(options.storageKey, JSON.stringify(updated));
      }
    },
    [presets, options]
  );

  // Clear filters
  const clearFilters = useCallback(() => {
    setCurrentFilters([]);
    setActivePresetId(undefined);
  }, []);

  // Add a filter
  const addFilter = useCallback((filter: FilterValue) => {
    setCurrentFilters((prev) => [...prev, filter]);
    setActivePresetId(undefined); // Clear active preset since filters changed
  }, []);

  // Remove a filter
  const removeFilter = useCallback((index: number) => {
    setCurrentFilters((prev) => prev.filter((_, i) => i !== index));
    setActivePresetId(undefined);
  }, []);

  // Update a filter
  const updateFilter = useCallback((index: number, filter: FilterValue) => {
    setCurrentFilters((prev) =>
      prev.map((f, i) => (i === index ? filter : f))
    );
    setActivePresetId(undefined);
  }, []);

  return {
    presets,
    activePresetId,
    currentFilters,
    applyPreset,
    savePreset,
    deletePreset,
    setDefaultPreset,
    clearFilters,
    addFilter,
    removeFilter,
    updateFilter,
  };
}
