'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, AlertCircle, ZoomIn } from 'lucide-react';

interface ProductHeroImageProps {
  src: string;
  alt: string;
  heroUrl?: string;
  zoomUrl?: string;
  dominantColor?: string;
  isPrimary?: boolean;
  qualityScore?: number;
  showZoomIndicator?: boolean;
  priority?: boolean;
  onZoom?: () => void;
  className?: string;
}

/**
 * ProductHeroImage - Large hero image component for product detail pages
 * Responsive: 1200x1600 on desktop, scales down on mobile
 * Supports zoom on hover, dominant color strip, and quality indicators
 */
export function ProductHeroImage({
  src,
  alt,
  heroUrl,
  zoomUrl,
  dominantColor,
  isPrimary,
  qualityScore,
  showZoomIndicator = true,
  priority = true,
  onZoom,
  className,
}: ProductHeroImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = heroUrl || src;
  const hasLowQuality = qualityScore !== undefined && qualityScore < 70;

  if (hasError) {
    return (
      <div
        className={cn(
          'relative aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center',
          className
        )}
      >
        <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Image not available</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative aspect-[3/4] bg-muted rounded-lg overflow-hidden group',
        onZoom && 'cursor-zoom-in',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onZoom}
    >
      {/* Loading State */}
      {isLoading && (
        <Skeleton className="absolute inset-0 z-10" />
      )}

      {/* Main Image */}
      <Image
        src={imageUrl}
        alt={alt}
        fill
        priority={priority}
        className={cn(
          'object-cover transition-all duration-300',
          isLoading && 'opacity-0',
          isHovered && onZoom && 'scale-105'
        )}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />

      {/* Dominant Color Strip */}
      {dominantColor && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5 z-20"
          style={{ backgroundColor: dominantColor }}
        />
      )}

      {/* Primary Badge */}
      {isPrimary && (
        <Badge
          className="absolute top-3 left-3 bg-[#D7B797] text-white text-xs z-20"
          variant="default"
        >
          Primary
        </Badge>
      )}

      {/* Quality Warning */}
      {hasLowQuality && (
        <Badge
          variant="outline"
          className="absolute top-3 right-3 bg-white/90 text-amber-600 border-amber-500 text-xs z-20"
        >
          Low Quality ({Math.round(qualityScore)}%)
        </Badge>
      )}

      {/* Zoom Indicator */}
      {showZoomIndicator && onZoom && (
        <div
          className={cn(
            'absolute bottom-4 right-4 bg-black/60 rounded-full p-2.5 z-20 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}
