'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, AlertCircle, Eye } from 'lucide-react';

interface ProductCardImageProps {
  src: string;
  alt: string;
  cardUrl?: string;
  hoverUrl?: string; // Secondary image shown on hover
  dominantColor?: string;
  isPrimary?: boolean;
  badge?: string; // Optional badge text (e.g., "New", "Sale")
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  showOverlay?: boolean;
  priority?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * ProductCardImage - Medium-sized image for product cards/grids
 * Size: 400x533 (3:4 aspect ratio)
 * Supports hover image swap, badges, and dominant color
 */
export function ProductCardImage({
  src,
  alt,
  cardUrl,
  hoverUrl,
  dominantColor,
  isPrimary,
  badge,
  badgeVariant = 'secondary',
  showOverlay = false,
  priority = false,
  onClick,
  className,
}: ProductCardImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverImageLoaded, setHoverImageLoaded] = useState(false);

  const primaryUrl = cardUrl || src;
  const showHoverImage = hoverUrl && isHovered && hoverImageLoaded;

  if (hasError) {
    return (
      <div
        className={cn(
          'relative aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center',
          className
        )}
      >
        <ImageIcon className="w-8 h-8 text-muted-foreground/50 mb-1" />
        <p className="text-xs text-muted-foreground">No image</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative aspect-[3/4] bg-muted rounded-lg overflow-hidden group',
        onClick && 'cursor-pointer',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Loading State */}
      {isLoading && (
        <Skeleton className="absolute inset-0 z-10" />
      )}

      {/* Primary Image */}
      <Image
        src={primaryUrl}
        alt={alt}
        fill
        priority={priority}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading && 'opacity-0',
          showHoverImage && 'opacity-0'
        )}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />

      {/* Hover Image (preloaded) */}
      {hoverUrl && (
        <Image
          src={hoverUrl}
          alt={`${alt} - alternate view`}
          fill
          className={cn(
            'object-cover transition-opacity duration-300',
            showHoverImage ? 'opacity-100' : 'opacity-0'
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
          onLoad={() => setHoverImageLoaded(true)}
        />
      )}

      {/* Dominant Color Strip */}
      {dominantColor && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 z-20"
          style={{ backgroundColor: dominantColor }}
        />
      )}

      {/* Primary Indicator */}
      {isPrimary && (
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#D7B797] z-20" />
      )}

      {/* Badge */}
      {badge && (
        <Badge
          variant={badgeVariant}
          className="absolute top-2 right-2 text-[10px] z-20"
        >
          {badge}
        </Badge>
      )}

      {/* Hover Overlay */}
      {showOverlay && (
        <div
          className={cn(
            'absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-200 z-10',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="bg-white/90 rounded-full p-2">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
}
