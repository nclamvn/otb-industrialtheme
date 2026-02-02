'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  MoreVertical,
  Trash2,
  Download,
  ZoomIn,
  Edit2,
  GripVertical,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export interface MediaItem {
  id: string;
  originalUrl: string;
  heroUrl?: string;
  cardUrl?: string;
  thumbUrl?: string;
  miniUrl?: string;
  zoomUrl?: string;
  type: 'HERO' | 'CARD' | 'THUMBNAIL' | 'LIFESTYLE' | 'DETAIL' | 'SWATCH';
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'ARCHIVED';
  isPrimary: boolean;
  sortOrder: number;
  altText?: string;
  caption?: string;
  qualityScore?: number;
  dominantColor?: string;
  colorPalette?: string[];
  skuItem?: {
    skuCode: string;
    styleName: string;
    colorName?: string;
  };
}

interface MediaCardProps {
  media: MediaItem;
  onSetPrimary?: (id: string) => void;
  onDelete?: (id: string) => void;
  onZoom?: (media: MediaItem) => void;
  onEdit?: (media: MediaItem) => void;
  onDownload?: (media: MediaItem) => void;
  isDragging?: boolean;
  showActions?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MediaCard({
  media,
  onSetPrimary,
  onDelete,
  onZoom,
  onEdit,
  onDownload,
  isDragging = false,
  showActions = true,
  size = 'md',
  className,
}: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
  };

  const imageUrl = media.thumbUrl || media.cardUrl || media.originalUrl;
  const isLoading = media.status === 'UPLOADING' || media.status === 'PROCESSING';
  const isFailed = media.status === 'FAILED';

  return (
    <div
      className={cn(
        'relative group rounded-lg overflow-hidden border bg-background transition-all duration-200',
        sizeClasses[size],
        isDragging && 'opacity-50 scale-95',
        isHovered && 'ring-2 ring-[#127749] shadow-lg',
        media.isPrimary && 'ring-2 ring-[#D7B797]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative w-full h-full">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isFailed || imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-destructive">
            <AlertCircle className="w-6 h-6 mb-1" />
            <span className="text-xs">Failed</span>
          </div>
        ) : (
          <Image
            src={imageUrl}
            alt={media.altText || 'Product image'}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes={`(max-width: 768px) 100vw, ${size === 'sm' ? '96px' : size === 'md' ? '160px' : '224px'}`}
          />
        )}

        {/* Dominant color overlay (bottom edge) */}
        {media.dominantColor && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: media.dominantColor }}
          />
        )}
      </div>

      {/* Primary Badge */}
      {media.isPrimary && (
        <Badge
          className="absolute top-1 left-1 bg-[#D7B797] text-white text-[10px] px-1.5 py-0"
          variant="default"
        >
          <Star className="w-3 h-3 mr-0.5 fill-current" />
          Primary
        </Badge>
      )}

      {/* Quality Score */}
      {media.qualityScore !== undefined && media.qualityScore < 70 && (
        <Badge
          className="absolute top-1 right-1 text-[10px] px-1.5 py-0"
          variant="outline"
        >
          {Math.round(media.qualityScore)}%
        </Badge>
      )}

      {/* Type Badge */}
      <Badge
        className="absolute bottom-1 left-1 text-[9px] px-1 py-0 capitalize"
        variant="secondary"
      >
        {media.type.toLowerCase().replace('_', ' ')}
      </Badge>

      {/* Hover Actions */}
      {showActions && isHovered && !isLoading && !isFailed && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
          {onZoom && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={() => onZoom(media)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          )}
          {!media.isPrimary && onSetPrimary && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={() => onSetPrimary(media.id)}
            >
              <Star className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(media)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
              )}
              {onDownload && (
                <DropdownMenuItem onClick={() => onDownload(media)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(media.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Drag Handle */}
      {showActions && (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-4 h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
          <GripVertical className="w-4 h-4 text-white drop-shadow-md" />
        </div>
      )}
    </div>
  );
}
