'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-4: GalleryGrid — Responsive Image Grid with Selection
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { GalleryImage, GalleryViewMode } from '@/hooks/useGallery';
import {
  Check,
  ImageOff,
  GripVertical,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Props ──────────────────────────────────────────────────────────────────────
interface GalleryGridProps {
  images: GalleryImage[];
  viewMode: GalleryViewMode;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDragEnd?: () => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTag?: (id: string) => void;
  columnCount?: number;
  className?: string;
}

// ─── Gallery Grid Component ─────────────────────────────────────────────────────
export function GalleryGrid({
  images,
  viewMode,
  selectedIds,
  onSelect,
  onOpen,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDownload,
  onDelete,
  onTag,
  columnCount = 4,
  className,
}: GalleryGridProps) {
  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      e.dataTransfer.effectAllowed = 'move';
      onDragStart?.(id);
    },
    [onDragStart]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOver?.(id);
    },
    [onDragOver]
  );

  const handleDragEnd = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ImageOff className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Không có hình ảnh</p>
        <p className="text-sm">Thử thay đổi bộ lọc hoặc tải lên hình ảnh mới</p>
      </div>
    );
  }

  // Grid view
  if (viewMode === 'grid') {
    return (
      <div
        className={cn(
          'grid gap-4',
          columnCount === 2 && 'grid-cols-2',
          columnCount === 3 && 'grid-cols-3',
          columnCount === 4 && 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
          columnCount === 5 && 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
          columnCount === 6 && 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
          className
        )}
      >
        {images.map((image) => (
          <GalleryGridItem
            key={image.id}
            image={image}
            isSelected={selectedIds.has(image.id)}
            onSelect={() => onSelect(image.id)}
            onOpen={() => onOpen(image.id)}
            onDragStart={(e) => handleDragStart(e, image.id)}
            onDragOver={(e) => handleDragOver(e, image.id)}
            onDragEnd={handleDragEnd}
            onDownload={onDownload ? () => onDownload(image.id) : undefined}
            onDelete={onDelete ? () => onDelete(image.id) : undefined}
            onTag={onTag ? () => onTag(image.id) : undefined}
          />
        ))}
      </div>
    );
  }

  // Masonry view
  if (viewMode === 'masonry') {
    return (
      <div className={cn('columns-2 sm:columns-3 md:columns-4 gap-4', className)}>
        {images.map((image) => (
          <div key={image.id} className="mb-4 break-inside-avoid">
            <GalleryGridItem
              image={image}
              isSelected={selectedIds.has(image.id)}
              onSelect={() => onSelect(image.id)}
              onOpen={() => onOpen(image.id)}
              onDragStart={(e) => handleDragStart(e, image.id)}
              onDragOver={(e) => handleDragOver(e, image.id)}
              onDragEnd={handleDragEnd}
              onDownload={onDownload ? () => onDownload(image.id) : undefined}
              onDelete={onDelete ? () => onDelete(image.id) : undefined}
              onTag={onTag ? () => onTag(image.id) : undefined}
              aspectRatio={image.height && image.width ? image.height / image.width : 1}
            />
          </div>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className={cn('space-y-2', className)}>
      {images.map((image) => (
        <GalleryListItem
          key={image.id}
          image={image}
          isSelected={selectedIds.has(image.id)}
          onSelect={() => onSelect(image.id)}
          onOpen={() => onOpen(image.id)}
          onDownload={onDownload ? () => onDownload(image.id) : undefined}
          onDelete={onDelete ? () => onDelete(image.id) : undefined}
          onTag={onTag ? () => onTag(image.id) : undefined}
        />
      ))}
    </div>
  );
}

// ─── Grid Item Component ────────────────────────────────────────────────────────
interface GalleryGridItemProps {
  image: GalleryImage;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onTag?: () => void;
  aspectRatio?: number;
}

function GalleryGridItem({
  image,
  isSelected,
  onSelect,
  onOpen,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDownload,
  onDelete,
  onTag,
  aspectRatio,
}: GalleryGridItemProps) {
  return (
    <div
      className={cn(
        'group relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-transparent hover:border-muted-foreground/30'
      )}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Image */}
      <div
        className="relative bg-muted"
        style={{ aspectRatio: aspectRatio ? `1/${aspectRatio}` : '1/1' }}
        onClick={onOpen}
      >
        <Image
          src={image.thumbnailSrc || image.src}
          alt={image.alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

        {/* Drag handle */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-1 rounded bg-black/50 text-white">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onOpen}>
                <Eye className="w-4 h-4 mr-2" />
                Xem chi tiết
              </DropdownMenuItem>
              {onDownload && (
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Tải xuống
                </DropdownMenuItem>
              )}
              {onTag && (
                <DropdownMenuItem onClick={onTag}>
                  <Tag className="w-4 h-4 mr-2" />
                  Gắn tag
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Product info overlay */}
        {(image.productName || image.sku) && (
          <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            {image.productName && (
              <p className="text-xs text-white font-medium truncate">{image.productName}</p>
            )}
            {image.sku && <p className="text-[10px] text-white/80 truncate">{image.sku}</p>}
          </div>
        )}
      </div>

      {/* Selection checkbox */}
      <button
        className={cn(
          'absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
          isSelected
            ? 'bg-primary border-primary text-primary-foreground'
            : 'bg-white/90 border-gray-300 hover:border-primary opacity-0 group-hover:opacity-100'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {isSelected && <Check className="w-3 h-3" />}
      </button>

      {/* Variant badge */}
      {image.variant && (
        <div className="absolute bottom-2 left-2">
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded">
            {image.variant}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── List Item Component ────────────────────────────────────────────────────────
interface GalleryListItemProps {
  image: GalleryImage;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onTag?: () => void;
}

function GalleryListItem({
  image,
  isSelected,
  onSelect,
  onOpen,
  onDownload,
  onDelete,
  onTag,
}: GalleryListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-muted/50'
      )}
      onClick={onOpen}
    >
      {/* Checkbox */}
      <button
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
          isSelected
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-muted-foreground/30 hover:border-primary'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {isSelected && <Check className="w-3 h-3" />}
      </button>

      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
        <Image
          src={image.thumbnailSrc || image.src}
          alt={image.alt}
          fill
          className="object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{image.productName || image.alt}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {image.sku && <span>{image.sku}</span>}
          {image.category && (
            <>
              <span>•</span>
              <span>{image.category}</span>
            </>
          )}
          {image.variant && (
            <>
              <span>•</span>
              <span className="px-1 py-0.5 bg-muted rounded">{image.variant}</span>
            </>
          )}
        </div>
        {image.tags && image.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {image.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded"
              >
                {tag}
              </span>
            ))}
            {image.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                +{image.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* File info */}
      <div className="text-right text-xs text-muted-foreground flex-shrink-0">
        {image.width && image.height && (
          <p>
            {image.width}×{image.height}
          </p>
        )}
        {image.fileSize && <p>{formatFileSize(image.fileSize)}</p>}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>
              <Eye className="w-4 h-4 mr-2" />
              Xem chi tiết
            </DropdownMenuItem>
            {onDownload && (
              <DropdownMenuItem onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Tải xuống
              </DropdownMenuItem>
            )}
            {onTag && (
              <DropdownMenuItem onClick={onTag}>
                <Tag className="w-4 h-4 mr-2" />
                Gắn tag
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Helper Functions ───────────────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default GalleryGrid;
