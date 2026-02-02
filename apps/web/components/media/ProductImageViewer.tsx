'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import type { MediaItem } from './MediaCard';

interface ProductImageViewerProps {
  images: MediaItem[];
  productName?: string;
  onImageChange?: (index: number) => void;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  enableZoom?: boolean;
  className?: string;
}

export function ProductImageViewer({
  images,
  productName,
  onImageChange,
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  enableZoom = true,
  className,
}: ProductImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !hasMultipleImages) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, hasMultipleImages, images.length, autoPlayInterval]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') {
        setIsZoomed(false);
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goToPrevious = () => {
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(newIndex);
    onImageChange?.(newIndex);
    setIsLoading(true);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(newIndex);
    onImageChange?.(newIndex);
    setIsLoading(true);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    onImageChange?.(index);
    setIsLoading(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (images.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center aspect-[3/4] bg-muted rounded-lg',
          className
        )}
      >
        <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No images available</p>
      </div>
    );
  }

  const mainImageUrl = currentImage?.heroUrl || currentImage?.cardUrl || currentImage?.originalUrl;
  const zoomImageUrl = currentImage?.zoomUrl || currentImage?.originalUrl;

  return (
    <div ref={containerRef} className={cn('space-y-3', className)}>
      {/* Main Image Container */}
      <div
        ref={imageRef}
        className={cn(
          'relative aspect-[3/4] bg-muted rounded-lg overflow-hidden group',
          isZoomed && enableZoom && 'cursor-zoom-out',
          !isZoomed && enableZoom && 'cursor-zoom-in'
        )}
        onClick={() => enableZoom && setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
      >
        {/* Loading Skeleton */}
        {isLoading && (
          <Skeleton className="absolute inset-0 z-10" />
        )}

        {/* Main Image */}
        <Image
          src={isZoomed ? zoomImageUrl : mainImageUrl}
          alt={currentImage?.altText || productName || 'Product image'}
          fill
          className={cn(
            'object-cover transition-transform duration-300',
            isLoading && 'opacity-0'
          )}
          style={
            isZoomed
              ? {
                  transform: 'scale(2.5)',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }
              : undefined
          }
          onLoad={() => setIsLoading(false)}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Zoom Indicator */}
        {enableZoom && !isZoomed && (
          <div className="absolute bottom-3 right-3 bg-black/60 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Top Controls */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Image Counter */}
          {hasMultipleImages && (
            <Badge variant="secondary" className="bg-white/80">
              {currentIndex + 1} / {images.length}
            </Badge>
          )}

          {/* Action Buttons */}
          <div className="flex gap-1">
            {hasMultipleImages && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image Type Badge */}
        {currentImage?.type && (
          <Badge
            variant="outline"
            className="absolute bottom-3 left-3 bg-white/80 text-xs capitalize"
          >
            {currentImage.type.toLowerCase().replace('_', ' ')}
          </Badge>
        )}

        {/* Primary Badge */}
        {currentImage?.isPrimary && (
          <Badge className="absolute top-3 left-3 bg-[#D7B797] text-white">
            Primary
          </Badge>
        )}

        {/* Dominant Color Strip */}
        {currentImage?.dominantColor && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: currentImage.dominantColor }}
          />
        )}
      </div>

      {/* Thumbnail Strip */}
      {showThumbnails && hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const thumbUrl = image.miniUrl || image.thumbUrl || image.cardUrl;
            return (
              <button
                key={image.id}
                className={cn(
                  'relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all',
                  index === currentIndex
                    ? 'border-[#127749] ring-1 ring-[#127749]'
                    : 'border-transparent hover:border-muted-foreground/30'
                )}
                onClick={() => goToIndex(index)}
              >
                <Image
                  src={thumbUrl}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                {image.isPrimary && (
                  <div className="absolute top-0 left-0 w-2 h-2 bg-[#D7B797] rounded-br" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Dot Indicators (for mobile) */}
      {hasMultipleImages && !showThumbnails && (
        <div className="flex justify-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-[#127749] w-4'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              onClick={() => goToIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Color Palette */}
      {currentImage?.colorPalette && currentImage.colorPalette.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Colors:</span>
          <div className="flex gap-1">
            {currentImage.colorPalette.slice(0, 6).map((color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
