'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-4: GalleryFilters — Filter Panel for Gallery
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/lib/utils';
import { GalleryFilters as GalleryFiltersType, GalleryViewMode, GallerySortBy } from '@/hooks/useGallery';
import {
  Search,
  X,
  Filter,
  Grid3X3,
  LayoutGrid,
  List,
  ArrowUpDown,
  Calendar,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';

// ─── Props ──────────────────────────────────────────────────────────────────────
interface GalleryFiltersProps {
  filters: GalleryFiltersType;
  facets: {
    categories: string[];
    seasons: string[];
    variants: string[];
    tags: string[];
  };
  viewMode: GalleryViewMode;
  sortBy: GallerySortBy;
  sortAsc: boolean;
  activeFilterCount: number;
  totalCount: number;
  filteredCount: number;
  onFilterChange: <K extends keyof GalleryFiltersType>(key: K, value: GalleryFiltersType[K]) => void;
  onClearFilters: () => void;
  onViewModeChange: (mode: GalleryViewMode) => void;
  onSortChange: (sortBy: GallerySortBy) => void;
  onSortDirectionChange: (asc: boolean) => void;
  className?: string;
}

// ─── Gallery Filters Component ──────────────────────────────────────────────────
export function GalleryFilters({
  filters,
  facets,
  viewMode,
  sortBy,
  sortAsc,
  activeFilterCount,
  totalCount,
  filteredCount,
  onFilterChange,
  onClearFilters,
  onViewModeChange,
  onSortChange,
  onSortDirectionChange,
  className,
}: GalleryFiltersProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Top Row: Search, View Mode, Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, SKU, tag..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9 pr-9"
          />
          {filters.search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onFilterChange('search', '')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && onViewModeChange(value as GalleryViewMode)}
          className="border rounded-md"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view" className="px-3">
            <LayoutGrid className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="masonry" aria-label="Masonry view" className="px-3">
            <Grid3X3 className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" className="px-3">
            <List className="w-4 h-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">Sắp xếp</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Sắp xếp theo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortBy === 'date'}
              onCheckedChange={() => onSortChange('date')}
            >
              Ngày tải lên
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'name'}
              onCheckedChange={() => onSortChange('name')}
            >
              Tên sản phẩm
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'size'}
              onCheckedChange={() => onSortChange('size')}
            >
              Kích thước file
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'category'}
              onCheckedChange={() => onSortChange('category')}
            >
              Danh mục
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'custom'}
              onCheckedChange={() => onSortChange('custom')}
            >
              Thứ tự tùy chỉnh
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortAsc}
              onCheckedChange={(checked) => onSortDirectionChange(checked)}
            >
              Tăng dần
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Category Filter */}
        {facets.categories.length > 0 && (
          <Select
            value={filters.category || '_all'}
            onValueChange={(value) => onFilterChange('category', value === '_all' ? '' : value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tất cả danh mục</SelectItem>
              {facets.categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Season Filter */}
        {facets.seasons.length > 0 && (
          <Select
            value={filters.season || '_all'}
            onValueChange={(value) => onFilterChange('season', value === '_all' ? '' : value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mùa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tất cả mùa</SelectItem>
              {facets.seasons.map((season) => (
                <SelectItem key={season} value={season}>
                  {season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Variant Filter */}
        {facets.variants.length > 0 && (
          <Select
            value={filters.variant || '_all'}
            onValueChange={(value) => onFilterChange('variant', value === '_all' ? '' : value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Loại ảnh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tất cả loại</SelectItem>
              {facets.variants.map((variant) => (
                <SelectItem key={variant} value={variant}>
                  {variant}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Tags Filter */}
        {facets.tags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Tag className="w-4 h-4" />
                Tags
                {filters.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                    {filters.tags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                <p className="text-sm font-medium">Chọn tags</p>
                <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                  {facets.tags.map((tag) => {
                    const isSelected = filters.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        className={cn(
                          'px-2 py-1 text-xs rounded-full border transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-border'
                        )}
                        onClick={() => {
                          if (isSelected) {
                            onFilterChange(
                              'tags',
                              filters.tags.filter((t) => t !== tag)
                            );
                          } else {
                            onFilterChange('tags', [...filters.tags, tag]);
                          }
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {filters.tags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onFilterChange('tags', [])}
                  >
                    Xóa tất cả tags
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
            <X className="w-4 h-4 mr-1" />
            Xóa bộ lọc ({activeFilterCount})
          </Button>
        )}

        {/* Results Count */}
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredCount === totalCount ? (
            <span>{totalCount} hình ảnh</span>
          ) : (
            <span>
              {filteredCount} / {totalCount} hình ảnh
            </span>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <FilterBadge
              label={`Tìm: "${filters.search}"`}
              onRemove={() => onFilterChange('search', '')}
            />
          )}
          {filters.category && (
            <FilterBadge
              label={`Danh mục: ${filters.category}`}
              onRemove={() => onFilterChange('category', '')}
            />
          )}
          {filters.season && (
            <FilterBadge
              label={`Mùa: ${filters.season}`}
              onRemove={() => onFilterChange('season', '')}
            />
          )}
          {filters.variant && (
            <FilterBadge
              label={`Loại: ${filters.variant}`}
              onRemove={() => onFilterChange('variant', '')}
            />
          )}
          {filters.tags.map((tag) => (
            <FilterBadge
              key={tag}
              label={`Tag: ${tag}`}
              onRemove={() =>
                onFilterChange(
                  'tags',
                  filters.tags.filter((t) => t !== tag)
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter Badge Component ─────────────────────────────────────────────────────
interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
}

function FilterBadge({ label, onRemove }: FilterBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default GalleryFilters;
