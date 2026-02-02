'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-4: ImageLightbox — Full-Screen Image Viewer
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { GalleryImage } from '@/hooks/useGallery';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize,
  Info,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// ─── Props ──────────────────────────────────────────────────────────────────────
interface ImageLightboxProps {
  image: GalleryImage | null;
  isOpen: boolean;
  zoomLevel: number;
  totalCount: number;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onZoomChange: (zoom: number) => void;
  onDownload?: () => void;
}

// ─── Lightbox Component ─────────────────────────────────────────────────────────
export function ImageLightbox({
  image,
  isOpen,
  zoomLevel,
  totalCount,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onZoomChange,
  onDownload,
}: ImageLightboxProps) {
  const [rotation, setRotation] = React.useState(0);
  const [showInfo, setShowInfo] = React.useState(false);

  // Reset state when image changes
  useEffect(() => {
    setRotation(0);
    onZoomChange(1);
  }, [image, onZoomChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case '+':
        case '=':
          onZoomChange(Math.min(zoomLevel + 0.25, 3));
          break;
        case '-':
          onZoomChange(Math.max(zoomLevel - 0.25, 0.5));
          break;
        case 'r':
          setRotation((prev) => (prev + 90) % 360);
          break;
        case 'i':
          setShowInfo((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev, onZoomChange, zoomLevel]);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <span className="text-white/80 text-sm">
            {currentIndex + 1} / {totalCount}
          </span>
          {image.productName && (
            <span className="text-white font-medium">{image.productName}</span>
          )}
          {image.sku && (
            <Badge variant="secondary" className="bg-white/20 text-white">
              {image.sku}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => onZoomChange(Math.max(zoomLevel - 0.25, 0.5))}
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <span className="text-white/80 text-sm w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => onZoomChange(Math.min(zoomLevel + 0.25, 3))}
            disabled={zoomLevel >= 3}
          >
            <ZoomIn className="w-5 h-5" />
          </Button>

          <div className="w-px h-6 bg-white/20 mx-2" />

          {/* Rotate */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
          >
            <RotateCw className="w-5 h-5" />
          </Button>

          {/* Info toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'text-white hover:bg-white/20',
              showInfo && 'bg-white/20'
            )}
            onClick={() => setShowInfo((prev) => !prev)}
          >
            <Info className="w-5 h-5" />
          </Button>

          {/* Download */}
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onDownload}
            >
              <Download className="w-5 h-5" />
            </Button>
          )}

          <div className="w-px h-6 bg-white/20 mx-2" />

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 z-10 text-white hover:bg-white/20 w-12 h-12"
          onClick={onPrev}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>

        {/* Image */}
        <div
          className="relative transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
          }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width || 1200}
            height={image.height || 800}
            className="max-h-[80vh] w-auto object-contain"
            priority
          />
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 z-10 text-white hover:bg-white/20 w-12 h-12"
          onClick={onNext}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>

      {/* Footer Thumbnails */}
      <div className="p-4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex justify-center gap-2">
          <p className="text-white/60 text-xs">
            Dùng phím ← → để điều hướng, +/- để zoom, R để xoay, I để xem thông tin, ESC để đóng
          </p>
        </div>
      </div>

      {/* Info Panel */}
      <Sheet open={showInfo} onOpenChange={setShowInfo}>
        <SheetContent className="w-80">
          <SheetHeader>
            <SheetTitle>Thông tin hình ảnh</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {image.productName && (
              <InfoRow label="Tên sản phẩm" value={image.productName} />
            )}
            {image.sku && <InfoRow label="SKU" value={image.sku} />}
            {image.category && <InfoRow label="Danh mục" value={image.category} />}
            {image.season && <InfoRow label="Mùa" value={image.season} />}
            {image.variant && <InfoRow label="Loại ảnh" value={image.variant} />}
            {image.width && image.height && (
              <InfoRow label="Kích thước" value={`${image.width} × ${image.height} px`} />
            )}
            {image.fileSize && (
              <InfoRow label="Dung lượng" value={formatFileSize(image.fileSize)} />
            )}
            {image.uploadedAt && (
              <InfoRow
                label="Ngày tải lên"
                value={new Date(image.uploadedAt).toLocaleDateString('vi-VN')}
              />
            )}

            {/* Tags */}
            {image.tags && image.tags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {image.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Info Row Component ─────────────────────────────────────────────────────────
interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

// ─── Helper Functions ───────────────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default ImageLightbox;
