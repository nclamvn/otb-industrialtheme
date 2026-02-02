'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProductCardImage } from './ProductCardImage';
import { MiniThumbnail } from './MiniThumbnail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Grid, Image as ImageIcon } from 'lucide-react';

interface ImageData {
  id: string;
  src: string;
  alt?: string;
  cardUrl?: string;
  hoverUrl?: string;
  thumbUrl?: string;
  miniUrl?: string;
  dominantColor?: string;
  isPrimary?: boolean;
  type?: string;
}

interface ProductImageGridProps {
  images: ImageData[];
  columns?: 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  showPagination?: boolean;
  itemsPerPage?: number;
  showCounter?: boolean;
  showTypeLabels?: boolean;
  onImageClick?: (image: ImageData, index: number) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * ProductImageGrid - Flexible grid layout for product images
 * Supports pagination, column configuration, and click handlers
 */
export function ProductImageGrid({
  images,
  columns = 4,
  gap = 'md',
  showPagination = false,
  itemsPerPage = 12,
  showCounter = true,
  showTypeLabels = false,
  onImageClick,
  emptyMessage = 'No images available',
  className,
}: ProductImageGridProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  };

  const totalPages = Math.ceil(images.length / itemsPerPage);
  const displayedImages = showPagination
    ? images.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
    : images;

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  };

  if (images.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 text-muted-foreground',
          className
        )}
      >
        <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grid */}
      <div className={cn('grid', columnClasses[columns], gapClasses[gap])}>
        {displayedImages.map((image, index) => (
          <div key={image.id} className="relative">
            <ProductCardImage
              src={image.src}
              alt={image.alt || `Image ${index + 1}`}
              cardUrl={image.cardUrl}
              hoverUrl={image.hoverUrl}
              dominantColor={image.dominantColor}
              isPrimary={image.isPrimary}
              showOverlay={!!onImageClick}
              onClick={() => onImageClick?.(image, currentPage * itemsPerPage + index)}
            />
            {showTypeLabels && image.type && (
              <Badge
                variant="secondary"
                className="absolute bottom-2 left-2 text-[9px] capitalize"
              >
                {image.type.toLowerCase().replace('_', ' ')}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Footer: Counter + Pagination */}
      <div className="flex items-center justify-between">
        {/* Counter */}
        {showCounter && (
          <span className="text-xs text-muted-foreground">
            {showPagination
              ? `${currentPage * itemsPerPage + 1}-${Math.min((currentPage + 1) * itemsPerPage, images.length)} of ${images.length}`
              : `${images.length} image${images.length !== 1 ? 's' : ''}`}
          </span>
        )}

        {/* Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 0}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Dots */}
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    i === currentPage
                      ? 'bg-[#127749] w-4'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                  onClick={() => goToPage(i)}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages - 1}
              onClick={() => goToPage(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ProductImageStrip - Horizontal scrolling strip of mini thumbnails
 * Used for quick navigation in product detail pages
 */
interface ProductImageStripProps {
  images: ImageData[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  showCounter?: boolean;
  className?: string;
}

export function ProductImageStrip({
  images,
  selectedIndex = 0,
  onSelect,
  showCounter = true,
  className,
}: ProductImageStripProps) {
  if (images.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted-foreground/20">
        {images.map((image, index) => (
          <MiniThumbnail
            key={image.id}
            src={image.miniUrl || image.thumbUrl || image.src}
            alt={image.alt || `Thumbnail ${index + 1}`}
            isSelected={index === selectedIndex}
            isPrimary={image.isPrimary}
            dominantColor={image.dominantColor}
            onClick={() => onSelect?.(index)}
          />
        ))}
      </div>

      {showCounter && (
        <span className="text-xs text-muted-foreground">
          {selectedIndex + 1} / {images.length}
        </span>
      )}
    </div>
  );
}
