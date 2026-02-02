'use client';

import { useState, useCallback, useMemo, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-4: useGallery Hook — Gallery State Management
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

export interface GalleryImage {
  id: string;
  src: string;
  thumbnailSrc?: string;
  alt: string;
  productId?: string;
  productName?: string;
  sku?: string;
  category?: string;
  season?: string;
  variant?: 'hero' | 'card' | 'thumbnail' | 'mini' | 'zoom';
  width?: number;
  height?: number;
  fileSize?: number;
  uploadedAt?: Date;
  tags?: string[];
  sortOrder?: number;
}

export interface GalleryFilters {
  search: string;
  category: string;
  season: string;
  variant: string;
  tags: string[];
  dateRange?: { start: Date; end: Date };
}

export type GalleryViewMode = 'grid' | 'masonry' | 'list';
export type GallerySortBy = 'name' | 'date' | 'size' | 'category' | 'custom';

interface UseGalleryOptions {
  images: GalleryImage[];
  onReorder?: (imageIds: string[]) => void;
  onDelete?: (imageIds: string[]) => Promise<void>;
  onBulkTag?: (imageIds: string[], tags: string[]) => Promise<void>;
}

export function useGallery({ images, onReorder, onDelete, onBulkTag }: UseGalleryOptions) {
  const [viewMode, setViewMode] = useState<GalleryViewMode>('grid');
  const [sortBy, setSortBy] = useState<GallerySortBy>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [filters, setFilters] = useState<GalleryFilters>({
    search: '',
    category: '',
    season: '',
    variant: '',
    tags: [],
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const dragItemRef = useRef<string | null>(null);
  const dragOverRef = useRef<string | null>(null);

  // ─── Filtered & Sorted Images ──────────────────────────────────────────────
  const filteredImages = useMemo(() => {
    let result = [...images];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (img) =>
          img.alt.toLowerCase().includes(q) ||
          img.productName?.toLowerCase().includes(q) ||
          img.sku?.toLowerCase().includes(q) ||
          img.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category
    if (filters.category) {
      result = result.filter((img) => img.category === filters.category);
    }

    // Season
    if (filters.season) {
      result = result.filter((img) => img.season === filters.season);
    }

    // Variant
    if (filters.variant) {
      result = result.filter((img) => img.variant === filters.variant);
    }

    // Tags
    if (filters.tags.length > 0) {
      result = result.filter((img) =>
        filters.tags.every((tag) => img.tags?.includes(tag))
      );
    }

    // Date range
    if (filters.dateRange) {
      result = result.filter((img) => {
        if (!img.uploadedAt) return true;
        const d = new Date(img.uploadedAt);
        return d >= filters.dateRange!.start && d <= filters.dateRange!.end;
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = (a.productName || a.alt).localeCompare(b.productName || b.alt);
          break;
        case 'date':
          cmp =
            (a.uploadedAt?.getTime() || 0) - (b.uploadedAt?.getTime() || 0);
          break;
        case 'size':
          cmp = (a.fileSize || 0) - (b.fileSize || 0);
          break;
        case 'category':
          cmp = (a.category || '').localeCompare(b.category || '');
          break;
        case 'custom':
          cmp = (a.sortOrder || 0) - (b.sortOrder || 0);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [images, filters, sortBy, sortAsc]);

  // ─── Facets for Filters ────────────────────────────────────────────────────
  const facets = useMemo(() => {
    const categories = new Set<string>();
    const seasons = new Set<string>();
    const variants = new Set<string>();
    const allTags = new Set<string>();

    images.forEach((img) => {
      if (img.category) categories.add(img.category);
      if (img.season) seasons.add(img.season);
      if (img.variant) variants.add(img.variant);
      img.tags?.forEach((t) => allTags.add(t));
    });

    return {
      categories: Array.from(categories).sort(),
      seasons: Array.from(seasons).sort(),
      variants: Array.from(variants).sort(),
      tags: Array.from(allTags).sort(),
    };
  }, [images]);

  // ─── Selection ─────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = filteredImages.map((img) => img.id);
    setSelectedIds((prev) => {
      const allSelected = allIds.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(allIds);
    });
  }, [filteredImages]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ─── Lightbox ──────────────────────────────────────────────────────────────
  const openLightbox = useCallback(
    (id: string) => {
      const idx = filteredImages.findIndex((img) => img.id === id);
      if (idx !== -1) {
        setLightboxIndex(idx);
        setZoomLevel(1);
      }
    },
    [filteredImages]
  );

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setZoomLevel(1);
  }, []);

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % filteredImages.length : null
    );
    setZoomLevel(1);
  }, [filteredImages.length]);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null
        ? (prev - 1 + filteredImages.length) % filteredImages.length
        : null
    );
    setZoomLevel(1);
  }, [filteredImages.length]);

  const currentLightboxImage =
    lightboxIndex !== null ? filteredImages[lightboxIndex] : null;

  // ─── Drag & Drop Reorder ───────────────────────────────────────────────────
  const handleDragStart = useCallback((id: string) => {
    dragItemRef.current = id;
  }, []);

  const handleDragOver = useCallback((id: string) => {
    dragOverRef.current = id;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (
      dragItemRef.current &&
      dragOverRef.current &&
      dragItemRef.current !== dragOverRef.current
    ) {
      const reordered = [...filteredImages];
      const fromIdx = reordered.findIndex(
        (img) => img.id === dragItemRef.current
      );
      const toIdx = reordered.findIndex(
        (img) => img.id === dragOverRef.current
      );
      if (fromIdx !== -1 && toIdx !== -1) {
        const [item] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, item);
        onReorder?.(reordered.map((img) => img.id));
      }
    }
    dragItemRef.current = null;
    dragOverRef.current = null;
  }, [filteredImages, onReorder]);

  // ─── Bulk Operations ───────────────────────────────────────────────────────
  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0 || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, onDelete]);

  const tagSelected = useCallback(
    async (tags: string[]) => {
      if (selectedIds.size === 0 || !onBulkTag) return;
      await onBulkTag(Array.from(selectedIds), tags);
    },
    [selectedIds, onBulkTag]
  );

  // ─── Filter Setters ───────────────────────────────────────────────────────
  const setFilter = useCallback(
    <K extends keyof GalleryFilters>(key: K, value: GalleryFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({ search: '', category: '', season: '', variant: '', tags: [] });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.season) count++;
    if (filters.variant) count++;
    if (filters.tags.length > 0) count++;
    if (filters.dateRange) count++;
    return count;
  }, [filters]);

  return {
    // Data
    filteredImages,
    facets,
    totalCount: images.length,
    filteredCount: filteredImages.length,
    // View
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortAsc,
    setSortAsc,
    // Filters
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    // Selection
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    // Lightbox
    lightboxIndex,
    currentLightboxImage,
    openLightbox,
    closeLightbox,
    nextImage,
    prevImage,
    zoomLevel,
    setZoomLevel,
    // Drag & Drop
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    // Bulk Operations
    deleteSelected,
    tagSelected,
    isDeleting,
  };
}
