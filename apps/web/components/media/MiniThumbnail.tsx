'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';

interface MiniThumbnailProps {
  src: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md';
  isSelected?: boolean;
  isPrimary?: boolean;
  dominantColor?: string;
  showBorder?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * MiniThumbnail - Small 40x40 thumbnail component
 * Used in thumbnail strips, quick select grids, and navigation
 * Supports selection state, primary indicator, and dominant color
 */
export function MiniThumbnail({
  src,
  alt = 'Thumbnail',
  size = 'sm',
  isSelected = false,
  isPrimary = false,
  dominantColor,
  showBorder = true,
  onClick,
  className,
}: MiniThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
  };

  const sizePixels = {
    xs: 32,
    sm: 40,
    md: 48,
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex-shrink-0 rounded bg-muted flex items-center justify-center',
          sizeClasses[size],
          showBorder && 'border',
          onClick && 'cursor-pointer hover:border-muted-foreground/50',
          className
        )}
        onClick={onClick}
      >
        <ImageIcon className="w-3 h-3 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        'relative flex-shrink-0 rounded overflow-hidden transition-all',
        sizeClasses[size],
        showBorder && 'border-2',
        isSelected
          ? 'border-[#127749] ring-1 ring-[#127749]'
          : showBorder
            ? 'border-transparent hover:border-muted-foreground/30'
            : '',
        onClick && 'cursor-pointer',
        !onClick && 'cursor-default',
        className
      )}
      onClick={onClick}
      disabled={!onClick}
    >
      {/* Loading State */}
      {isLoading && (
        <Skeleton className="absolute inset-0 z-10" />
      )}

      {/* Image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          'object-cover',
          isLoading && 'opacity-0'
        )}
        sizes={`${sizePixels[size]}px`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />

      {/* Primary Indicator */}
      {isPrimary && (
        <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-[#D7B797] rounded-br z-20" />
      )}

      {/* Dominant Color Indicator */}
      {dominantColor && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 z-20"
          style={{ backgroundColor: dominantColor }}
        />
      )}

      {/* Selection Ring (additional visual) */}
      {isSelected && (
        <div className="absolute inset-0 ring-2 ring-[#127749] ring-inset rounded z-10" />
      )}
    </button>
  );
}

/**
 * MiniThumbnailGroup - Group of mini thumbnails with max visible count
 * Shows +N indicator when there are more images than maxVisible
 */
interface MiniThumbnailGroupProps {
  images: Array<{
    id: string;
    src: string;
    alt?: string;
    isPrimary?: boolean;
    dominantColor?: string;
  }>;
  maxVisible?: number;
  size?: 'xs' | 'sm' | 'md';
  selectedId?: string;
  onSelect?: (id: string, index: number) => void;
  onShowAll?: () => void;
  className?: string;
}

export function MiniThumbnailGroup({
  images,
  maxVisible = 5,
  size = 'sm',
  selectedId,
  onSelect,
  onShowAll,
  className,
}: MiniThumbnailGroupProps) {
  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  const sizeClasses = {
    xs: 'w-8 h-8 text-[9px]',
    sm: 'w-10 h-10 text-[10px]',
    md: 'w-12 h-12 text-xs',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {visibleImages.map((image, index) => (
        <MiniThumbnail
          key={image.id}
          src={image.src}
          alt={image.alt}
          size={size}
          isSelected={selectedId === image.id}
          isPrimary={image.isPrimary}
          dominantColor={image.dominantColor}
          onClick={() => onSelect?.(image.id, index)}
        />
      ))}

      {remainingCount > 0 && (
        <button
          type="button"
          className={cn(
            'flex-shrink-0 rounded bg-muted flex items-center justify-center font-medium text-muted-foreground hover:bg-muted/80 transition-colors',
            sizeClasses[size]
          )}
          onClick={onShowAll}
        >
          +{remainingCount}
        </button>
      )}
    </div>
  );
}
