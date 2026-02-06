'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Building2,
  Layers,
  Package,
  FolderOpen,
  Search,
  ArrowRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Entity types
interface Season {
  id: string;
  code: string;
  name: string;
  isCurrent?: boolean;
}

interface Brand {
  id: string;
  name: string;
  code?: string;
}

interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
}

interface SKU {
  id: string;
  code: string;
  name: string;
  categoryId: string;
}

export interface EntityHierarchy {
  seasons: Season[];
  brands: Brand[];
  categories: Category[];
  skus?: SKU[];
}

interface EntityNavigatorProps {
  hierarchy: EntityHierarchy;
  selectedSeason?: string;
  selectedBrand?: string;
  selectedCategory?: string;
  selectedSKU?: string;
  onSelect?: (type: string, id: string) => void;
  baseUrl?: string;
  showSKUs?: boolean;
  className?: string;
}

export function EntityNavigator({
  hierarchy,
  selectedSeason,
  selectedBrand,
  selectedCategory,
  selectedSKU,
  onSelect,
  baseUrl = '/otb-analysis',
  showSKUs = false,
  className,
}: EntityNavigatorProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(
    new Set(selectedSeason ? [selectedSeason] : [])
  );
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(
    new Set(selectedBrand ? [selectedBrand] : [])
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(selectedCategory ? [selectedCategory] : [])
  );

  const toggleSeason = useCallback((id: string) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleBrand = useCallback((id: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((type: string, id: string) => {
    if (onSelect) {
      onSelect(type, id);
    }
  }, [onSelect]);

  // Filter items based on search
  const filteredHierarchy = useMemo(() => {
    if (!searchQuery.trim()) return hierarchy;

    const query = searchQuery.toLowerCase();

    const filteredCategories = hierarchy.categories.filter(
      (cat) => cat.name.toLowerCase().includes(query)
    );

    const filteredBrands = hierarchy.brands.filter(
      (brand) => brand.name.toLowerCase().includes(query)
    );

    const filteredSeasons = hierarchy.seasons.filter(
      (season) =>
        season.code.toLowerCase().includes(query) ||
        season.name.toLowerCase().includes(query)
    );

    const filteredSKUs = hierarchy.skus?.filter(
      (sku) =>
        sku.code.toLowerCase().includes(query) ||
        sku.name.toLowerCase().includes(query)
    );

    return {
      seasons: filteredSeasons,
      brands: filteredBrands,
      categories: filteredCategories,
      skus: filteredSKUs,
    };
  }, [hierarchy, searchQuery]);

  // Build category tree
  const categoryTree = useMemo(() => {
    const rootCategories = filteredHierarchy.categories.filter((cat) => !cat.parentId);
    const childMap = new Map<string, Category[]>();

    filteredHierarchy.categories.forEach((cat) => {
      if (cat.parentId) {
        const children = childMap.get(cat.parentId) || [];
        children.push(cat);
        childMap.set(cat.parentId, children);
      }
    });

    const attachChildren = (category: Category): Category => ({
      ...category,
      children: childMap.get(category.id)?.map(attachChildren),
    });

    return rootCategories.map(attachChildren);
  }, [filteredHierarchy.categories]);

  const renderCategory = (category: Category, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory === category.id;

    return (
      <div key={category.id}>
        <div
          className={cn(
            'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
            'hover:bg-muted/50',
            isSelected && 'bg-[#127749]/10 text-[#127749]'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleSelect('category', category.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <FolderOpen className={cn(
            'w-4 h-4',
            isSelected ? 'text-[#127749]' : 'text-muted-foreground'
          )} />
          <span className="text-sm truncate flex-1">{category.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full border rounded-lg bg-card', className)}>
      {/* Header */}
      <div className="p-3 border-b bg-muted/30">
        <h3 className="font-semibold text-sm mb-2">Entity Navigator</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-8 h-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Seasons */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
              Seasons
            </p>
            {filteredHierarchy.seasons.map((season) => {
              const isExpanded = expandedSeasons.has(season.id);
              const isSelected = selectedSeason === season.id;

              return (
                <Collapsible
                  key={season.id}
                  open={isExpanded}
                  onOpenChange={() => toggleSeason(season.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
                        'hover:bg-muted/50',
                        isSelected && 'bg-[#D7B797]/20'
                      )}
                      onClick={() => handleSelect('season', season.id)}
                    >
                      <ChevronRight
                        className={cn(
                          'w-3.5 h-3.5 transition-transform',
                          isExpanded && 'rotate-90'
                        )}
                      />
                      <Calendar className={cn(
                        'w-4 h-4',
                        isSelected ? 'text-[#D7B797]' : 'text-muted-foreground'
                      )} />
                      <span className="text-sm font-medium">{season.code}</span>
                      {season.isCurrent && (
                        <Badge className="h-4 text-[9px] bg-[#127749]/10 text-[#127749]">
                          Current
                        </Badge>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {/* Brands under season */}
                    <div className="ml-4 mt-1 space-y-0.5">
                      {filteredHierarchy.brands.map((brand) => {
                        const isBrandExpanded = expandedBrands.has(brand.id);
                        const isBrandSelected = selectedBrand === brand.id;

                        return (
                          <Collapsible
                            key={brand.id}
                            open={isBrandExpanded}
                            onOpenChange={() => toggleBrand(brand.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <div
                                className={cn(
                                  'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
                                  'hover:bg-muted/50',
                                  isBrandSelected && 'bg-[#127749]/10'
                                )}
                                onClick={() => handleSelect('brand', brand.id)}
                              >
                                <ChevronRight
                                  className={cn(
                                    'w-3.5 h-3.5 transition-transform',
                                    isBrandExpanded && 'rotate-90'
                                  )}
                                />
                                <Building2 className={cn(
                                  'w-4 h-4',
                                  isBrandSelected ? 'text-[#127749]' : 'text-muted-foreground'
                                )} />
                                <span className="text-sm">{brand.name}</span>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              {/* Categories under brand */}
                              <div className="ml-4 mt-1">
                                {categoryTree.map((category) => renderCategory(category, 0))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>

          {/* SKUs (if enabled and search active) */}
          {showSKUs && searchQuery && filteredHierarchy.skus && filteredHierarchy.skus.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
                SKUs
              </p>
              {filteredHierarchy.skus.slice(0, 10).map((sku) => {
                const isSelected = selectedSKU === sku.id;

                return (
                  <div
                    key={sku.id}
                    className={cn(
                      'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
                      'hover:bg-muted/50',
                      isSelected && 'bg-[#127749]/10 text-[#127749]'
                    )}
                    onClick={() => handleSelect('sku', sku.id)}
                  >
                    <Package className={cn(
                      'w-4 h-4',
                      isSelected ? 'text-[#127749]' : 'text-muted-foreground'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate">{sku.code}</p>
                      <p className="text-xs text-muted-foreground truncate">{sku.name}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                );
              })}
              {filteredHierarchy.skus.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{filteredHierarchy.skus.length - 10} more results
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with quick navigation */}
      <div className="p-2 border-t bg-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Current path:</span>
          <div className="flex items-center gap-1 flex-1 truncate">
            {selectedSeason && (
              <Badge variant="outline" className="text-[10px] h-5">
                {hierarchy.seasons.find((s) => s.id === selectedSeason)?.code}
              </Badge>
            )}
            {selectedBrand && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Badge variant="outline" className="text-[10px] h-5">
                  {hierarchy.brands.find((b) => b.id === selectedBrand)?.name}
                </Badge>
              </>
            )}
            {selectedCategory && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Badge variant="outline" className="text-[10px] h-5">
                  {hierarchy.categories.find((c) => c.id === selectedCategory)?.name}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data generator
export function generateMockHierarchy(): EntityHierarchy {
  return {
    seasons: [
      { id: 'ss25', code: 'SS25', name: 'Spring/Summer 2025', isCurrent: true },
      { id: 'fw24', code: 'FW24', name: 'Fall/Winter 2024' },
      { id: 'ss24', code: 'SS24', name: 'Spring/Summer 2024' },
    ],
    brands: [
      { id: 'brand1', name: 'Main Brand', code: 'MB' },
      { id: 'brand2', name: 'Sub Brand A', code: 'SBA' },
      { id: 'brand3', name: 'Sub Brand B', code: 'SBB' },
    ],
    categories: [
      { id: 'cat1', name: 'Women\'s Collection' },
      { id: 'cat1-1', name: 'Bags', parentId: 'cat1' },
      { id: 'cat1-2', name: 'Shoes', parentId: 'cat1' },
      { id: 'cat1-3', name: 'Accessories', parentId: 'cat1' },
      { id: 'cat2', name: 'Men\'s Collection' },
      { id: 'cat2-1', name: 'Bags', parentId: 'cat2' },
      { id: 'cat2-2', name: 'Shoes', parentId: 'cat2' },
      { id: 'cat3', name: 'Unisex' },
    ],
    skus: [
      { id: 'sku1', code: 'WB-SS25-001', name: 'Classic Tote', categoryId: 'cat1-1' },
      { id: 'sku2', code: 'WB-SS25-002', name: 'Mini Crossbody', categoryId: 'cat1-1' },
      { id: 'sku3', code: 'WS-SS25-001', name: 'Leather Pumps', categoryId: 'cat1-2' },
      { id: 'sku4', code: 'MB-SS25-001', name: 'Business Bag', categoryId: 'cat2-1' },
    ],
  };
}
