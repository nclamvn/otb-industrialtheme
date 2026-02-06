'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-4: Gallery Page — Media Management Interface
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from 'react';
import { useGallery, GalleryImage } from '@/hooks/useGallery';
import { GalleryGrid, GalleryFilters, ImageLightbox } from '@/components/gallery';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  Trash2,
  Tag,
  Download,
  CheckSquare,
  Square,
  Image as ImageIcon,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// ─── Demo Data ──────────────────────────────────────────────────────────────────
const DEMO_IMAGES: GalleryImage[] = Array.from({ length: 24 }, (_, i) => ({
  id: `img-${i + 1}`,
  src: `https://picsum.photos/seed/${i + 1}/800/600`,
  thumbnailSrc: `https://picsum.photos/seed/${i + 1}/400/300`,
  alt: `Product Image ${i + 1}`,
  productId: `PRD-${String(i + 1).padStart(4, '0')}`,
  productName: `Sản phẩm ${i + 1}`,
  sku: `SKU-${String(i + 1).padStart(5, '0')}`,
  category: ['Áo', 'Quần', 'Phụ kiện', 'Giày dép'][i % 4],
  season: ['SS24', 'FW24', 'SS25'][i % 3],
  variant: ['hero', 'card', 'thumbnail', 'zoom'][i % 4] as GalleryImage['variant'],
  width: 800,
  height: 600,
  fileSize: Math.floor(Math.random() * 500000) + 100000,
  uploadedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
  tags: ['new', 'featured', 'sale', 'bestseller'].filter(() => Math.random() > 0.7),
  sortOrder: i + 1,
}));

// ─── Gallery Page Component ─────────────────────────────────────────────────────
export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>(DEMO_IMAGES);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Use gallery hook
  const gallery = useGallery({
    images,
    onReorder: (newOrder) => {
      const reordered = newOrder.map((id, index) => {
        const img = images.find((i) => i.id === id)!;
        return { ...img, sortOrder: index + 1 };
      });
      setImages(reordered);
      toast.success('Đã cập nhật thứ tự');
    },
    onDelete: async (ids) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setImages((prev) => prev.filter((img) => !ids.includes(img.id)));
      toast.success(`Đã xóa ${ids.length} hình ảnh`);
    },
    onBulkTag: async (ids, tags) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setImages((prev) =>
        prev.map((img) =>
          ids.includes(img.id)
            ? { ...img, tags: Array.from(new Set([...(img.tags || []), ...tags])) }
            : img
        )
      );
      toast.success(`Đã gắn tag cho ${ids.length} hình ảnh`);
    },
  });

  // Handle delete confirmation
  const handleDeleteClick = useCallback((ids: string[]) => {
    setImagesToDelete(ids);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    await gallery.deleteSelected();
    setDeleteDialogOpen(false);
    setImagesToDelete([]);
  }, [gallery]);

  // Handle download
  const handleDownload = useCallback((id: string) => {
    const image = images.find((img) => img.id === id);
    if (image) {
      toast.info(`Đang tải xuống: ${image.productName || image.alt}`);
      // In production, this would trigger actual download
    }
  }, [images]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader
        title="Gallery"
        description="Quản lý hình ảnh sản phẩm"
        icon={<ImageIcon className="w-6 h-6" />}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Action Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {/* Selection Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={gallery.selectAll}
                  className="gap-2"
                >
                  {gallery.selectedIds.size === gallery.filteredCount ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {gallery.selectedIds.size > 0
                    ? `${gallery.selectedIds.size} đã chọn`
                    : 'Chọn tất cả'}
                </Button>

                {/* Bulk Actions */}
                {gallery.selectedIds.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => gallery.tagSelected(['featured'])}
                      className="gap-2"
                    >
                      <Tag className="w-4 h-4" />
                      Gắn tag
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(Array.from(gallery.selectedIds))}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={gallery.clearSelection}
                    >
                      Bỏ chọn
                    </Button>
                  </>
                )}
              </div>

              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Tải lên
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <GalleryFilters
          filters={gallery.filters}
          facets={gallery.facets}
          viewMode={gallery.viewMode}
          sortBy={gallery.sortBy}
          sortAsc={gallery.sortAsc}
          activeFilterCount={gallery.activeFilterCount}
          totalCount={gallery.totalCount}
          filteredCount={gallery.filteredCount}
          onFilterChange={gallery.setFilter}
          onClearFilters={gallery.clearFilters}
          onViewModeChange={gallery.setViewMode}
          onSortChange={gallery.setSortBy}
          onSortDirectionChange={gallery.setSortAsc}
        />

        {/* Gallery Grid */}
        <GalleryGrid
          images={gallery.filteredImages}
          viewMode={gallery.viewMode}
          selectedIds={gallery.selectedIds}
          onSelect={gallery.toggleSelect}
          onOpen={gallery.openLightbox}
          onDragStart={gallery.handleDragStart}
          onDragOver={gallery.handleDragOver}
          onDragEnd={gallery.handleDragEnd}
          onDownload={handleDownload}
          onDelete={(id) => handleDeleteClick([id])}
        />

        {/* Lightbox */}
        <ImageLightbox
          image={gallery.currentLightboxImage}
          isOpen={gallery.lightboxIndex !== null}
          zoomLevel={gallery.zoomLevel}
          totalCount={gallery.filteredCount}
          currentIndex={gallery.lightboxIndex ?? 0}
          onClose={gallery.closeLightbox}
          onNext={gallery.nextImage}
          onPrev={gallery.prevImage}
          onZoomChange={gallery.setZoomLevel}
          onDownload={() =>
            gallery.currentLightboxImage && handleDownload(gallery.currentLightboxImage.id)
          }
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa {imagesToDelete.length} hình ảnh? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
